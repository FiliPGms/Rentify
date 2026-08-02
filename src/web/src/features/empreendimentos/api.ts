import { request } from '../../lib/http';
import type { Empreendimento, EmpreendimentoStatus, TipoEmpreendimento } from './types';

interface EnderecoPayload {
  cep: string;
  rua: string;
  numero?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface CreateEmpreendimentoPayload {
  nome: string;
  tipo: TipoEmpreendimento;
  statusImovel?: EmpreendimentoStatus;
  inscricaoIptu?: string;
  valorPadrao: number;
  endereco: EnderecoPayload;
}

export function listEmpreendimentos() {
  return request<Empreendimento[]>('/empreendimentos');
}

export function createEmpreendimento(payload: CreateEmpreendimentoPayload) {
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
