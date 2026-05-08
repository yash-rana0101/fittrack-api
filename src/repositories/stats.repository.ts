import { prisma } from '../config/prisma.js';
import type { Prisma, DashboardStats } from '../../prisma/generated/prisma/client.js';

/**
 * Dashboard Stats Repository
 *
 * Handles all direct database interactions for the DashboardStats model.
 * Each record represents one day of tracked fitness data for a user.
 */

// ── Repository Methods ─────────────────────────────────────────────

/**
 * Create or update a stats record for a specific user and date.
 * Uses upsert so calling code doesn't need to check if a record
 * already exists for today.
 */
export async function upsertDailyStats(
  userId: string,
  date: Date,
  data: Omit<Prisma.DashboardStatsCreateInput, 'user' | 'date'>
): Promise<DashboardStats> {
  return prisma.dashboardStats.upsert({
    where: {
      userId_date: { userId, date },
    },
    update: data,
    create: {
      ...data,
      date,
      user: { connect: { id: userId } },
    },
  });
}

/**
 * Get today's stats for a user.
 */
export async function findTodayStats(
  userId: string
): Promise<DashboardStats | null> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return prisma.dashboardStats.findUnique({
    where: {
      userId_date: { userId, date: startOfDay },
    },
  });
}

/**
 * Get stats for a user over a date range (for charts / progress tracking).
 */
export async function findStatsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DashboardStats[]> {
  return prisma.dashboardStats.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get the latest N stats records for a user (most recent first).
 */
export async function findRecentStats(
  userId: string,
  limit: number = 7
): Promise<DashboardStats[]> {
  return prisma.dashboardStats.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
  });
}
