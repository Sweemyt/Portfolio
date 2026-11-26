import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// NB : ces schémas migreront dans shared/schemas quand les formulaires Next.js les réutiliseront.

export const LoginSchema = z.object({
  email: z
    .email()
    .max(255)
    .transform((value) => value.trim().toLowerCase()),
  mot_de_passe: z.string().min(1).max(256),
});
export class LoginDto extends createZodDto(LoginSchema) {}

export const TotpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code à 6 chiffres attendu'),
});
export class TotpCodeDto extends createZodDto(TotpCodeSchema) {}

export const RecoveryCodeSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9\s-]{10,16}$/, 'Code de récupération invalide'),
});
export class RecoveryCodeDto extends createZodDto(RecoveryCodeSchema) {}
