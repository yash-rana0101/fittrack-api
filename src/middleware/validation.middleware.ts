import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Reusable request-body validation middleware.
 *
 * Wraps any Zod schema and validates `req.body` against it.
 * On success the parsed (and potentially coerced) data replaces
 * `req.body` so downstream handlers receive clean, typed input.
 *
 * Why Zod?
 *  - Schema-as-code: validation rules live right next to the types.
 *  - Full TypeScript inference: the controller receives the exact
 *    shape it expects — no `any` casting needed.
 *  - Rich error messages: Zod surfaces per-field issues so the
 *    client can highlight exactly which input needs attention.
 *  - Eliminates an entire class of injection attacks by stripping
 *    unexpected fields before they reach the service layer.
 *
 * Usage:
 *   import { signupSchema } from '../types/auth.types.js';
 *   router.post('/signup', validate(signupSchema), authController.signup);
 */
export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // .parse() throws ZodError on failure; on success it returns
      // the validated + coerced data (e.g. trimmed strings).
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Map Zod issues to a client-friendly structure
        const fieldErrors = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        _res.status(422).json({
          success: false,
          statusCode: 422,
          message: 'Validation failed — please check the highlighted fields.',
          error: {
            code: 'VALIDATION_ERROR',
            details: fieldErrors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Non-Zod error — let the global handler deal with it
      next(err);
    }
  };
}
