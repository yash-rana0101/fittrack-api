import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import * as UserRepository from '../repositories/user.repository.js';
import type { SafeUser } from '../repositories/user.repository.js';
import type { SignupInput, LoginInput, AuthPayload } from '../types/auth.types.js';

// ── Constants ──────────────────────────────────────────────────────

/**
 * bcrypt salt rounds.
 * 12 is the OWASP-recommended minimum for production workloads
 * (≈ 250 ms per hash on modern hardware — slow enough to deter
 * brute-force, fast enough to not hurt UX).
 */
const SALT_ROUNDS = 12;

// ── Service Methods ────────────────────────────────────────────────

/**
 * Register a new user (onboarding Step 1).
 *
 * Flow:
 *  1. Check for existing user (fail-fast with a clear message).
 *  2. Hash the plaintext password with bcrypt.
 *  3. Persist the user via the repository layer.
 *  4. Generate a signed JWT so the client is immediately
 *     authenticated after registration — no redirect to login.
 *
 * @throws {AppError} 409 if the email is already taken
 */
export async function register(input: SignupInput): Promise<AuthPayload> {
  // ── 1. Duplicate check ────────────────────────────────────────
  const exists = await UserRepository.existsByEmail(input.email);
  if (exists) {
    throw new AppError(
      'An account with this email already exists',
      409,
      'EMAIL_ALREADY_EXISTS'
    );
  }

  // ── 2. Hash password ──────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // ── 3. Persist user ───────────────────────────────────────────
  const user = await UserRepository.createUser({
    email: input.email,
    password: hashedPassword,
    name: input.name,
  });

  // ── 4. Generate JWT ───────────────────────────────────────────
  const token = signToken(user.id);

  // Strip password before returning
  const safeUser = stripPassword(user);

  return { user: safeUser, token };
}

/**
 * Authenticate a user (Login).
 *
 * Flow:
 *  1. Find user by email (include password hash).
 *  2. If not found or password doesn't match, throw 401.
 *  3. Generate JWT and return AuthPayload.
 *
 * @throws {AppError} 401 on invalid credentials
 */
export async function login(input: LoginInput): Promise<AuthPayload> {
  // ── 1. Find user ───────────────────────────────────────────────
  const user = await UserRepository.findUserByEmail(input.email);
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // ── 2. Verify password ─────────────────────────────────────────
  const isValidPassword = await bcrypt.compare(input.password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // ── 3. Generate JWT ────────────────────────────────────────────
  const token = signToken(user.id);
  const safeUser = stripPassword(user);

  return { user: safeUser, token };
}

// ── Internal Helpers ───────────────────────────────────────────────

/**
 * Sign a JWT containing the user ID as the subject claim.
 *
 * Why JWT?
 *  - Stateless: the server doesn't need a session store.
 *  - The client sends the token in the Authorization header,
 *    making the API compatible with mobile, web, and CLI clients.
 *  - `expiresIn` prevents stolen tokens from living forever.
 */
function signToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as StringValue }
  );
}

/**
 * Remove the password hash from a User object.
 * Ensures we never accidentally send the hash over the wire.
 */
function stripPassword(user: { password: string; [key: string]: unknown }): SafeUser {
  const { password: _, ...safeUser } = user;
  return safeUser as SafeUser;
}
