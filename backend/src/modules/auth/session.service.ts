import { Injectable } from '@nestjs/common';
import { randomToken, sha256Hex } from '../../common/crypto.util.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  ACTIVE_TTL_MS,
  IDLE_TIMEOUT_MS,
  PENDING_TTL_MS,
  TOUCH_INTERVAL_MS,
} from './auth.constants.js';
import type { AuthContext, ClientMeta, Etape } from './auth.types.js';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crée une session. Le jeton en clair n'est renvoyé qu'ici ; seule son empreinte SHA-256 est stockée. */
  async create(
    utilisateurId: number,
    etape: Etape,
    meta: ClientMeta,
  ): Promise<{ token: string; maxAgeMs: number }> {
    const token = randomToken();
    const maxAgeMs = etape === 'active' ? ACTIVE_TTL_MS : PENDING_TTL_MS;
    const now = new Date();
    await this.prisma.session.create({
      data: {
        utilisateur_id: utilisateurId,
        token_hash: sha256Hex(token),
        etape,
        date_creation: now,
        derniere_activite: now,
        date_expiration: new Date(now.getTime() + maxAgeMs),
        adresse_ip: meta.ip?.slice(0, 45) ?? null,
        user_agent: meta.userAgent?.slice(0, 255) ?? null,
      },
    });
    return { token, maxAgeMs };
  }

  /** Retourne le contexte d'authentification, ou null si la session est absente, expirée ou à une autre étape. */
  async validate(token: string, required: Etape | 'any'): Promise<AuthContext | null> {
    const session = await this.prisma.session.findUnique({
      where: { token_hash: sha256Hex(token) },
      include: { utilisateur: true },
    });
    if (!session) return null;

    const now = Date.now();
    const idleFor = now - session.derniere_activite.getTime();
    const expired = session.date_expiration.getTime() <= now;
    const idle = session.etape === 'active' && idleFor > IDLE_TIMEOUT_MS;
    if (expired || idle) {
      await this.prisma.session.deleteMany({ where: { id: session.id } });
      return null;
    }
    if (required !== 'any' && session.etape !== required) return null;

    if (idleFor > TOUCH_INTERVAL_MS) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { derniere_activite: new Date(now) },
      });
    }
    return { sessionId: session.id, user: session.utilisateur };
  }

  async revokeByToken(token: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { token_hash: sha256Hex(token) } });
  }

  async purgeExpired(): Promise<void> {
    await this.prisma.session.deleteMany({ where: { date_expiration: { lt: new Date() } } });
  }
}
