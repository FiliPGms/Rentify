import { request } from '../../lib/http';
import type { Empreendimento } from './types';

export function listEmpreendimentos() {
  return request<Empreendimento[]>('/empreendimentos');
}

export function createEmpreendimento(payload: { nome: string; endereco: string; valorPadrao: number }) {
  return request<Empreendimento>('/empreendimentos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function deletarEmpreendimento(id: string) {
  return request<{ success: boolean }>(`/empreendimentos/${id}`, {
    method: 'DELETE'
  });
}
