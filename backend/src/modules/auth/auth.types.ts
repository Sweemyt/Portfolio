import type { Request } from 'express';
import type { Utilisateur } from '../../generated/prisma/client.js';

export type Etape = 'en_attente_2fa' | 'active';

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}

export interface AuthContext {
  sessionId: number;
  user: Utilisateur;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}
