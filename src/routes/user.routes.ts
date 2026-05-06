import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'User profile endpoint ready — controller pending');
});

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Update profile endpoint ready — controller pending');
});

export default router;
