export interface DashboardResumo {
  lucroLiquido: number;
  pendenteTotal: number;
  atrasadoTotal: number;
  porEmpreendimento: Array<{ empreendimentoId: string; nome: string; recebido: number }>;
  mesesDisponiveis: string[];
}
