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

export async function listContratos(
  usuarioId: string,
  filters: { empreendimentoId?: string; status?: ContratoStatus }
) {
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
    dataVencimentoPadrao: string;
    status: ContratoStatus;
  }
) {
  await assertOwnsEmpreendimento(usuarioId, input.empreendimentoId);
  return prisma.contrato.create({
    data: {
      empreendimentoId: input.empreendimentoId,
      nomeInquilino: input.nomeInquilino,
      dataVencimentoPadrao: parseDateOnly(input.dataVencimentoPadrao),
      status: input.status
    },
    include: includeContrato
  });
}

export async function updateContrato(
  usuarioId: string,
  id: string,
  input: Partial<{ nomeInquilino: string; dataVencimentoPadrao: string; status: ContratoStatus }>
) {
  await assertOwnsContrato(usuarioId, id);
  return prisma.contrato.update({
    where: { id },
    data: {
      ...(input.nomeInquilino ? { nomeInquilino: input.nomeInquilino } : {}),
      ...(input.dataVencimentoPadrao
        ? { dataVencimentoPadrao: parseDateOnly(input.dataVencimentoPadrao) }
        : {}),
      ...(input.status ? { status: input.status } : {})
    },
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
