import { Router } from 'express';
import { authRoutes } from './auth-routes.js';
import { contaRoutes } from './conta-routes.js';
import { contratoRoutes } from './contrato-routes.js';
import { dashboardRoutes } from './dashboard-routes.js';
import { empreendimentoRoutes } from './empreendimento-routes.js';
import { requireAuth } from '../middleware/auth.js';

export const apiRoutes = Router();

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/empreendimentos', requireAuth, empreendimentoRoutes);
apiRoutes.use('/contratos', requireAuth, contratoRoutes);
apiRoutes.use('/contas', requireAuth, contaRoutes);
apiRoutes.use('/dashboard', requireAuth, dashboardRoutes);
