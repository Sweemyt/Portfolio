import { z } from 'zod';

/**
 * Variables d'environnement du backend, validées au démarrage.
 * Une variable manquante ou invalide empêche l'application de démarrer.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Le backend n'écoute que sur la boucle locale : seul Next.js (rewrites) l'atteint.
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  // Origine du frontend (utilisée plus tard pour la vérification de l'en-tête Origin).
  FRONTEND_ORIGIN: z.url().default('http://localhost:3000'),
  // Clé AES-256 (32 octets en hexadécimal) pour chiffrer le secret TOTP en base.
  TOTP_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, '64 caractères hexadécimaux attendus (32 octets)'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Configuration invalide :\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
