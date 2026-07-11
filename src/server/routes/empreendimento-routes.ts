import { Router } from 'express';
import {
  empreendimentoCreateSchema,
  empreendimentoUpdateSchema
} from '../domain/schemas.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import {
  createEmpreendimento,
  deleteEmpreendimento,
  listEmpreendimentos,
  updateEmpreendimento
} from '../services/empreendimento-service.js';
import { sendCreated, sendNoContent, sendOk } from '../lib/response.js';

export const empreendimentoRoutes = Router();

empreendimentoRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await listEmpreendimentos((req as AuthenticatedRequest).user.id);
    sendOk(res, data);
  })
);

empreendimentoRoutes.post(
  '/',
  validateBody(empreendimentoCreateSchema),
  asyncHandler(async (req, res) => {
    const data = await createEmpreendimento((req as AuthenticatedRequest).user.id, req.body);
    sendCreated(res, data);
  })
);

empreendimentoRoutes.patch(
  '/:id',
  validateBody(empreendimentoUpdateSchema),
  asyncHandler(async (req, res) => {
    const data = await updateEmpreendimento(
      (req as AuthenticatedRequest).user.id,
      req.params.id,
      req.body
    );
    sendOk(res, data);
  })
);

empreendimentoRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteEmpreendimento((req as AuthenticatedRequest).user.id, req.params.id);
    sendNoContent(res);
  })
);
