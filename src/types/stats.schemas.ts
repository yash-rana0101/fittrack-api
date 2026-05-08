import { z } from 'zod';

/**
 * Zod schemas for Stats quick-action endpoints.
 * Separated from stats.types.ts to keep runtime validation
 * schemas distinct from pure TypeScript interfaces.
 */

// ── Log Meal ───────────────────────────────────────────────────────

export const logMealSchema = z.object({
  name: z
    .string({ error: 'Meal name is required' })
    .trim()
    .min(1, 'Meal name cannot be empty')
    .max(200, 'Meal name must be at most 200 characters'),

  calories: z
    .number({ error: 'Calories must be a number' })
    .int('Calories must be a whole number')
    .min(1, 'Calories must be at least 1')
    .max(10000, 'Calories must be at most 10,000'),

  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], {
    error: 'Meal type must be one of: BREAKFAST, LUNCH, DINNER, SNACK',
  }),
});

// ── Start Workout ──────────────────────────────────────────────────

export const startWorkoutSchema = z.object({
  type: z
    .string({ error: 'Workout type is required' })
    .trim()
    .min(1, 'Workout type cannot be empty')
    .max(100, 'Workout type must be at most 100 characters'),

  durationMinutes: z
    .number({ error: 'Duration must be a number' })
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(600, 'Duration must be at most 600 minutes'),

  caloriesBurned: z
    .number()
    .int('Calories must be a whole number')
    .min(0, 'Calories cannot be negative')
    .max(10000, 'Calories must be at most 10,000')
    .optional(),
});
