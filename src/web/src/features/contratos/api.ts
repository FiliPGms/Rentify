import { request } from '../../lib/http';
import type { Contrato } from './types';

export function listContratos() {
  return request<Contrato[]>('/contratos');
}

export function createContrato(payload: {
  empreendimentoId: string;
  nomeInquilino: string;
  dataVencimentoPadrao: string;
  status: 'ATIVO' | 'INATIVO';
}) {
  return request<Contrato>('/contratos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
