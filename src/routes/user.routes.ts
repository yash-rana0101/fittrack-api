import { Router } from 'express';

import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { onboardingSchema } from '../types/onboarding.types.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

// ── All user routes require authentication ─────────────────────────
router.use(protect);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private (JWT required)
 */
router.get('/me', UserController.getMe);

/**
 * @route   PATCH /api/v1/users/onboarding
 * @desc    Update onboarding step (2, 3, 4, or 5)
 * @access  Private (JWT required)
 *
 * Pipeline:
 *   1. protect             — verify JWT, attach req.userId
 *   2. validate(schema)    — Zod discriminated union picks the
 *                            correct schema based on `step` field
 *   3. UserController      — route to step handler, return profile
 *
 * Example body (Step 2):
 *   { "step": 2, "dateOfBirth": "1995-06-15T00:00:00Z",
 *     "gender": "MALE", "height": 180, "weight": 75 }
 *
 * Example body (Step 4 — skip):
 *   { "step": 4, "skip": true }
 */
router.patch('/onboarding', validate(onboardingSchema), UserController.updateOnboarding);

export default router;
