import { Router } from 'express';

import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { logMealSchema, startWorkoutSchema } from '../types/stats.schemas.js';
import * as StatsController from '../controllers/stats.controller.js';

const router = Router();

// ── All stats routes require authentication ────────────────────────
router.use(protect);

// ── Dashboard ──────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/stats/overview
 * @desc    Full dashboard payload: cards, chart, streak, progress
 * @access  Private (JWT required)
 */
router.get('/overview', StatsController.getOverview);

/**
 * @route   GET /api/v1/stats/weekly-activity
 * @desc    Last 7 days of activity for the bar chart
 * @access  Private (JWT required)
 */
router.get('/weekly-activity', StatsController.getWeeklyActivity);

// ── Quick Actions ──────────────────────────────────────────────────

/**
 * @route   POST /api/v1/stats/log-meal
 * @desc    Log a meal and add calories to today's stats
 * @access  Private (JWT required)
 *
 * Example body:
 *   { "name": "Grilled Chicken Salad", "calories": 450, "mealType": "LUNCH" }
 */
router.post('/log-meal', validate(logMealSchema), StatsController.logMeal);

/**
 * @route   POST /api/v1/stats/start-workout
 * @desc    Log a workout session and update today's stats
 * @access  Private (JWT required)
 *
 * Example body:
 *   { "type": "Running", "durationMinutes": 30, "caloriesBurned": 320 }
 */
router.post('/start-workout', validate(startWorkoutSchema), StatsController.startWorkout);

export default router;
