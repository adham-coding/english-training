import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z
    .url()
    .refine(
      (value) =>
        value.startsWith('postgresql://') || value.startsWith('postgres://'),
      {
        message: 'DATABASE_URL must be a PostgreSQL connection URL',
      },
    ),

  REDIS_URL: z
    .url()
    .refine(
      (value) => value.startsWith('redis://') || value.startsWith('rediss://'),
      {
        message: 'REDIS_URL must be a Redis connection URL',
      },
    ),

  CORS_ORIGIN: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_REFRESH_SECRET: z.string().min(32),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),

  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;
