import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized environment configuration.
 * All env vars are validated and exported from here —
 * no other file should read process.env directly.
 */
export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '90d',
} as const;

/**
 * Validate that all required environment variables are set.
 * Call this once at startup to fail-fast on misconfiguration.
 */
export function validateEnv(): void {
  const required: (keyof typeof env)[] = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `   Please check your .env file.`
    );
  }
}
