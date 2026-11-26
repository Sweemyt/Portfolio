import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Env } from '../../config/env.js';
import { STAGE_KEY } from './auth.decorators.js';
import { sessionCookieName } from './auth.constants.js';
import type { AuthenticatedRequest, Etape } from './auth.types.js';
import { SessionService } from './session.service.js';

/** À appliquer avec @UseGuards(SessionGuard) sur toute route réservée à l'administrateur. */
@Injectable()
export class SessionGuard implements CanActivate {
  private readonly cookieName: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    config: ConfigService<Env, true>,
  ) {
    this.cookieName = sessionCookieName(config.get('NODE_ENV') === 'production');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const stage =
      this.reflector.getAllAndOverride<Etape | 'any'>(STAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'active';

    const token: unknown = req.cookies?.[this.cookieName];
    if (typeof token !== 'string' || token === '') throw new UnauthorizedException();

    const auth = await this.sessions.validate(token, stage);
    if (!auth) throw new UnauthorizedException();

    req.auth = auth;
    return true;
  }
}
