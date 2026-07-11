import { Router } from 'express';
import { loginSchema, registerSchema } from '../domain/schemas.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { login, register } from '../services/auth-service.js';
import { sendCreated, sendOk } from '../lib/response.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await register(req.body);
    sendCreated(res, result);
  })
);

authRoutes.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    sendOk(res, result);
  })
);
