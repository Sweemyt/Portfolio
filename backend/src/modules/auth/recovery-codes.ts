import { randomBytes } from 'node:crypto';

// 32 caractères (sans I, O, 0, 1) : 256 est divisible par 32, donc le tirage est uniforme.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Génère des codes de récupération au format XXXXX-XXXXX (50 bits d'entropie chacun). */
export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const chars = Array.from(randomBytes(10), (byte) => ALPHABET.charAt(byte % 32)).join('');
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase();
}
