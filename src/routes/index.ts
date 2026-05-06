import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import statsRoutes from './stats.routes.js';

/**
 * Master Router
 *
 * Aggregates all feature-specific route modules under a single
 * entry point. server.ts mounts this at `/api/v1`, so each
 * sub-router only defines its own relative paths.
 *
 * To add a new feature:
 *   1. Create  src/routes/<feature>.routes.ts
 *   2. Import  it here
 *   3. Mount   it with router.use('/<feature>', featureRoutes)
 */
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/stats', statsRoutes);

export default router;
