import type { Endereco } from '../enderecos/types';

export type TipoEmpreendimento = 'CASA' | 'APARTAMENTO' | 'COMERCIAL' | 'OUTRO';
export type EmpreendimentoStatus = 'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO';

export interface Empreendimento {
  id: string;
  nome: string;
  tipo: TipoEmpreendimento;
  statusImovel: EmpreendimentoStatus;
  inscricaoIptu: string | null;
  valorPadrao: string;
  endereco: Endereco | null;
}

export const TIPO_LABEL: Record<TipoEmpreendimento, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COMERCIAL: 'Comercial',
  OUTRO: 'Outro'
};

export const STATUS_LABEL: Record<EmpreendimentoStatus, string> = {
  DISPONIVEL: 'Disponível',
  ALUGADO: 'Alugado',
  MANUTENCAO: 'Em Manutenção'
};
