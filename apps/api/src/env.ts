import 'dotenv/config';
import { z } from 'zod/v4';

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // API_PORT and API_HOST are not needed on Vercel (handled automatically)
  API_PORT: isVercel 
    ? z.coerce.number().min(0).max(65535).optional()
    : z.coerce.number().min(0).max(65535).default(4000),
  API_HOST: isVercel
    ? z.string().optional()
    : z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  POLAR_ACCESS_TOKEN: z.string().min(1, 'POLAR_ACCESS_TOKEN is required'),
  POLAR_WEBHOOK_SECRET: z.string().optional(),
  POLAR_ORGANIZATION_ID: z.string().optional(),
  // Vercel-specific
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
