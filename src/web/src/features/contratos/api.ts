import { request } from '../../lib/http';
import type { Contrato, ContratoStatus, IndiceReajuste } from './types';

export function listContratos() {
  return request<Contrato[]>('/contratos');
}

export function createContrato(payload: {
  empreendimentoId: string;
  nomeInquilino: string;
  dataInicio: string;
  dataFim: string;
  dataVencimentoPadrao: string;
  multaAtraso: number;
  jurosMensal: number;
  indiceReajuste: IndiceReajuste;
}) {
  return request<Contrato>('/contratos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function batchUpdateStatus(ids: string[], status: ContratoStatus) {
  return request<Contrato[]>('/contratos/batch-status', {
    method: 'PATCH',
    body: JSON.stringify({ ids, status })
  });
}
