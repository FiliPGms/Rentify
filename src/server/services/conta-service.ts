import { Prisma, type ContaStatus, type ContaTipo } from '@prisma/client';
import ExcelJS from 'exceljs';
import { addMonths, monthStart, parseDateOnly } from '../lib/dates.js';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';
import { assertOwnsContrato } from './contrato-service.js';

type ContaFilters = {
  status?: ContaStatus;
  empreendimentoId?: string;
  tipo?: ContaTipo;
};

const includeConta = {
  contrato: {
    select: {
      id: true,
      nomeInquilino: true,
      empreendimento: { select: { id: true, nome: true } }
    }
  }
};

function whereContas(usuarioId: string, filters: ContaFilters): Prisma.ContaWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.tipo ? { tipo: filters.tipo } : {}),
    contrato: {
      empreendimento: {
        usuarioId,
        ...(filters.empreendimentoId ? { id: filters.empreendimentoId } : {})
      }
    }
  };
}

export async function listContas(
  usuarioId: string,
  filters: ContaFilters & { page: number; pageSize: number }
) {
  const where = whereContas(usuarioId, filters);
  const [total, data] = await prisma.$transaction([
    prisma.conta.count({ where }),
    prisma.conta.findMany({
      where,
      include: includeConta,
      orderBy: [{ dataVencimento: 'asc' }, { createdAt: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize
    })
  ]);

  return {
    data,
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total,
      totalPages: Math.ceil(total / filters.pageSize)
    }
  };
}

export async function createConta(
  usuarioId: string,
  input: { contratoId: string; mesReferencia: string; dataVencimento: string; valor: number; tipo?: 'ALUGUEL' | 'CAUCAO' }
) {
  await assertOwnsContrato(usuarioId, input.contratoId);
  return prisma.conta.create({
    data: {
      contratoId: input.contratoId,
      mesReferencia: monthStart(parseDateOnly(input.mesReferencia)),
      dataVencimento: parseDateOnly(input.dataVencimento),
      valor: new Prisma.Decimal(input.valor),
      status: 'PENDENTE',
      tipo: input.tipo ?? 'ALUGUEL'
    },
    include: includeConta
  });
}

export async function marcarContaPaga(
  usuarioId: string,
  contaId: string,
  input: { dataPagamento?: string }
) {
  const conta = await prisma.conta.findFirst({
    where: { id: contaId, contrato: { empreendimento: { usuarioId } } },
    include: {
      contrato: {
        include: { empreendimento: true }
      }
    }
  });

  if (!conta) {
    throw new HttpError(404, 'NOT_FOUND', 'Conta nao encontrada.');
  }

  if (conta.status === 'PAGO') {
    throw new HttpError(409, 'ALREADY_PAID', 'Conta ja esta paga.');
  }

  const dataPagamento = input.dataPagamento ? parseDateOnly(input.dataPagamento) : new Date();
  const nextMonth = monthStart(addMonths(conta.mesReferencia, 1));
  const nextDue = addMonths(conta.dataVencimento, 1);

  return prisma.$transaction(async (tx) => {
    const paid = await tx.conta.update({
      where: { id: conta.id },
      data: { status: 'PAGO', dataPagamento },
      include: includeConta
    });

    // Apenas contas de ALUGUEL geram recorrência automática
    if (conta.tipo === 'ALUGUEL' && conta.contrato.status === 'ATIVO') {
      await tx.conta.upsert({
        where: {
          contratoId_mesReferencia_tipo: {
            contratoId: conta.contratoId,
            mesReferencia: nextMonth,
            tipo: 'ALUGUEL'
          }
        },
        update: {},
        create: {
          contratoId: conta.contratoId,
          mesReferencia: nextMonth,
          dataVencimento: nextDue,
          valor: conta.valor,
          status: 'PENDENTE',
          tipo: 'ALUGUEL'
        }
      });
    }

    return paid;
  });
}
export async function desmarcarContaPaga(usuarioId: string, contaId: string) {
  const conta = await prisma.conta.findFirst({
    where: { id: contaId, contrato: { empreendimento: { usuarioId } } }
  });

  if (!conta) {
    throw new HttpError(404, 'NOT_FOUND', 'Conta nao encontrada.');
  }

  if (conta.status !== 'PAGO') {
    throw new HttpError(409, 'NOT_PAID', 'Conta nao esta paga.');
  }

  return prisma.conta.update({
    where: { id: conta.id },
    data: { status: 'PENDENTE', dataPagamento: null },
    include: includeConta
  });
}

export async function atualizarAtrasos() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return prisma.conta.updateMany({
    where: {
      status: 'PENDENTE',
      dataVencimento: { lt: today }
    },
    data: { status: 'EM_ATRASO' }
  });
}

export async function buildContasWorkbook(usuarioId: string, filters: ContaFilters) {
  const contas = await prisma.conta.findMany({
    where: whereContas(usuarioId, filters),
    include: includeConta,
    orderBy: [{ dataVencimento: 'asc' }, { createdAt: 'desc' }]
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Contas');

  sheet.columns = [
    { header: 'Empreendimento', key: 'empreendimento', width: 28 },
    { header: 'Inquilino', key: 'inquilino', width: 28 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Mes referencia', key: 'mesReferencia', width: 18 },
    { header: 'Vencimento', key: 'dataVencimento', width: 16 },
    { header: 'Pagamento', key: 'dataPagamento', width: 16 },
    { header: 'Valor', key: 'valor', width: 14 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  for (const conta of contas) {
    sheet.addRow({
      empreendimento: conta.contrato.empreendimento.nome,
      inquilino: conta.contrato.nomeInquilino,
      tipo: conta.tipo,
      mesReferencia: conta.mesReferencia,
      dataVencimento: conta.dataVencimento,
      dataPagamento: conta.dataPagamento,
      valor: Number(conta.valor),
      status: conta.status
    });
  }

  sheet.getRow(1).font = { bold: true };
  sheet.getColumn('valor').numFmt = '"R$"#,##0.00';

  return workbook;
}
