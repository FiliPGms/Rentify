import type { Contrato } from '../contratos/types';

export type ContaStatus = 'PENDENTE' | 'PAGO' | 'EM_ATRASO';
export type ContaTipo = 'RECEITA' | 'DESPESA';
export type FormaPagamento = 'PIX' | 'CARTAO_CREDITO' | 'A_VISTA' | 'BOLETO';

export interface Conta {
  id: string;
  mesReferencia: string;
  dataVencimento: string;
  dataPagamento?: string | null;
  valor: string;
  status: ContaStatus;
  conta: ContaTipo;
  descricao: string;
  formaPagamento: FormaPagamento | null;
  contrato: Pick<Contrato, 'id' | 'nomeInquilino'> & {
    empreendimento: { id: string; nome: string };
  };
}

export interface ContaFilters {
  status?: string;
  empreendimentoId?: string;
  conta?: string;
  mesReferencia?: string;
}
