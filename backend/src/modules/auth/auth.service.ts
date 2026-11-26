import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { sha256Hex } from '../../common/crypto.util.js';
import type { Utilisateur } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MAX_FAILED_ATTEMPTS, MAX_LOCK_MINUTES } from './auth.constants.js';
import type { AuthContext, ClientMeta } from './auth.types.js';
import { verifyPassword } from './password.js';
import { generateRecoveryCodes, normalizeRecoveryCode } from './recovery-codes.js';
import { SessionService } from './session.service.js';
import { TotpService } from './totp.service.js';

export interface SessionGrant {
  token: string;
  maxAgeMs: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly totp: TotpService,
  ) {}

  // ------------------------------------------------------------------ étape 1 : mot de passe

  async login(
    email: string,
    password: string,
    meta: ClientMeta,
  ): Promise<SessionGrant & { etape: 'totp_requis' | 'configuration_totp' }> {
    await this.sessions.purgeExpired();

    const user = await this.prisma.utilisateur.findUnique({ where: { email } });
    if (user) this.assertNotLocked(user);

    const valid = await verifyPassword(user?.mot_de_passe ?? null, password);
    if (!user || !valid) {
      if (user) await this.registerFailure(user.id);
      this.logger.warn(`Échec de connexion (mot de passe) depuis ${meta.ip ?? 'IP inconnue'}`);
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Les compteurs d'échecs ne sont remis à zéro qu'après la 2FA, pas ici.
    const grant = await this.sessions.create(user.id, 'en_attente_2fa', meta);
    return { ...grant, etape: user.totp_active ? 'totp_requis' : 'configuration_totp' };
  }

  // ------------------------------------------------------------------ étape 2 : TOTP

  /** Première connexion : génère un secret, stocké chiffré mais pas encore actif. */
  async setupTotp(auth: AuthContext): Promise<{ secret: string; otpauth_uri: string }> {
    const { user } = auth;
    if (user.totp_active) throw new ConflictException("L'authentification à deux facteurs est déjà active");

    const secret = this.totp.createSecret();
    await this.prisma.utilisateur.update({
      where: { id: user.id },
      data: { totp_secret_chiffre: secret.encrypted },
    });
    return {
      secret: secret.plain,
      otpauth_uri: this.totp.provisioningUri(secret.plain, user.email),
    };
  }

  /** Confirme la configuration avec un premier code, active le TOTP et émet les codes de récupération. */
  async enableTotp(
    auth: AuthContext,
    code: string,
    meta: ClientMeta,
  ): Promise<SessionGrant & { codes_recuperation: string[] }> {
    const { user } = auth;
    this.assertNotLocked(user);
    if (user.totp_active) throw new ConflictException("L'authentification à deux facteurs est déjà active");
    if (!user.totp_secret_chiffre) {
      throw new BadRequestException("Lancez d'abord la configuration de l'authentification à deux facteurs");
    }

    if (!(await this.totp.verify(user.totp_secret_chiffre, code))) {
      await this.registerFailure(user.id);
      this.logger.warn(`Échec d'activation TOTP depuis ${meta.ip ?? 'IP inconnue'}`);
      throw new UnauthorizedException('Code invalide');
    }

    const codes = generateRecoveryCodes();
    await this.prisma.$transaction([
      this.prisma.utilisateur.update({ where: { id: user.id }, data: { totp_active: true } }),
      this.prisma.codeRecuperation.deleteMany({ where: { utilisateur_id: user.id } }),
      this.prisma.codeRecuperation.createMany({
        data: codes.map((c) => ({
          utilisateur_id: user.id,
          code_hash: sha256Hex(normalizeRecoveryCode(c)),
        })),
      }),
    ]);
    this.logger.log('Authentification à deux facteurs activée');

    const grant = await this.completeLogin(user.id, auth.sessionId, meta);
    return { ...grant, codes_recuperation: codes };
  }

  async verifyTotp(auth: AuthContext, code: string, meta: ClientMeta): Promise<SessionGrant> {
    const { user } = auth;
    this.assertNotLocked(user);
    if (!user.totp_active || !user.totp_secret_chiffre) {
      throw new BadRequestException("L'authentification à deux facteurs n'est pas configurée");
    }

    if (!(await this.totp.verify(user.totp_secret_chiffre, code))) {
      await this.registerFailure(user.id);
      this.logger.warn(`Échec de connexion (code TOTP) depuis ${meta.ip ?? 'IP inconnue'}`);
      throw new UnauthorizedException('Code invalide');
    }
    return this.completeLogin(user.id, auth.sessionId, meta);
  }

  /** Connexion avec un code de récupération à usage unique. */
  async verifyRecoveryCode(
    auth: AuthContext,
    code: string,
    meta: ClientMeta,
  ): Promise<SessionGrant & { codes_restants: number }> {
    const { user } = auth;
    this.assertNotLocked(user);
    if (!user.totp_active) {
      throw new BadRequestException("L'authentification à deux facteurs n'est pas configurée");
    }

    // updateMany conditionnel : la consommation du code est atomique (un seul gagnant en cas de requêtes simultanées).
    const consumed = await this.prisma.codeRecuperation.updateMany({
      where: {
        utilisateur_id: user.id,
        code_hash: sha256Hex(normalizeRecoveryCode(code)),
        date_utilisation: null,
      },
      data: { date_utilisation: new Date() },
    });
    if (consumed.count !== 1) {
      await this.registerFailure(user.id);
      this.logger.warn(`Échec de connexion (code de récupération) depuis ${meta.ip ?? 'IP inconnue'}`);
      throw new UnauthorizedException('Code invalide');
    }

    this.logger.warn('Connexion avec un code de récupération');
    const remaining = await this.prisma.codeRecuperation.count({
      where: { utilisateur_id: user.id, date_utilisation: null },
    });
    const grant = await this.completeLogin(user.id, auth.sessionId, meta);
    return { ...grant, codes_restants: remaining };
  }

  // ------------------------------------------------------------------ session

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.sessions.revokeByToken(token);
  }

  // ------------------------------------------------------------------ interne

  /** Rotation : la session « en attente » est supprimée et remplacée par une session active au jeton neuf. */
  private async completeLogin(
    userId: number,
    pendingSessionId: number,
    meta: ClientMeta,
  ): Promise<SessionGrant> {
    await this.prisma.$transaction([
      this.prisma.utilisateur.update({
        where: { id: userId },
        data: { tentatives_echouees: 0, verrouille_jusqu_a: null, derniere_connexion: new Date() },
      }),
      this.prisma.session.delete({ where: { id: pendingSessionId } }),
    ]);
    this.logger.log(`Connexion réussie depuis ${meta.ip ?? 'IP inconnue'}`);
    return this.sessions.create(userId, 'active', meta);
  }

  private assertNotLocked(user: Utilisateur): void {
    if (user.verrouille_jusqu_a && user.verrouille_jusqu_a.getTime() > Date.now()) {
      throw new HttpException(
        'Trop de tentatives, réessayez dans quelques minutes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /** Incrémente le compteur d'échecs ; au-delà du seuil, verrouille avec un délai croissant (1, 2, 4… max 15 min). */
  private async registerFailure(userId: number): Promise<void> {
    const { tentatives_echouees: attempts } = await this.prisma.utilisateur.update({
      where: { id: userId },
      data: { tentatives_echouees: { increment: 1 } },
      select: { tentatives_echouees: true },
    });
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const minutes = Math.min(2 ** (attempts - MAX_FAILED_ATTEMPTS), MAX_LOCK_MINUTES);
      await this.prisma.utilisateur.update({
        where: { id: userId },
        data: { verrouille_jusqu_a: new Date(Date.now() + minutes * 60_000) },
      });
      this.logger.warn(`Compte verrouillé ${minutes} min après ${attempts} échecs`);
    }
  }
}
