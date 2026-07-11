import { Router } from 'express';
import { sendOk } from '../lib/response.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { getDashboardResumo } from '../services/dashboard-service.js';

export const dashboardRoutes = Router();

dashboardRoutes.get(
  '/resumo',
  asyncHandler(async (req, res) => {
    const data = await getDashboardResumo((req as AuthenticatedRequest).user.id);
    sendOk(res, data);
  })
);
