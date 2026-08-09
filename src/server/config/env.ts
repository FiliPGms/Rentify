import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_SECRET: z.string().min(24),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3333),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production']).default('development')
});

export const env = envSchema.parse(process.env);
