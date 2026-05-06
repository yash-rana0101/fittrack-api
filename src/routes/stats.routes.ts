import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * @route   GET /api/v1/stats/overview
 * @desc    Get fitness stats overview (weekly/monthly summary)
 * @access  Private
 */
router.get('/overview', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Stats overview endpoint ready — controller pending');
});

/**
 * @route   GET /api/v1/stats/progress
 * @desc    Get user progress over time
 * @access  Private
 */
router.get('/progress', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Progress endpoint ready — controller pending');
});

export default router;
