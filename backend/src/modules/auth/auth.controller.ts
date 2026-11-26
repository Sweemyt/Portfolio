import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { NoStoreInterceptor } from '../../common/no-store.interceptor.js';
import type { Env } from '../../config/env.js';
import { sessionCookieName, sessionCookieOptions } from './auth.constants.js';
import { CurrentAuth, RequireStage } from './auth.decorators.js';
import { LoginDto, RecoveryCodeDto, TotpCodeDto } from './auth.schemas.js';
import { AuthService, type SessionGrant } from './auth.service.js';
import type { AuthContext, ClientMeta } from './auth.types.js';
import { SessionGuard } from './session.guard.js';

const STRICT_LIMIT = { default: { limit: 5, ttl: 60_000 } };

function clientMeta(req: Request): ClientMeta {
  return { ip: req.ip, userAgent: req.get('user-agent')?.slice(0, 255) };
}

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(NoStoreInterceptor)
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService<Env, true>,
  ) {
    this.isProduction = config.get('NODE_ENV') === 'production';
  }

  private setSessionCookie(res: Response, grant: SessionGrant): void {
    res.cookie(
      sessionCookieName(this.isProduction),
      grant.token,
      sessionCookieOptions(this.isProduction, grant.maxAgeMs),
    );
  }

  /** Étape 1 : identifiant + mot de passe. Ouvre une session « en attente de 2FA ». */
  @Post('login')
  @HttpCode(200)
  @Throttle(STRICT_LIMIT)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { etape, ...grant } = await this.auth.login(dto.email, dto.mot_de_passe, clientMeta(req));
    this.setSessionCookie(res, grant);
    return { etape };
  }

  /** Première connexion : génère le secret TOTP (à scanner ou saisir dans l'application d'authentification). */
  @Post('totp/setup')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @RequireStage('en_attente_2fa')
  setupTotp(@CurrentAuth() auth: AuthContext) {
    return this.auth.setupTotp(auth);
  }

  /** Première connexion : confirme avec un code, active le TOTP et renvoie les codes de récupération (affichés une seule fois). */
  @Post('totp/enable')
  @HttpCode(200)
  @Throttle(STRICT_LIMIT)
  @UseGuards(SessionGuard)
  @RequireStage('en_attente_2fa')
  async enableTotp(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: TotpCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { codes_recuperation, ...grant } = await this.auth.enableTotp(auth, dto.code, clientMeta(req));
    this.setSessionCookie(res, grant);
    return { codes_recuperation };
  }

  /** Étape 2 : code TOTP. Ouvre la session active. */
  @Post('totp/verify')
  @HttpCode(200)
  @Throttle(STRICT_LIMIT)
  @UseGuards(SessionGuard)
  @RequireStage('en_attente_2fa')
  async verifyTotp(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: TotpCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setSessionCookie(res, await this.auth.verifyTotp(auth, dto.code, clientMeta(req)));
    return { ok: true };
  }

  /** Étape 2 (secours) : code de récupération à usage unique. */
  @Post('recovery/verify')
  @HttpCode(200)
  @Throttle(STRICT_LIMIT)
  @UseGuards(SessionGuard)
  @RequireStage('en_attente_2fa')
  async verifyRecovery(
    @CurrentAuth() auth: AuthContext,
    @Body() dto: RecoveryCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { codes_restants, ...grant } = await this.auth.verifyRecoveryCode(auth, dto.code, clientMeta(req));
    this.setSessionCookie(res, grant);
    return { codes_restants };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentAuth() { user }: AuthContext) {
    return { id: user.id, nom: user.nom, email: user.email, role: user.role };
  }

  /** Révoque la session (quelle que soit son étape) et efface le cookie. Idempotent. */
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const name = sessionCookieName(this.isProduction);
    const token: unknown = req.cookies?.[name];
    await this.auth.logout(typeof token === 'string' ? token : undefined);
    res.clearCookie(name, sessionCookieOptions(this.isProduction, 0));
  }
}
