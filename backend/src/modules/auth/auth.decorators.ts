import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AuthContext, AuthenticatedRequest, Etape } from './auth.types.js';

export const STAGE_KEY = 'auth:stage';

/** Étape de session exigée par la route : 'active' par défaut, 'en_attente_2fa' pour le tunnel 2FA. */
export const RequireStage = (stage: Etape | 'any') => SetMetadata(STAGE_KEY, stage);

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthContext =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
