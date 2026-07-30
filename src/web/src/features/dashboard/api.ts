import { request } from '../../lib/http';
import type { DashboardResumo } from './types';

export function getDashboard(empreendimentoId?: string, mesReferencia?: string) {
  const params = new URLSearchParams();
  if (empreendimentoId) params.set('empreendimentoId', empreendimentoId);
  if (mesReferencia) params.set('mesReferencia', mesReferencia);
  return request<DashboardResumo>(`/dashboard/resumo?${params.toString()}`);
}
