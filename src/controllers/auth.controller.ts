import type { Request, Response, NextFunction } from 'express';

import * as AuthService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import type { SignupInput, LoginInput } from '../types/auth.types.js';

/**
 * Auth Controller
 *
 * Thin HTTP adapter — it extracts the validated payload from
 * `req.body`, delegates to the AuthService, and formats the
 * response envelope. No business logic lives here.
 */

/**
 * POST /api/v1/auth/signup
 *
 * Creates a new user account (onboarding Step 1).
 * The request body has already been validated by the Zod middleware
 * so we can safely cast it to `SignupInput`.
 *
 * Returns:
 *  201 — { success, statusCode, message, data: { user, token }, timestamp }
 */
export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as SignupInput;

    const payload = await AuthService.register(input);

    sendSuccess(res, 201, 'Account created successfully — welcome to FitTrack! 🎉', payload);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/login
 *
 * Authenticates a user and returns a JWT token.
 * The request body has already been validated by the Zod middleware.
 *
 * Returns:
 *  200 — { success, statusCode, message, data: { user, token }, timestamp }
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as LoginInput;

    const payload = await AuthService.login(input);

    sendSuccess(res, 200, 'Login successful — welcome back! 👋', payload);
  } catch (err) {
    next(err);
  }
}
