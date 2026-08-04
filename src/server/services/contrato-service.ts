import type { ContratoStatus } from '@prisma/client';
import { parseDateOnly } from '../lib/dates.js';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';
import { assertOwnsEmpreendimento } from './empreendimento-service.js';

const includeContrato = {
  empreendimento: {
    select: { id: true, nome: true, valorPadrao: true }
  }
};

/** Auto-finaliza contratos ATIVOS cuja dataFim já passou */
async function autoFinalizarContratos(usuarioId: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  await prisma.contrato.updateMany({
    where: {
      status: 'ATIVO',
      dataFim: { lt: hoje },
      empreendimento: { usuarioId }
    },
    data: { status: 'FINALIZADO' }
  });
}

export async function listContratos(
  usuarioId: string,
  filters: { empreendimentoId?: string; status?: ContratoStatus }
) {
  // Auto-finaliza antes de listar
  await autoFinalizarContratos(usuarioId);

  return prisma.contrato.findMany({
    where: {
      ...(filters.empreendimentoId ? { empreendimentoId: filters.empreendimentoId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      empreendimento: { usuarioId }
    },
    include: includeContrato,
    orderBy: { createdAt: 'desc' }
  });
}

export async function createContrato(
  usuarioId: string,
  input: {
    empreendimentoId: string;
    nomeInquilino: string;
    dataInicio: string;
    dataFim: string;
    dataVencimentoPadrao: string;
    multaAtraso: number;
    jurosMensal: number;
    indiceReajuste: string;
  }
) {
  await assertOwnsEmpreendimento(usuarioId, input.empreendimentoId);
  return prisma.contrato.create({
    data: {
      empreendimentoId: input.empreendimentoId,
      nomeInquilino: input.nomeInquilino,
      dataInicio: parseDateOnly(input.dataInicio),
      dataFim: parseDateOnly(input.dataFim),
      dataVencimentoPadrao: parseDateOnly(input.dataVencimentoPadrao),
      multaAtraso: input.multaAtraso,
      jurosMensal: input.jurosMensal,
      indiceReajuste: input.indiceReajuste as any,
      status: 'ATIVO'
    },
    include: includeContrato
  });
}

export async function updateContrato(
  usuarioId: string,
  id: string,
  input: Partial<{
    nomeInquilino: string;
    dataInicio: string;
    dataFim: string;
    dataVencimentoPadrao: string;
    multaAtraso: number;
    jurosMensal: number;
    indiceReajuste: string;
  }>
) {
  await assertOwnsContrato(usuarioId, id);
  return prisma.contrato.update({
    where: { id },
    data: {
      ...(input.nomeInquilino ? { nomeInquilino: input.nomeInquilino } : {}),
      ...(input.dataInicio ? { dataInicio: parseDateOnly(input.dataInicio) } : {}),
      ...(input.dataFim ? { dataFim: parseDateOnly(input.dataFim) } : {}),
      ...(input.dataVencimentoPadrao
        ? { dataVencimentoPadrao: parseDateOnly(input.dataVencimentoPadrao) }
        : {}),
      ...(input.multaAtraso !== undefined ? { multaAtraso: input.multaAtraso } : {}),
      ...(input.jurosMensal !== undefined ? { jurosMensal: input.jurosMensal } : {}),
      ...(input.indiceReajuste ? { indiceReajuste: input.indiceReajuste as any } : {})
    },
    include: includeContrato
  });
}

export async function batchUpdateStatus(
  usuarioId: string,
  ids: string[],
  status: ContratoStatus
) {
  // Verifica se todos os contratos pertencem ao usuário
  const found = await prisma.contrato.findMany({
    where: {
      id: { in: ids },
      empreendimento: { usuarioId }
    },
    select: { id: true }
  });

  if (found.length !== ids.length) {
    throw new HttpError(404, 'NOT_FOUND', 'Um ou mais contratos não foram encontrados.');
  }

  await prisma.contrato.updateMany({
    where: { id: { in: ids } },
    data: { status }
  });

  // Retorna os contratos atualizados
  return prisma.contrato.findMany({
    where: { id: { in: ids } },
    include: includeContrato
  });
}

export async function deleteContrato(usuarioId: string, id: string) {
  await assertOwnsContrato(usuarioId, id);
  await prisma.contrato.delete({ where: { id } });
}

export async function assertOwnsContrato(usuarioId: string, id: string) {
  const found = await prisma.contrato.findFirst({
    where: { id, empreendimento: { usuarioId } },
    select: { id: true }
  });

  if (!found) {
    throw new HttpError(404, 'NOT_FOUND', 'Contrato nao encontrado.');
  }
}
