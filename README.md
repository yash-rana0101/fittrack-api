# 🏋️ FitTrack API

> **REST API for the FitTrack fitness tracking platform.**
> Built with Express 5, Prisma 7, PostgreSQL, and TypeScript — designed for correctness, security, and zero data-transformation on the client.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Design Decisions](#design-decisions)
- [Error Format](#error-format)

---

## Tech Stack

| Layer            | Technology                          | Version  |
|------------------|-------------------------------------|----------|
| Runtime          | Node.js                             | ≥ 20     |
| Framework        | Express                             | 5.x      |
| Language         | TypeScript                          | 6.x      |
| ORM              | Prisma                              | 7.x      |
| DB Driver        | `@prisma/adapter-pg` + `pg`         | 7.x / 8.x|
| Database         | PostgreSQL                          | ≥ 14     |
| Auth             | JSON Web Tokens (`jsonwebtoken`)     | 9.x      |
| Password Hashing | `bcrypt`                            | 6.x      |
| Validation       | Zod                                 | 4.x      |
| Security         | Helmet, CORS                        | latest   |
| Logging          | Morgan                              | 1.x      |
| Dev Server       | `tsx watch`                         | 4.x      |

---

## Architecture

The API follows a strict **layered architecture** to enforce separation of concerns:

```
Request → Route → Middleware (auth + validate) → Controller → Service → Repository → Prisma → PostgreSQL
```

| Layer          | Responsibility                                                              |
|----------------|-----------------------------------------------------------------------------|
| **Route**      | Declares HTTP method, path, and the middleware / handler chain              |
| **Middleware** | Auth (`protect`) and Zod validation (`validate`) — runs before controllers  |
| **Controller** | Extracts request data, calls the service, and formats the HTTP response     |
| **Service**    | Business logic: aggregations, calculations, streak counting, goal progress  |
| **Repository** | All Prisma queries — the only layer allowed to touch the database           |
| **Config**     | `env.ts` (typed env vars), `prisma.ts` (singleton client with `pg` adapter) |

### Key Architectural Patterns

**1. Repository Pattern** — Repositories are the single source of truth for all DB queries. Services never import Prisma directly, so queries are trivially swappable.

**2. Fail-Fast Environment Validation** — `validateEnv()` is called on startup. If `DATABASE_URL` or `JWT_SECRET` are missing the process exits immediately with a clear error rather than failing at runtime.

**3. Singleton Prisma Client** — The client is cached on `globalThis` to prevent connection pool exhaustion during `tsx watch` hot-reloads in development.

**4. Pre-Computed API Responses** — The Stats Service computes every value the dashboard needs server-side (labels, units, progress percentages, streak days, chart points). The frontend renders without any data transformation.

**5. Discriminated Union Validation** — A single `PATCH /onboarding` endpoint handles all 4 onboarding steps. Zod's `discriminatedUnion` on `step` picks the right schema, giving pixel-perfect per-step validation with one route.

---

## Folder Structure

```
api/
├── prisma/
│   ├── schema.prisma          # Data model (User, DashboardStats)
│   └── generated/             # Auto-generated Prisma client
│
└── src/
    ├── config/
    │   ├── env.ts             # Typed env vars + startup validator
    │   └── prisma.ts          # Singleton Prisma client (pg adapter)
    │
    ├── middleware/
    │   ├── auth.middleware.ts  # JWT Bearer token verification → req.userId
    │   ├── error.middleware.ts # notFoundHandler + globalErrorHandler
    │   └── validation.middleware.ts  # Generic Zod schema validator
    │
    ├── routes/
    │   ├── index.ts           # Mounts /auth, /users, /stats
    │   ├── auth.routes.ts     # POST /signup, /login, /logout
    │   ├── user.routes.ts     # GET /me, PATCH /onboarding
    │   └── stats.routes.ts    # GET /overview, /weekly-activity; POST /log-meal, /start-workout
    │
    ├── controllers/
    │   ├── auth.controller.ts
    │   ├── user.controller.ts
    │   └── stats.controller.ts
    │
    ├── services/
    │   ├── auth.service.ts
    │   ├── user.service.ts
    │   └── stats.service.ts   # Core business logic: cards, charts, streaks, goal %
    │
    ├── repositories/
    │   ├── user.repository.ts
    │   └── stats.repository.ts # findTodayStats, findStatsByDateRange, upsertDailyStats
    │
    ├── types/
    │   ├── auth.types.ts      # signupSchema, loginSchema (Zod)
    │   ├── onboarding.types.ts # step2–5 schemas + discriminatedUnion
    │   ├── stats.types.ts     # DashboardOverview, MetricCard, WeeklyActivityPoint
    │   └── stats.schemas.ts   # logMealSchema, startWorkoutSchema (Zod)
    │
    └── utils/
        ├── AppError.ts        # Custom operational error class
        └── response.ts        # sendSuccess / sendError helpers
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 running locally or a connection string (e.g. Neon, Supabase)
- `npm` or `pnpm`

### Installation

```bash
# From the repo root
cd api
npm install
```

### Development Server

```bash
npm run dev
# → tsx watch src/server.ts
# → Hot-reload on file changes
# → Starts on http://localhost:5000
```

### Production Build

```bash
npm run build   # tsc → compiles to dist/
npm run start   # node dist/src/server.js
```

---

## Environment Variables

Create a `.env` file in `api/`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# JWT
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars"
JWT_EXPIRES_IN="90d"
```

> **Note:** `DATABASE_URL` and `JWT_SECRET` are **required**. The server will refuse to start if they are missing.

---

## Database Setup

The API uses **Prisma v7** with the `@prisma/adapter-pg` driver adapter. Unlike earlier Prisma versions, the database URL is passed via the adapter rather than the schema file.

```bash
# Push schema to the database (development)
npm run db:push

# Regenerate the Prisma client after schema changes
npm run db:generate

# Open Prisma Studio (GUI)
npm run db:studio
```

### Data Model (summary)

| Model            | Key Fields                                                                   |
|------------------|------------------------------------------------------------------------------|
| `User`           | `id`, `email`, `passwordHash`, `name`, `dateOfBirth`, `gender`, `height`, `weight`, `goals[]`, `activityLevel`, `username`, `bio`, `avatarUrl`, `onboardingComplete` |
| `DashboardStats` | `userId`, `date`, `caloriesBurned`, `caloriesGoal`, `workoutsCount`, `workoutMinutes`, `stepsCount`, `stepsGoal`, `waterIntakeMl`, `waterGoalMl`, `sleepHours`, `sleepGoalHours` |

---

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require an `Authorization: Bearer <token>` header.

### Health

| Method | Path      | Auth | Description              |
|--------|-----------|------|--------------------------|
| `GET`  | `/health` | —    | Liveness check + uptime  |

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "FitTrack API is healthy and running",
  "data": { "environment": "development", "uptime": "42s" },
  "timestamp": "2026-05-09T08:10:00.000Z"
}
```

---

### Auth — `/api/v1/auth`

#### `POST /signup`
Register a new user (Onboarding Step 1).

**Body:**
```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "SecurePass123!"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "Alex Johnson", "email": "alex@example.com" }
  }
}
```

---

#### `POST /login`
Authenticate and receive a JWT.

**Body:**
```json
{ "email": "alex@example.com", "password": "SecurePass123!" }
```

**Response `200`:** same shape as `/signup`.

---

#### `POST /logout`
Invalidate the session (client should delete the stored token).

---

### Users — `/api/v1/users` 🔒

#### `GET /me`
Returns the authenticated user's full profile.

---

#### `PATCH /onboarding`
Updates the user profile for a given onboarding step. Uses Zod's `discriminatedUnion` on `step` — send the correct `step` number and only the fields for that step.

| Step | Required Fields                                          | Optional Fields       |
|------|----------------------------------------------------------|-----------------------|
| `2`  | `dateOfBirth`, `gender`, `height`, `weight`              | —                     |
| `3`  | `goals` (1–3 from enum list)                             | —                     |
| `4`  | —                                                        | `activityLevel`, `skip` |
| `5`  | —                                                        | `username`, `bio`, `avatarUrl`, `skip` |

**Step 2 example:**
```json
{ "step": 2, "dateOfBirth": "1995-06-15T00:00:00Z", "gender": "MALE", "height": 180, "weight": 75 }
```

**Step 4 (skip):**
```json
{ "step": 4, "skip": true }
```

**Valid goal values:** `LOSE_WEIGHT`, `BUILD_MUSCLE`, `IMPROVE_ENDURANCE`, `INCREASE_FLEXIBILITY`, `EAT_HEALTHIER`, `REDUCE_STRESS`, `IMPROVE_SLEEP`, `STAY_ACTIVE`

**Valid activity levels:** `SEDENTARY`, `LIGHTLY_ACTIVE`, `MODERATELY_ACTIVE`, `VERY_ACTIVE`, `EXTRA_ACTIVE`

**Valid genders:** `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`

---

### Stats — `/api/v1/stats` 🔒

#### `GET /overview`
Full dashboard payload — cards, chart data, streak, and goal progress. Powers the entire post-login dashboard with a single request.

**Response:**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "label": "Calories Burned",
        "value": 850,
        "goal": 2000,
        "unit": "kcal",
        "progress": 43,
        "subtitle": "of 2,000 kcal"
      }
    ],
    "weeklyActivity": [
      { "day": "Mon", "date": "...", "activeMinutes": 45, "caloriesBurned": 320, "workoutsCount": 1 }
    ],
    "streakDays": 5,
    "goalProgress": 62,
    "todayRaw": { ... }
  }
}
```

---

#### `GET /weekly-activity`
Returns only the 7-day chart dataset (for targeted chart refreshes).

---

#### `POST /log-meal`
Log a meal and add calories to today's stats.

**Body:**
```json
{ "name": "Grilled Chicken Salad", "calories": 450, "mealType": "LUNCH" }
```

**Valid meal types:** `BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`

---

#### `POST /start-workout`
Log a workout session and update today's stats.

**Body:**
```json
{ "type": "Running", "durationMinutes": 30, "caloriesBurned": 320 }
```

---

## Design Decisions

### 1. Pre-Computed API Responses
The Stats Service computes all labels, units, progress percentages, streak counts, and chart points server-side. The client receives exactly what it needs to render — no aggregation, no transformation, no broken UI states.

### 2. Single Onboarding Endpoint
Rather than four separate `PATCH` routes, a single `PATCH /onboarding` uses Zod's `discriminatedUnion` to dispatch to the correct schema based on the `step` field. This reduces route boilerplate and keeps onboarding validation co-located.

### 3. AppError Class
All operational errors (`404`, `401`, `400`) are thrown as `AppError` instances. The global error handler pattern-matches on this class to distinguish expected errors from unexpected bugs, returning clean JSON in both cases.

### 4. Zod at the Boundary
Validation runs in middleware, before controllers execute. Prisma types are only used inside repositories — controllers and services work with validated TypeScript types inferred from Zod schemas.

### 5. ESM Throughout
The project is `"type": "module"` with `.js` import extensions so the compiled output runs natively in Node without a CommonJS bridge.

---

## Error Format

All errors follow the same envelope:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ],
  "timestamp": "2026-05-09T08:10:00.000Z"
}
```

| Status | Meaning                                       |
|--------|-----------------------------------------------|
| `400`  | Validation failed (Zod errors listed in `errors`) |
| `401`  | Missing or invalid JWT                        |
| `404`  | Resource not found                            |
| `409`  | Conflict (e.g. email already registered)      |
| `500`  | Unexpected server error                       |
