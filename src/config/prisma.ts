import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Global Prisma Client singleton.
 *
 * Why a singleton?
 *  - PrismaClient manages a connection pool internally.
 *  - Creating multiple instances exhausts the database connection limit.
 *  - In development, hot-reload (tsx watch) can leak instances — we
 *    cache on `globalThis` to prevent that.
 *
 * Usage:
 *   import { prisma } from '@/config/prisma.js';
 *   const user = await prisma.user.findUnique({ where: { email } });
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
