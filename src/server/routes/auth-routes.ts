import { Router } from 'express';
import { loginSchema, registerSchema } from '../domain/schemas.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { login, register, refreshAccessToken } from '../services/auth-service.js';
import { sendCreated, sendOk } from '../lib/response.js';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';
import type { CookieOptions } from 'express';

export const authRoutes = Router();

const isProduction = env.NODE_ENV === 'production';

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
  };
}

authRoutes.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await register(req.body);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    sendCreated(res, { token: result.accessToken, user: result.user });
  })
);

authRoutes.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    sendOk(res, { token: result.accessToken, user: result.user });
  })
);

authRoutes.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      throw new HttpError(401, 'NO_REFRESH_TOKEN', 'Refresh token ausente.');
    }

    const result = refreshAccessToken(refreshToken);
    // Token rotation: atualiza o cookie com o novo refresh token
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    sendOk(res, { token: result.accessToken });
  })
);

authRoutes.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth'
  });
  sendOk(res, { success: true });
});
