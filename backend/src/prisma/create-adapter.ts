import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/** Adaptateur MariaDB/MySQL partagé par l'application NestJS et les scripts CLI. */
export function createMariaDbAdapter(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });
}
