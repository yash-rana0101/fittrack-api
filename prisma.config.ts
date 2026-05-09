import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma v7 Configuration
 *
 * In Prisma 7, the database connection URL has moved out of
 * schema.prisma and into this config file. This gives us
 * programmatic control over the connection (e.g. per-environment
 * overrides, secrets from vaults, etc.).
 *
 * Note: SSL (`?sslmode=require` in DATABASE_URL) is required for
 * Supabase. The pg.Pool in src/config/prisma.ts also sets
 * `ssl: { rejectUnauthorized: false }` for runtime queries.
 */
export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
