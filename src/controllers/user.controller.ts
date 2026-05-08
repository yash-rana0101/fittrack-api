import type { Request, Response, NextFunction } from 'express';

import * as UserService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import type { OnboardingInput } from '../types/onboarding.types.js';

/**
 * User Controller
 *
 * Thin HTTP adapter for user profile operations.
 * The `protect` middleware has already verified the JWT and
 * attached `req.userId` before any of these handlers run.
 */

/**
 * PATCH /api/v1/users/onboarding
 *
 * Updates the user's profile for the given onboarding step.
 * The request body MUST include a `step` field (2, 3, 4, or 5)
 * which the Zod discriminated union uses to select the correct
 * validation schema.
 *
 * Returns:
 *  200 — { success, data: SafeUser, timestamp }
 */
export async function updateOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Authentication context missing', 401, 'UNAUTHORIZED');
    }

    const input = req.body as OnboardingInput;

    const user = await UserService.updateOnboarding(userId, input);

    // Step-specific success messages for the premium UX feel
    const messages: Record<number, string> = {
      2: 'Personal details saved — looking great! 💪',
      3: 'Goals locked in — let\'s crush them! 🎯',
      4: input.step === 4 && ('skip' in input && input.skip)
        ? 'Step skipped — you can set this later ⏭️'
        : 'Activity level saved — we\'ll tailor your plan! 🏃',
      5: 'Profile complete — welcome to FitTrack! 🚀',
    };

    sendSuccess(res, 200, messages[input.step] ?? 'Profile updated', { user });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/users/me
 *
 * Returns the authenticated user's full profile (minus password).
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('Authentication context missing', 401, 'UNAUTHORIZED');
    }

    const user = await UserService.getProfile(userId);

    sendSuccess(res, 200, 'Profile retrieved successfully', { user });
  } catch (err) {
    next(err);
  }
}
