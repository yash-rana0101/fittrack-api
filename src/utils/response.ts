import type { Response } from 'express';
import type { ApiResponse } from '../types/api.types.js';

/**
 * Send a standardized success response.
 * Usage:  sendSuccess(res, 200, 'User fetched', { user })
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void {
  const body: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(body);
}

/**
 * Send a standardized error response.
 * Typically called from the global error middleware, but available
 * for explicit use in controllers when needed.
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code: string = 'ERROR',
  details?: string
): void {
  const body: ApiResponse = {
    success: false,
    statusCode,
    message,
    error: { code, details },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(body);
}
