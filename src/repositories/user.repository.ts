import { prisma } from '../config/prisma.js';
import type { Prisma, User } from '../../prisma/generated/prisma/client.js';

/**
 * User Repository
 *
 * This is the ONLY place in the application that directly interacts
 * with the `prisma.user` model. Services call these methods instead
 * of using Prisma directly, which gives us:
 *
 *  1. A single place to update if the DB schema changes.
 *  2. Easy mocking in unit tests — swap the repository, not Prisma.
 *  3. Clear separation: business rules live in services, data access lives here.
 */

// ── Type Aliases ───────────────────────────────────────────────────

/** Fields required to create a new user (onboarding Step 1). */
export type CreateUserInput = Pick<Prisma.UserCreateInput, 'email' | 'password' | 'name'>;

/** All user fields minus the password hash — safe to send over the wire. */
export type SafeUser = Omit<User, 'password'>;

// ── Select clause to exclude password from queries ─────────────────
const safeUserSelect: Prisma.UserSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  email: true,
  name: true,
  dateOfBirth: true,
  gender: true,
  height: true,
  weight: true,
  goals: true,
  activityLevel: true,
  username: true,
  bio: true,
  avatarUrl: true,
  onboardingComplete: true,
  // password: false  — omitted intentionally
};

// ── Repository Methods ─────────────────────────────────────────────

/**
 * Create a new user document.
 *
 * @param data - email, hashed password, and name (Step 1 of onboarding)
 * @returns The newly created user (with password included so the
 *          auth service can return a JWT immediately after registration)
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  return prisma.user.create({ data });
}

/**
 * Find a user by email address.
 * Returns the FULL document including the password hash so the
 * auth service can verify credentials during login.
 *
 * @returns The user or null if not found
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Find a user by ID, excluding the password hash.
 * Used for profile lookups where the password is not needed.
 *
 * @returns The safe user or null if not found
 */
export async function findUserById(id: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  }) as Promise<SafeUser | null>;
}

/**
 * Update a user's profile data.
 * Accepts any subset of updatable user fields.
 *
 * @returns The updated user without the password hash
 */
export async function updateUser(
  id: string,
  data: Prisma.UserUpdateInput
): Promise<SafeUser> {
  return prisma.user.update({
    where: { id },
    data,
    select: safeUserSelect,
  }) as Promise<SafeUser>;
}

/**
 * Check if a user with the given email already exists.
 * Cheaper than a full findUnique — only checks for existence.
 */
export async function existsByEmail(email: string): Promise<boolean> {
  const count = await prisma.user.count({ where: { email } });
  return count > 0;
}

/**
 * Find a user by username, excluding the password hash.
 * Used during onboarding Step 5 to check username availability.
 *
 * @returns The safe user or null if not found
 */
export async function findUserByUsername(username: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { username },
    select: safeUserSelect,
  }) as Promise<SafeUser | null>;
}

