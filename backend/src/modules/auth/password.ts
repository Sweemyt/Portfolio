import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';

const OPTIONS = { type: argon2.argon2id } as const;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, OPTIONS);
}

let dummyHash: Promise<string> | undefined;

/**
 * Vérifie un mot de passe. Si l'utilisateur n'existe pas (hash === null), on vérifie
 * quand même contre un faux hash : le temps de réponse ne révèle pas l'existence du compte.
 */
export async function verifyPassword(hash: string | null, password: string): Promise<boolean> {
  if (hash === null) {
    dummyHash ??= argon2.hash(randomBytes(16).toString('hex'), OPTIONS);
    await argon2.verify(await dummyHash, password).catch(() => false);
    return false;
  }
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
