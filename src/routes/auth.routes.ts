import { Router } from 'express';
import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', (req: Request, res: Response) => {
  sendSuccess(res, 201, 'Registration endpoint ready — controller pending');
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & return JWT
 * @access  Public
 */
router.post('/login', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Login endpoint ready — controller pending');
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout', (req: Request, res: Response) => {
  sendSuccess(res, 200, 'Logout endpoint ready — controller pending');
});

export default router;
