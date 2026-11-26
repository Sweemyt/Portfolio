import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import { decryptSecret, encryptSecret } from '../../common/crypto.util.js';
import type { Env } from '../../config/env.js';

const ISSUER = 'Portfolio';

@Injectable()
export class TotpService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get key(): string {
    return this.config.getOrThrow<string>('TOTP_ENCRYPTION_KEY');
  }

  /** Nouveau secret : `plain` est montré une fois à l'utilisateur, `encrypted` est stocké. */
  createSecret(): { plain: string; encrypted: string } {
    const plain = generateSecret();
    return { plain, encrypted: encryptSecret(plain, this.key) };
  }

  provisioningUri(plainSecret: string, label: string): string {
    return generateURI({ issuer: ISSUER, label, secret: plainSecret });
  }

  /** Tolérance de ±30 s (une période) pour absorber le décalage d'horloge. */
  async verify(encryptedSecret: string, token: string): Promise<boolean> {
    const secret = decryptSecret(encryptedSecret, this.key);
    const result = await verifyTotp({ secret, token, epochTolerance: 30 });
    return result.valid;
  }
}
