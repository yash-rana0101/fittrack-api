import { z } from 'zod';

// ── Prisma Enum Values (mirrored for Zod validation) ───────────────
// These MUST match the Prisma schema enums exactly.

const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;
const ACTIVITY_LEVEL_VALUES = [
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
  'EXTRA_ACTIVE',
] as const;

/**
 * Pre-defined fitness goal constants.
 * The schema stores these as String[] so we validate against a
 * known whitelist to guarantee data integrity at the API boundary.
 */
const GOAL_VALUES = [
  'LOSE_WEIGHT',
  'BUILD_MUSCLE',
  'IMPROVE_ENDURANCE',
  'INCREASE_FLEXIBILITY',
  'EAT_HEALTHIER',
  'REDUCE_STRESS',
  'IMPROVE_SLEEP',
  'STAY_ACTIVE',
] as const;

// ── Step 2: Personal Details ───────────────────────────────────────

export const step2Schema = z.object({
  step: z.literal(2),

  dateOfBirth: z
    .string({ error: 'Date of birth is required' })
    .datetime({ message: 'Date of birth must be a valid ISO 8601 date' }),

  gender: z.enum(GENDER_VALUES, {
    error: `Gender must be one of: ${GENDER_VALUES.join(', ')}`,
  }),

  height: z
    .number({ error: 'Height is required' })
    .positive('Height must be a positive number')
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height must be at most 300 cm'),

  weight: z
    .number({ error: 'Weight is required' })
    .positive('Weight must be a positive number')
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must be at most 500 kg'),
});

// ── Step 3: Fitness Goals ──────────────────────────────────────────

export const step3Schema = z.object({
  step: z.literal(3),

  goals: z
    .array(z.enum(GOAL_VALUES, { error: 'Invalid goal selected' }))
    .min(1, 'Select at least 1 fitness goal')
    .max(3, 'Select at most 3 fitness goals'),
});

// ── Step 4: Activity Level (Skippable) ─────────────────────────────
// Users may skip this step → the body can either contain the
// activityLevel field or be entirely absent (just { step: 4 }).

export const step4Schema = z.object({
  step: z.literal(4),

  activityLevel: z
    .enum(ACTIVITY_LEVEL_VALUES, {
      error: `Activity level must be one of: ${ACTIVITY_LEVEL_VALUES.join(', ')}`,
    })
    .optional(),

  skip: z.boolean().optional(),
});

// ── Step 5: Profile Setup (Skippable) ──────────────────────────────
// Username, bio, and avatarUrl are all optional (skippable).
// When present they must pass validation; when absent the step
// just sets onboardingComplete = true.

export const step5Schema = z.object({
  step: z.literal(5),

  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    )
    .optional(),

  bio: z
    .string()
    .trim()
    .max(300, 'Bio must be at most 300 characters')
    .optional(),

  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .optional(),

  skip: z.boolean().optional(),
});

// ── Discriminated Union ────────────────────────────────────────────
// The `step` field determines which fields are required.
// This lets a single PATCH /onboarding endpoint handle all steps
// with pixel-perfect validation for each one.

export const onboardingSchema = z.discriminatedUnion('step', [
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
]);

/** Inferred TypeScript types. */
export type Step2Input = z.infer<typeof step2Schema>;
export type Step3Input = z.infer<typeof step3Schema>;
export type Step4Input = z.infer<typeof step4Schema>;
export type Step5Input = z.infer<typeof step5Schema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
