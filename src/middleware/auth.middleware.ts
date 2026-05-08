import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// ── Augment Express Request ────────────────────────────────────────
// Adds `userId` so downstream handlers can identify the caller
// without re-decoding the token.

declare global {
  namespace Express {
    interface Request {
      userId?: string | undefined;
    }
  }
}

/**
 * JWT Authentication Middleware
 *
 * Extracts and verifies a Bearer token from the `Authorization` header.
 * On success, attaches `req.userId` for all downstream handlers.
 *
 * Rejection reasons (all produce 401):
 *  - Missing Authorization header
 *  - Malformed header (not "Bearer <token>")
 *  - Expired or tampered token
 *
 * Usage:
 *   import { protect } from '../middleware/auth.middleware.js';
 *   router.patch('/onboarding', protect, controller.updateOnboarding);
 */
export function protect(req: Request, _res: Response, next: NextFunction): void {
  try {
    // ── 1. Extract token ──────────────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        'Authentication required — please sign in',
        401,
        'UNAUTHORIZED'
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError(
        'Authentication required — malformed token',
        401,
        'UNAUTHORIZED'
      );
    }

    // ── 2. Verify token ──────────────────────────────────────────
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

    if (!decoded.sub) {
      throw new AppError(
        'Invalid token — missing user identifier',
        401,
        'INVALID_TOKEN'
      );
    }

    // ── 3. Attach userId to request ───────────────────────────────
    req.userId = decoded.sub;

    next();
  } catch (err) {
    // jwt.verify throws its own errors for expired / invalid tokens
    if (err instanceof jwt.JsonWebTokenError) {
      next(
        new AppError(
          'Invalid or expired token — please sign in again',
          401,
          'INVALID_TOKEN'
        )
      );
      return;
    }

    next(err);
  }
}
