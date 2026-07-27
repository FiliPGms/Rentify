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

  // Filtro de mês como range para campo @db.Date do MySQL.
  // Usamos lte com o último dia do mês (não lt com o primeiro do mês seguinte),
  // pois MySQL compara DATE '2026-08-01' como igual a DATETIME '2026-08-01 00:00:00',
  // fazendo o lt falhar e incluir erroneamente o primeiro dia do mês seguinte.
  function buildMesRange(mes: string) {
    const [year, month] = mes.split('-').map(Number);
    const firstDay = new Date(Date.UTC(year, month - 1, 1));
    const lastDay = new Date(Date.UTC(year, month, 0)); // dia 0 do mês seguinte = último dia do mês atual
    return { gte: firstDay, lte: lastDay };
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
