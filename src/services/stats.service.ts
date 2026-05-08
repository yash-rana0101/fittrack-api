import type { DashboardStats } from '../../prisma/generated/prisma/client.js';

import * as StatsRepository from '../repositories/stats.repository.js';
import * as UserRepository from '../repositories/user.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  DashboardOverview,
  MetricCard,
  WeeklyActivityPoint,
  LogMealInput,
  StartWorkoutInput,
} from '../types/stats.types.js';

/**
 * Stats Service
 *
 * Transforms raw DashboardStats rows into the exact shapes the
 * frontend needs. The "Clean Dashboard" requirement means:
 *
 *  1. Zero client-side aggregation — the API returns pre-computed
 *     cards, chart data, streaks, and goal progress.
 *  2. Consistent structure — even when the user has no data yet,
 *     every field is present with sensible defaults so the UI never
 *     shows broken states or loading skeletons.
 *  3. Apple-level polish — metric labels, units, subtitles, and
 *     progress percentages are all computed server-side, making
 *     the frontend rendering layer paper-thin.
 */

// ── Day name constants ─────────────────────────────────────────────
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ── Public Methods ─────────────────────────────────────────────────

/**
 * Build the complete dashboard overview for the authenticated user.
 *
 * This is the single API call that powers the entire post-login
 * dashboard view — cards, charts, streak, and goal progress.
 */
export async function getDashboardOverview(
  userId: string
): Promise<DashboardOverview> {
  // Verify user exists
  const user = await UserRepository.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Fetch today's stats and last 7 days in parallel
  const [todayStats, weeklyStats] = await Promise.all([
    StatsRepository.findTodayStats(userId),
    getLastNDaysStats(userId, 7),
  ]);

  // Build response components
  const cards = buildMetricCards(todayStats);
  const weeklyActivity = buildWeeklyActivity(weeklyStats);
  const streakDays = calculateStreak(weeklyStats);
  const goalProgress = calculateGoalProgress(todayStats);

  return {
    cards,
    weeklyActivity,
    streakDays,
    goalProgress,
    todayRaw: todayStats,
  };
}

/**
 * Fetch weekly activity data for the bar chart.
 * Exposed separately so the frontend can refresh chart data
 * without re-fetching the entire dashboard overview.
 */
export async function getWeeklyActivity(
  userId: string
): Promise<WeeklyActivityPoint[]> {
  const user = await UserRepository.findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  const weeklyStats = await getLastNDaysStats(userId, 7);
  return buildWeeklyActivity(weeklyStats);
}

/**
 * Quick Action: Log a meal.
 *
 * Adds the meal's calories to today's stats record.
 * In a future phase, this will persist to a dedicated Meals table
 * with full macro tracking; for now it updates the aggregate.
 */
export async function logMeal(
  userId: string,
  input: LogMealInput
): Promise<DashboardStats> {
  const today = getStartOfDay();
  const existing = await StatsRepository.findTodayStats(userId);

  const currentCalories = existing?.caloriesBurned ?? 0;

  return StatsRepository.upsertDailyStats(userId, today, {
    caloriesBurned: currentCalories + input.calories,
  });
}

/**
 * Quick Action: Start / log a workout.
 *
 * Increments today's workout count and adds minutes + calories.
 * In a future phase, this will create a dedicated Workout record
 * with exercise-level detail; for now it updates the aggregate.
 */
export async function startWorkout(
  userId: string,
  input: StartWorkoutInput
): Promise<DashboardStats> {
  const today = getStartOfDay();
  const existing = await StatsRepository.findTodayStats(userId);

  const currentWorkouts = existing?.workoutsCount ?? 0;
  const currentMinutes = existing?.workoutMinutes ?? 0;
  const currentCalories = existing?.caloriesBurned ?? 0;

  return StatsRepository.upsertDailyStats(userId, today, {
    workoutsCount: currentWorkouts + 1,
    workoutMinutes: currentMinutes + input.durationMinutes,
    caloriesBurned: currentCalories + (input.caloriesBurned ?? 0),
  });
}

// ── Card Builders ──────────────────────────────────────────────────

/**
 * Transform today's stats into an ordered array of MetricCards.
 * Each card is fully pre-computed: label, value, goal, unit,
 * progress %, and a human-readable subtitle — the frontend
 * just iterates and renders.
 */
function buildMetricCards(today: DashboardStats | null): MetricCard[] {
  const cal = today?.caloriesBurned ?? 0;
  const calGoal = today?.caloriesGoal ?? 2000;
  const workouts = today?.workoutsCount ?? 0;
  const minutes = today?.workoutMinutes ?? 0;
  const steps = today?.stepsCount ?? 0;
  const stepsGoal = today?.stepsGoal ?? 10000;
  const water = today?.waterIntakeMl ?? 0;
  const waterGoal = today?.waterGoalMl ?? 2500;
  const sleep = today?.sleepHours ?? 0;
  const sleepGoal = today?.sleepGoalHours ?? 8;

  return [
    {
      label: 'Calories Burned',
      value: cal,
      goal: calGoal,
      unit: 'kcal',
      progress: clampPercent(cal, calGoal),
      subtitle: `of ${calGoal.toLocaleString()} kcal`,
    },
    {
      label: 'Workouts',
      value: workouts,
      unit: 'sessions',
      progress: clampPercent(workouts, 3), // baseline 3/day
      subtitle: `${minutes} min total`,
    },
    {
      label: 'Steps',
      value: steps,
      goal: stepsGoal,
      unit: 'steps',
      progress: clampPercent(steps, stepsGoal),
      subtitle: `of ${stepsGoal.toLocaleString()} steps`,
    },
    {
      label: 'Water Intake',
      value: water,
      goal: waterGoal,
      unit: 'ml',
      progress: clampPercent(water, waterGoal),
      subtitle: `of ${waterGoal.toLocaleString()} ml`,
    },
    {
      label: 'Sleep',
      value: sleep,
      goal: sleepGoal,
      unit: 'hrs',
      progress: clampPercent(sleep, sleepGoal),
      subtitle: `of ${sleepGoal} hrs`,
    },
  ];
}

// ── Chart Builders ─────────────────────────────────────────────────

/**
 * Build the 7-point Weekly Activity dataset for the bar chart.
 *
 * Returns exactly 7 entries (one per day), filling in zeros for
 * days with no data so the chart always has consistent spacing.
 */
function buildWeeklyActivity(
  stats: Map<string, DashboardStats>
): WeeklyActivityPoint[] {
  const points: WeeklyActivityPoint[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const key = toDateKey(date);
    const dayStats = stats.get(key);
    const dayIndex = date.getDay();

    points.push({
      day: SHORT_DAYS[dayIndex] ?? '',
      date: date.toISOString(),
      activeMinutes: dayStats?.workoutMinutes ?? 0,
      caloriesBurned: dayStats?.caloriesBurned ?? 0,
      workoutsCount: dayStats?.workoutsCount ?? 0,
    });
  }

  return points;
}

// ── Streak / Progress Calculators ──────────────────────────────────

/**
 * Calculate the user's current streak (consecutive days with
 * at least one workout logged), counting backwards from today.
 */
function calculateStreak(stats: Map<string, DashboardStats>): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayStats = stats.get(toDateKey(date));

    if (dayStats && dayStats.workoutsCount > 0) {
      streak++;
    } else if (i > 0) {
      // Don't break on today (the user might not have worked out yet)
      break;
    }
  }

  return streak;
}

/**
 * Overall goal progress for today: average of all metric
 * completion percentages. This powers the main progress ring.
 */
function calculateGoalProgress(today: DashboardStats | null): number {
  if (!today) return 0;

  const metrics = [
    clampPercent(today.caloriesBurned, today.caloriesGoal),
    clampPercent(today.stepsCount, today.stepsGoal),
    clampPercent(today.waterIntakeMl, today.waterGoalMl),
    clampPercent(today.sleepHours, today.sleepGoalHours),
  ];

  const avg = metrics.reduce((sum, m) => sum + m, 0) / metrics.length;
  return Math.round(avg);
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Fetch the last N days of stats and return them as a Map keyed
 * by date string (YYYY-MM-DD) for O(1) lookup.
 */
async function getLastNDaysStats(
  userId: string,
  days: number
): Promise<Map<string, DashboardStats>> {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const rows = await StatsRepository.findStatsByDateRange(
    userId,
    startDate,
    endDate
  );

  const map = new Map<string, DashboardStats>();
  for (const row of rows) {
    map.set(toDateKey(new Date(row.date)), row);
  }
  return map;
}

/** Convert a Date to "YYYY-MM-DD" for Map keys. */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Clamp a value/goal ratio to 0–100 percent. */
function clampPercent(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

/** Get the start of today (midnight local). */
function getStartOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
