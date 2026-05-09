import { PrismaClient } from '../../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env.js';

/**
 * Global Prisma Client singleton (Prisma v7 + PostgreSQL).
 *
 * Why a singleton?
 *  - PrismaClient manages a connection pool internally.
 *  - Creating multiple instances exhausts the database connection limit.
 *  - In development, hot-reload (tsx watch) can leak instances — we
 *    cache on `globalThis` to prevent that.
 *
 * Prisma v7 requires an explicit driver adapter instead of reading
 * the DATABASE_URL from the schema file.
 *
 * Usage:
 *   import { prisma } from '@/config/prisma.js';
 *   const user = await prisma.user.findUnique({ where: { email } });
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Supabase (TLS)
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
