import type { Empreendimento } from '../empreendimentos/types';

export interface Contrato {
  id: string;
  nomeInquilino: string;
  dataVencimentoPadrao: string;
  status: 'ATIVO' | 'INATIVO';
  empreendimento: Pick<Empreendimento, 'id' | 'nome'>;
}
