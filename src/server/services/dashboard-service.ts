import { prisma } from '../lib/prisma.js';

export async function getDashboardResumo(usuarioId: string) {
  const [pagas, pendentes, atrasadas, empreendimentos] = await prisma.$transaction([
    prisma.conta.aggregate({
      where: { status: 'PAGO', contrato: { empreendimento: { usuarioId } } },
      _sum: { valor: true }
    }),
    prisma.conta.aggregate({
      where: { status: 'PENDENTE', contrato: { empreendimento: { usuarioId } } },
      _sum: { valor: true }
    }),
    prisma.conta.aggregate({
      where: { status: 'EM_ATRASO', contrato: { empreendimento: { usuarioId } } },
      _sum: { valor: true }
    }),
    prisma.empreendimento.findMany({
      where: { usuarioId },
      select: {
        id: true,
        nome: true,
        contratos: {
          select: {
            contas: {
              where: { status: 'PAGO' },
              select: { valor: true }
            }
          }
        }
      },
      orderBy: { nome: 'asc' }
    })
  ]);

  return {
    faturamentoTotal: Number(pagas._sum.valor ?? 0),
    pendenteTotal: Number(pendentes._sum.valor ?? 0),
    atrasadoTotal: Number(atrasadas._sum.valor ?? 0),
    porEmpreendimento: empreendimentos.map((empreendimento) => ({
      empreendimentoId: empreendimento.id,
      nome: empreendimento.nome,
      recebido: empreendimento.contratos.reduce(
        (total, contrato) =>
          total + contrato.contas.reduce((subtotal, conta) => subtotal + Number(conta.valor), 0),
        0
      )
    }))
  };
}
