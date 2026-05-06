import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import type { ApiResponse } from '../types/api.types.js';

/**
 * Global error-handling middleware.
 *
 * Express recognises this as an error handler because it has 4 parameters.
 * Mount it AFTER all routes so it catches anything that falls through.
 *
 * Behaviour:
 *  - Known operational errors (AppError) → returns the attached status + code.
 *  - Unknown / programmer errors         → returns 500 with a safe message.
 *  - Stack traces are only included in development mode.
 */
export function globalErrorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Determine status & code ──────────────────────────────────────
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;
  const code = isOperational ? err.code : 'INTERNAL_SERVER_ERROR';

  // ── Log for observability ────────────────────────────────────────
  if (!isOperational) {
    console.error('UNHANDLED ERROR:', err);
  } else {
    console.warn(`Operational error [${code}]:`, err.message);
  }

  // ── Build response body ──────────────────────────────────────────
  const body: ApiResponse = {
    success: false,
    statusCode,
    message: isOperational ? err.message : 'An unexpected error occurred. Please try again later.',
    error: {
      code,
      details: isOperational ? err.message : undefined,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(body);
}

/**
 * Catch-all for routes that don't match any defined endpoint.
 * Mount this AFTER all route registrations but BEFORE the error handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}
