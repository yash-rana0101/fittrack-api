import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma v7 Configuration
 *
 * In Prisma 7, the database connection URL has moved out of
 * schema.prisma and into this config file. This gives us
 * programmatic control over the connection (e.g. per-environment
 * overrides, secrets from vaults, etc.).
 */
export default defineConfig({
  schema: './prisma/schema.prisma',
});
