import { z } from 'zod';
import type { SafeUser } from '../repositories/user.repository.js';

// ── Zod Schemas ────────────────────────────────────────────────────

/**
 * Step 1: Create Account — request body schema.
 *
 * Password policy (Apple-level):
 *  - Minimum 8 characters
 *  - At least 1 uppercase letter
 *  - At least 1 lowercase letter
 *  - At least 1 digit
 *  - At least 1 special character
 *
 * These rules mirror the frontend password strength indicator so
 * the API can never be weaker than what the UI enforces.
 */
export const signupSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),

  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),

  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
});

/** Inferred TypeScript type from the Zod schema. */
export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Step 1: Login — request body schema.
 */
export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Response Types ─────────────────────────────────────────────────

/** Shape returned to the client after successful registration / login. */
export interface AuthPayload {
  user: SafeUser;
  token: string;
}
