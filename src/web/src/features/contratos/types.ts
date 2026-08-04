import type { Empreendimento } from '../empreendimentos/types';

export type IndiceReajuste = 'IGPM' | 'IPCA' | 'INPC';
export type ContratoStatus = 'ATIVO' | 'FINALIZADO' | 'RENOVADO' | 'RESCINDIDO';

export interface Contrato {
  id: string;
  nomeInquilino: string;
  dataInicio: string;
  dataFim: string;
  dataVencimentoPadrao: string;
  multaAtraso: number;
  jurosMensal: number;
  indiceReajuste: IndiceReajuste;
  status: ContratoStatus;
  empreendimento: Pick<Empreendimento, 'id' | 'nome'>;
}
