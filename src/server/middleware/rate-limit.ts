import type { NextFunction, Request, Response } from 'express';

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(maxTokens = 120, refillPerMinute = 120) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    const bucket = buckets.get(key) ?? { tokens: maxTokens, updatedAt: now };
    const elapsedMinutes = (now - bucket.updatedAt) / 60000;
    bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsedMinutes * refillPerMinute);
    bucket.updatedAt = now;

    const remaining = Math.max(0, Math.floor(bucket.tokens - 1));
    const resetSeconds = Math.ceil(((maxTokens - bucket.tokens) / refillPerMinute) * 60);

    res.setHeader('X-RateLimit-Limit', String(maxTokens));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.max(0, resetSeconds)));

    if (bucket.tokens < 1) {
      buckets.set(key, bucket);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Muitas requisicoes. Tente novamente em instantes.',
          requestId: req.header('x-request-id') ?? crypto.randomUUID()
        }
      });
      return;
    }

    bucket.tokens -= 1;
    buckets.set(key, bucket);
    next();
  };
}
