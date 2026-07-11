import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default('15m'),
  PORT: z.coerce.number().default(3333),
  WEB_ORIGIN: z.string().default('http://localhost:5173')
});

export const env = envSchema.parse(process.env);
