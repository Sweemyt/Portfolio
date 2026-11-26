import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protection CSRF complémentaire à SameSite : toute requête qui modifie des données
 * doit venir de l'origine du frontend. Les clients hors navigateur (sans en-tête Origin)
 * ne sont pas concernés : le CSRF repose sur l'envoi automatique de cookies par un navigateur.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigin: string;

  constructor(config: ConfigService<Env, true>) {
    this.allowedOrigin = new URL(config.getOrThrow<string>('FRONTEND_ORIGIN')).origin;
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const origin = req.get('origin');
    if (origin !== undefined && origin !== this.allowedOrigin) {
      throw new ForbiddenException('Origine non autorisée');
    }
    if (req.get('sec-fetch-site') === 'cross-site') {
      throw new ForbiddenException('Origine non autorisée');
    }
    return true;
  }
}
