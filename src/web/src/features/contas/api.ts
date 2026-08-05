import { authHeader, request } from '../../lib/http';
import type { Conta, ContaFilters, FormaPagamento } from './types';

export function listContas(filters: ContaFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.empreendimentoId) params.set('empreendimentoId', filters.empreendimentoId);
  if (filters.conta) params.set('conta', filters.conta);
  if (filters.mesReferencia) params.set('mesReferencia', filters.mesReferencia);
  return request<Conta[]>(`/contas?${params.toString()}`);
}

export function createConta(payload: {
  contratoId: string;
  mesReferencia: string;
  dataVencimento: string;
  valor: number;
  conta: 'RECEITA' | 'DESPESA';
  descricao: string;
  formaPagamento?: FormaPagamento;
}) {
  return request<Conta>('/contas', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function pagarConta(id: string, dataPagamento?: string) {
  return request<Conta>(`/contas/${id}/pagamento`, {
    method: 'PATCH',
    body: JSON.stringify(dataPagamento ? { dataPagamento } : {})
  });
}

export function despagarConta(id: string) {
  return request<Conta>(`/contas/${id}/pagamento`, {
    method: 'DELETE'
  });
}

export function deletarConta(id: string) {
  return request<{ success: boolean }>(`/contas/${id}`, {
    method: 'DELETE'
  });
}

export function atualizarDescricao(id: string, descricao: string) {
  return request<Conta>(`/contas/${id}/descricao`, {
    method: 'PATCH',
    body: JSON.stringify({ descricao })
  });
}

export function atualizarFormaPagamento(id: string, formaPagamento: string | null) {
  return request<Conta>(`/contas/${id}/forma-pagamento`, {
    method: 'PATCH',
    body: JSON.stringify({ formaPagamento })
  });
}

export function exportContasUrl(filters: ContaFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.empreendimentoId) params.set('empreendimentoId', filters.empreendimentoId);
  if (filters.conta) params.set('conta', filters.conta);
  if (filters.mesReferencia) params.set('mesReferencia', filters.mesReferencia);
  return `/api/contas/export?${params.toString()}`;
}

export { authHeader };
