import type { DashboardStats } from '../../prisma/generated/prisma/client.js';

// ── Dashboard Overview ─────────────────────────────────────────────
// The shape returned by GET /api/v1/stats/overview.
// Each key maps directly to a dashboard card or widget so the
// frontend can render without any data transformation.

/**
 * Single metric card displayed at the top of the dashboard.
 * Provides value, goal (where applicable), unit, and a
 * percentage for the circular progress indicator.
 */
export interface MetricCard {
  label: string;
  value: number;
  goal?: number | undefined;
  unit: string;
  /** 0–100 percentage for progress ring / bar */
  progress: number;
  /** Human-readable subtitle, e.g. "of 2,000 kcal" */
  subtitle: string;
}

/**
 * Single data point for the Weekly Activity bar chart.
 */
export interface WeeklyActivityPoint {
  /** Short day label: "Mon", "Tue", etc. */
  day: string;
  /** ISO date string for the data point */
  date: string;
  /** Active minutes for that day */
  activeMinutes: number;
  /** Calories burned that day */
  caloriesBurned: number;
  /** Number of workouts completed */
  workoutsCount: number;
}

/**
 * Complete dashboard overview payload.
 *
 * Structure rationale (Apple-level polish):
 *  - `cards` are ordered in visual priority (calories → workouts →
 *    steps → water → sleep) so the frontend renders them in order.
 *  - `weeklyActivity` is pre-formatted as chart-ready points —
 *    the client doesn't need to group or aggregate.
 *  - `streakDays` and `goalProgress` are top-level scalars for
 *    the motivational banner area.
 *  - `todayRaw` is included for any card that needs granular access.
 */
export interface DashboardOverview {
  cards: MetricCard[];
  weeklyActivity: WeeklyActivityPoint[];
  streakDays: number;
  goalProgress: number;     // 0–100 overall %
  todayRaw: DashboardStats | null;
}

// ── Quick Action Types ─────────────────────────────────────────────

export interface LogMealInput {
  name: string;
  calories: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
}

export interface StartWorkoutInput {
  type: string;
  durationMinutes: number;
  caloriesBurned?: number | undefined;
}
