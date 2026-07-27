import { prisma } from '../lib/prisma.js';

export async function getDashboardResumo(
  usuarioId: string,
  empreendimentoId?: string,
  mesReferencia?: string // formato YYYY-MM-01
) {
  // Filtro base de proprietário
  const ownerBase = empreendimentoId
    ? { contrato: { empreendimentoId, empreendimento: { usuarioId } } }
    : { contrato: { empreendimento: { usuarioId } } };

  // Filtro de mês como range UTC: >= primeiro dia do mês, < primeiro dia do mês seguinte
  // Isso evita problemas de timezone onde a data armazenada pode ter offset de horas
  function buildMesRange(mes: string) {
    const start = new Date(mes); // ex: 2026-07-01T00:00:00.000Z
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1); // primeiro dia do mês seguinte
    return { gte: start, lt: end };
  }

  const mesFilter = mesReferencia ? { mesReferencia: buildMesRange(mesReferencia) } : {};
  const ownerFilter = { ...ownerBase, ...mesFilter };

  // Filtro de mês para o gráfico por empreendimento
  const contasMesWhere = mesReferencia
    ? { status: 'PAGO' as const, mesReferencia: buildMesRange(mesReferencia) }
    : { status: 'PAGO' as const };

  const [receitasPagas, despesasPagas, pendentes, atrasadas, empreendimentos, mesesDisponiveis] =
    await prisma.$transaction([
      // Receitas pagas (para lucro líquido)
      prisma.conta.aggregate({
        where: { status: 'PAGO', conta: 'RECEITA', ...ownerFilter },
        _sum: { valor: true }
      }),
      // Despesas pagas (para subtrair do lucro líquido)
      prisma.conta.aggregate({
        where: { status: 'PAGO', conta: 'DESPESA', ...ownerFilter },
        _sum: { valor: true }
      }),
      // Pendentes (só receitas)
      prisma.conta.aggregate({
        where: { status: 'PENDENTE', conta: 'RECEITA', ...ownerBase },
        _sum: { valor: true }
      }),
      // Em atraso (só receitas)
      prisma.conta.aggregate({
        where: { status: 'EM_ATRASO', conta: 'RECEITA', ...ownerBase },
        _sum: { valor: true }
      }),
      // Rendimento por empreendimento (lucro líquido = receita − despesa)
      prisma.empreendimento.findMany({
        where: empreendimentoId ? { usuarioId, id: empreendimentoId } : { usuarioId },
        select: {
          id: true,
          nome: true,
          contratos: {
            select: {
              contas: {
                where: contasMesWhere,
                select: { valor: true, conta: true }
              }
            }
          }
        },
        orderBy: { nome: 'asc' }
      }),
      // Meses distintos disponíveis (para o dropdown do frontend)
      prisma.conta.findMany({
        where: empreendimentoId
          ? { contrato: { empreendimentoId, empreendimento: { usuarioId } } }
          : { contrato: { empreendimento: { usuarioId } } },
        select: { mesReferencia: true },
        distinct: ['mesReferencia'],
        orderBy: { mesReferencia: 'desc' }
      })
    ]);

  const totalReceitas = Number(receitasPagas._sum.valor ?? 0);
  const totalDespesas = Number(despesasPagas._sum.valor ?? 0);

  return {
    lucroLiquido: totalReceitas - totalDespesas,
    pendenteTotal: Number(pendentes._sum.valor ?? 0),
    atrasadoTotal: Number(atrasadas._sum.valor ?? 0),
    porEmpreendimento: empreendimentos.map((empreendimento) => {
      let receita = 0;
      let despesa = 0;
      for (const contrato of empreendimento.contratos) {
        for (const c of contrato.contas) {
          if (c.conta === 'RECEITA') receita += Number(c.valor);
          else despesa += Number(c.valor);
        }
      }
      return {
        empreendimentoId: empreendimento.id,
        nome: empreendimento.nome,
        recebido: receita - despesa
      };
    }),
    mesesDisponiveis: mesesDisponiveis.map((m) => {
      const d = m.mesReferencia;
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
    })
  };
}
