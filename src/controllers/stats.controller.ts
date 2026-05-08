import type { Request, Response, NextFunction } from 'express';

import * as StatsService from '../services/stats.service.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import type { LogMealInput, StartWorkoutInput } from '../types/stats.types.js';

/**
 * Stats Controller
 *
 * Thin HTTP adapter for dashboard / fitness stats.
 * The `protect` middleware has already verified the JWT and
 * attached `req.userId` before any of these handlers run.
 */

// ── Helper ─────────────────────────────────────────────────────────

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new AppError('Authentication context missing', 401, 'UNAUTHORIZED');
  }
  return req.userId;
}

// ── Dashboard ──────────────────────────────────────────────────────

/**
 * GET /api/v1/stats/overview
 *
 * Returns the full dashboard payload: metric cards, weekly chart
 * data, streak count, and overall goal progress — everything the
 * frontend needs in a single round-trip.
 */
export async function getOverview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const overview = await StatsService.getDashboardOverview(userId);

    sendSuccess(res, 200, 'Dashboard overview loaded', overview);
  } catch (err) {
    next(err);
  }
}

// ── Charts ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/stats/weekly-activity
 *
 * Returns the last 7 days of activity data, formatted as
 * chart-ready data points for the Weekly Activity bar chart.
 */
export async function getWeeklyActivity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUserId(req);

    const activity = await StatsService.getWeeklyActivity(userId);

    sendSuccess(res, 200, 'Weekly activity data loaded', { weeklyActivity: activity });
  } catch (err) {
    next(err);
  }
}

// ── Quick Actions ──────────────────────────────────────────────────

/**
 * POST /api/v1/stats/log-meal
 *
 * Logs a meal and adds its calories to today's stats.
 * This is a placeholder that updates the aggregate; a future
 * phase will add a dedicated Meals model with macro detail.
 */
export async function logMeal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const input = req.body as LogMealInput;

    const stats = await StatsService.logMeal(userId, input);

    sendSuccess(res, 200, `Meal logged — ${input.calories} kcal added 🍽️`, { stats });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/stats/start-workout
 *
 * Logs a workout session and updates today's stats.
 * This is a placeholder that updates the aggregate; a future
 * phase will add a dedicated Workouts model with exercise detail.
 */
export async function startWorkout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = requireUserId(req);
    const input = req.body as StartWorkoutInput;

    const stats = await StatsService.startWorkout(userId, input);

    sendSuccess(res, 200, `Workout logged — ${input.durationMinutes} min 💪`, { stats });
  } catch (err) {
    next(err);
  }
}
