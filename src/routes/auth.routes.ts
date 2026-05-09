import { Router } from 'express';
import type { Request, Response } from 'express';

import { validate } from '../middleware/validation.middleware.js';
import { signupSchema, loginSchema } from '../types/auth.types.js';
import * as AuthController from '../controllers/auth.controller.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register a new user (Onboarding Step 1)
 * @access  Public
 *
 * Pipeline:
 *   1. validate(signupSchema) — Zod validates & sanitises body
 *   2. AuthController.signup  — hashes pw, creates user, returns JWT
 */
router.post('/signup', validate(signupSchema), AuthController.signup);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & return JWT
 * @access  Public
 */
router.post('/login', validate(loginSchema), AuthController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Logout endpoint ready — controller pending');
});

export default router;
