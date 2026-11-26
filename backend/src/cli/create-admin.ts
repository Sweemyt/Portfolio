// Usage : npm run create-admin   (depuis backend/)
// Script autonome, sans injection de dépendances NestJS.
import 'dotenv/config';
import { createInterface } from 'node:readline';
import { z } from 'zod';
import { validateEnv } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { hashPassword } from '../modules/auth/password.js';
import { createMariaDbAdapter } from '../prisma/create-adapter.js';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    }),
  );
}

/** Saisie sans écho (mot de passe). */
function askHidden(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const writable = rl as unknown as { _writeToOutput: (text: string) => void };
  process.stdout.write(question);
  writable._writeToOutput = () => undefined;
  return new Promise((resolve) =>
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    }),
  );
}

async function main() {
  const env = validateEnv(process.env);
  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(env.DATABASE_URL) });

  try {
    if ((await prisma.utilisateur.count()) > 0) {
      console.error('Un administrateur existe déjà : le portfolio ne prévoit qu\'un seul compte.');
      process.exitCode = 1;
      return;
    }

    const nom = z.string().min(1).max(100).parse(await ask('Nom : '));
    const email = z.email().max(255).parse((await ask('Email : ')).toLowerCase());
    const password = z.string().min(12).max(128).parse(await askHidden('Mot de passe (12 caractères minimum) : '));
    if (password !== (await askHidden('Confirmer le mot de passe : '))) {
      console.error('Les mots de passe ne correspondent pas.');
      process.exitCode = 1;
      return;
    }

    await prisma.utilisateur.create({
      data: { nom, email, mot_de_passe: await hashPassword(password), role: 'admin' },
    });
    console.log("Administrateur créé. L'authentification à deux facteurs sera configurée à la première connexion.");
  } finally {
    await prisma.$disconnect();
  }
}

await main();
