import type { CookieOptions } from 'express';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Durée de validité d'une session « mot de passe validé, 2FA en attente ». */
export const PENDING_TTL_MS = 10 * MINUTE;
/** Durée absolue d'une session active. */
export const ACTIVE_TTL_MS = 7 * 24 * HOUR;
/** Une session active inutilisée pendant cette durée est invalidée. */
export const IDLE_TIMEOUT_MS = 12 * HOUR;
/** Intervalle minimal entre deux mises à jour de derniere_activite. */
export const TOUCH_INTERVAL_MS = 5 * MINUTE;

/** Nombre d'échecs avant verrouillage temporaire du compte. */
export const MAX_FAILED_ATTEMPTS = 5;
/** Durée maximale d'un verrouillage (minutes). Il double à chaque échec supplémentaire. */
export const MAX_LOCK_MINUTES = 15;

/** Le préfixe __Host- impose Secure + Path=/ + pas de Domain (production uniquement : HTTPS requis). */
export function sessionCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-session' : 'session';
}

export function sessionCookieOptions(isProduction: boolean, maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}
