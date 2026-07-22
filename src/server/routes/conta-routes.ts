import { Router } from 'express';
import {
  contaCreateSchema,
  contaExportSchema,
  contaListSchema,
  contaUpdateDescricaoSchema,
  pagamentoSchema
} from '../domain/schemas.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  atualizarDescricaoConta,
  buildContasWorkbook,
  createConta,
  deletarConta,
  desmarcarContaPaga,
  listContas,
  marcarContaPaga
} from '../services/conta-service.js';
import { sendCreated, sendOk } from '../lib/response.js';
import type { z } from 'zod';

export const contaRoutes = Router();
type ContaListQuery = z.infer<typeof contaListSchema>;
type ContaExportQuery = z.infer<typeof contaExportSchema>;

contaRoutes.get(
  '/',
  validateQuery(contaListSchema),
  asyncHandler(async (req, res) => {
    const result = await listContas(
      (req as AuthenticatedRequest).user.id,
      req.query as unknown as ContaListQuery
    );
    sendOk(res, result.data, result.meta);
  })
);

contaRoutes.get(
  '/export',
  validateQuery(contaExportSchema),
  asyncHandler(async (req, res) => {
    const workbook = await buildContasWorkbook(
      (req as AuthenticatedRequest).user.id,
      req.query as unknown as ContaExportQuery
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="contas.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  })
);

contaRoutes.post(
  '/',
  validateBody(contaCreateSchema),
  asyncHandler(async (req, res) => {
    const data = await createConta((req as AuthenticatedRequest).user.id, req.body);
    sendCreated(res, data);
  })
);

contaRoutes.patch(
  '/:id/pagamento',
  validateBody(pagamentoSchema),
  asyncHandler(async (req, res) => {
    const data = await marcarContaPaga((req as AuthenticatedRequest).user.id, req.params.id, req.body);
    sendOk(res, data);
  })
);

contaRoutes.delete(
  '/:id/pagamento',
  asyncHandler(async (req, res) => {
    const data = await desmarcarContaPaga((req as AuthenticatedRequest).user.id, req.params.id);
    sendOk(res, data);
  })
);

contaRoutes.patch(
  '/:id/descricao',
  validateBody(contaUpdateDescricaoSchema),
  asyncHandler(async (req, res) => {
    const data = await atualizarDescricaoConta(
      (req as AuthenticatedRequest).user.id,
      req.params.id,
      req.body.descricao
    );
    sendOk(res, data);
  })
);

contaRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deletarConta((req as AuthenticatedRequest).user.id, req.params.id);
    sendOk(res, { success: true });
  })
);
