import { prisma } from '../lib/prisma.js';

export async function getDashboardResumo(usuarioId: string) {
  const ownerFilter = { contrato: { empreendimento: { usuarioId } } };

  const [receitasPagas, despesasPagas, pendentes, atrasadas, empreendimentos] = await prisma.$transaction([
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
      where: { status: 'PENDENTE', conta: 'RECEITA', ...ownerFilter },
      _sum: { valor: true }
    }),
    // Em atraso (só receitas)
    prisma.conta.aggregate({
      where: { status: 'EM_ATRASO', conta: 'RECEITA', ...ownerFilter },
      _sum: { valor: true }
    }),
    // Rendimento por empreendimento (lucro líquido = receita − despesa)
    prisma.empreendimento.findMany({
      where: { usuarioId },
      select: {
        id: true,
        nome: true,
        contratos: {
          select: {
            contas: {
              where: { status: 'PAGO' },
              select: { valor: true, conta: true }
            }
          }
        }
      },
      orderBy: { nome: 'asc' }
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
    })
  };
}
