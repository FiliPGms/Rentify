import { Router } from 'express';
import {
  contratoBatchStatusSchema,
  contratoCreateSchema,
  contratoListSchema,
  contratoUpdateSchema
} from '../domain/schemas.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  batchUpdateStatus,
  createContrato,
  deleteContrato,
  listContratos,
  updateContrato
} from '../services/contrato-service.js';
import { sendCreated, sendNoContent, sendOk } from '../lib/response.js';

export const contratoRoutes = Router();

contratoRoutes.get(
  '/',
  validateQuery(contratoListSchema),
  asyncHandler(async (req, res) => {
    const data = await listContratos((req as AuthenticatedRequest).user.id, req.query);
    sendOk(res, data);
  })
);

contratoRoutes.post(
  '/',
  validateBody(contratoCreateSchema),
  asyncHandler(async (req, res) => {
    const data = await createContrato((req as AuthenticatedRequest).user.id, req.body);
    sendCreated(res, data);
  })
);

contratoRoutes.patch(
  '/batch-status',
  validateBody(contratoBatchStatusSchema),
  asyncHandler(async (req, res) => {
    const data = await batchUpdateStatus(
      (req as AuthenticatedRequest).user.id,
      req.body.ids,
      req.body.status
    );
    sendOk(res, data);
  })
);

contratoRoutes.patch(
  '/:id',
  validateBody(contratoUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = await updateContrato((req as AuthenticatedRequest).user.id, req.params.id, req.body);
    sendOk(res, data);
  })
);

contratoRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteContrato((req as AuthenticatedRequest).user.id, req.params.id);
    sendNoContent(res);
  })
);
