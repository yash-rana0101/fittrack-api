import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, validateEnv } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware.js';

// ── Validate environment on startup ────────────────────────────────
validateEnv();

// ── Express app ────────────────────────────────────────────────────
const app = express();

// ── Security Middleware ────────────────────────────────────────────
// eslint-disable-next-next-line @typescript-eslint/no-explicit-any
app.use((helmet as any)());

// ── CORS Middleware ────────────────────────────────────────────────
app.use(cors());

// ── Body Parser Middleware ─────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logger Middleware ──────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'FitTrack API is healthy and running',
    data: {
      environment: env.NODE_ENV,
      uptime: `${Math.floor(process.uptime())}s`,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes (v1) ───────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 Handler (must come AFTER routes) ──────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler (must be the LAST middleware) ─────────────
app.use(globalErrorHandler);

// ── Start Server ──────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`\n🏋️  FitTrack API`);
  console.log(`   ├─ URL:         http://localhost:${env.PORT}`);
  console.log(`   ├─ Environment: ${env.NODE_ENV}`);
  console.log(`   └─ Routes:      /api/v1/auth, /api/v1/users, /api/v1/stats\n`);
});
