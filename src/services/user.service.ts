import { AppError } from '../utils/AppError.js';
import * as UserRepository from '../repositories/user.repository.js';
import type { SafeUser } from '../repositories/user.repository.js';
import type {
  OnboardingInput,
  Step2Input,
  Step3Input,
  Step4Input,
  Step5Input,
} from '../types/onboarding.types.js';

/**
 * User Service
 *
 * Encapsulates business logic for user profile operations.
 * The "single update method" pattern lets the frontend POST
 * each onboarding step independently — the user can navigate
 * forward/back seamlessly and each step is saved atomically.
 *
 * Why this supports "Smooth Transitions" & "Premium Experience":
 *  - Each step saves immediately: if the app crashes or the user
 *    quits, progress is never lost — they resume right where they
 *    left off (no "start over" frustration).
 *  - Steps 4 & 5 support explicit skip: the service handles
 *    skip gracefully, so the UI animation can transition without
 *    waiting for validation to finish.
 *  - A single PATCH endpoint means the client only manages one
 *    API call per step, reducing complexity and latency.
 */

// ── Public Methods ─────────────────────────────────────────────────

/**
 * Route an onboarding payload to the correct step handler.
 *
 * The discriminated union schema guarantees `input.step` is 2|3|4|5
 * by the time this method is called, so the switch is exhaustive.
 */
export async function updateOnboarding(
  userId: string,
  input: OnboardingInput
): Promise<SafeUser> {
  // Ensure user exists before any mutation
  const existingUser = await UserRepository.findUserById(userId);
  if (!existingUser) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  switch (input.step) {
    case 2:
      return handleStep2(userId, input);
    case 3:
      return handleStep3(userId, input);
    case 4:
      return handleStep4(userId, input);
    case 5:
      return handleStep5(userId, input);
  }
}

/**
 * Get the authenticated user's profile.
 */
export async function getProfile(userId: string): Promise<SafeUser> {
  const user = await UserRepository.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  return user;
}

// ── Step Handlers ──────────────────────────────────────────────────

/**
 * Step 2: Personal Details
 * Saves date of birth, gender, height, and weight.
 */
async function handleStep2(userId: string, input: Step2Input): Promise<SafeUser> {
  return UserRepository.updateUser(userId, {
    dateOfBirth: new Date(input.dateOfBirth),
    gender: input.gender,
    height: input.height,
    weight: input.weight,
  });
}

/**
 * Step 3: Fitness Goals
 * Saves the selected goals array (1–3 items).
 */
async function handleStep3(userId: string, input: Step3Input): Promise<SafeUser> {
  return UserRepository.updateUser(userId, {
    goals: input.goals,
  });
}

/**
 * Step 4: Activity Level (Skippable)
 * If `skip: true` or `activityLevel` is absent, the step
 * is recorded as skipped and the user advances without data.
 */
async function handleStep4(userId: string, input: Step4Input): Promise<SafeUser> {
  if (input.skip || !input.activityLevel) {
    // Nothing to persist — return the current profile so the
    // frontend can transition to Step 5 seamlessly.
    const user = await UserRepository.findUserById(userId);
    return user!;
  }

  return UserRepository.updateUser(userId, {
    activityLevel: input.activityLevel,
  });
}

/**
 * Step 5: Profile Setup (Skippable)
 * Saves username, bio, and/or avatarUrl if provided.
 * Always marks onboarding as complete — the final step.
 *
 * The avatarUrl field accepts any valid URL for now; a future
 * iteration will replace this with a Cloudinary/S3 upload
 * pipeline that generates signed URLs.
 */
async function handleStep5(userId: string, input: Step5Input): Promise<SafeUser> {
  // Build the update payload — only include non-undefined fields
  // so we don't overwrite existing data with null if the user skips.
  const updateData: Record<string, unknown> = {
    onboardingComplete: true,
  };

  if (input.username !== undefined) {
    // Check uniqueness before saving
    await assertUsernameAvailable(input.username, userId);
    updateData.username = input.username;
  }

  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }

  if (input.avatarUrl !== undefined) {
    updateData.avatarUrl = input.avatarUrl;
  }

  return UserRepository.updateUser(userId, updateData);
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Verify the requested username isn't taken by another user.
 * The DB has a unique constraint, but checking beforehand gives
 * us a clean 409 error instead of an opaque Prisma exception.
 */
async function assertUsernameAvailable(
  username: string,
  currentUserId: string
): Promise<void> {
  const existing = await UserRepository.findUserByUsername(username);
  if (existing && existing.id !== currentUserId) {
    throw new AppError(
      `Username "${username}" is already taken`,
      409,
      'USERNAME_TAKEN'
    );
  }
}
