import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';

const selectEmpreendimento = {
  id: true,
  nome: true,
  endereco: true,
  valorPadrao: true,
  createdAt: true,
  updatedAt: true
};

export async function listEmpreendimentos(usuarioId: string) {
  return prisma.empreendimento.findMany({
    where: { usuarioId },
    select: selectEmpreendimento,
    orderBy: { nome: 'asc' }
  });
}

export async function createEmpreendimento(
  usuarioId: string,
  input: { nome: string; endereco: string; valorPadrao: number }
) {
  return prisma.empreendimento.create({
    data: {
      usuarioId,
      nome: input.nome,
      endereco: input.endereco,
      valorPadrao: new Prisma.Decimal(input.valorPadrao)
    },
    select: selectEmpreendimento
  });
}

export async function updateEmpreendimento(
  usuarioId: string,
  id: string,
  input: Partial<{ nome: string; endereco: string; valorPadrao: number }>
) {
  await assertOwnsEmpreendimento(usuarioId, id);

  return prisma.empreendimento.update({
    where: { id },
    data: {
      ...(input.nome ? { nome: input.nome } : {}),
      ...(input.endereco ? { endereco: input.endereco } : {}),
      ...(input.valorPadrao !== undefined
        ? { valorPadrao: new Prisma.Decimal(input.valorPadrao) }
        : {})
    },
    select: selectEmpreendimento
  });
}

export async function deleteEmpreendimento(usuarioId: string, id: string) {
  await assertOwnsEmpreendimento(usuarioId, id);
  await prisma.empreendimento.delete({ where: { id } });
}

export async function assertOwnsEmpreendimento(usuarioId: string, id: string) {
  const found = await prisma.empreendimento.findFirst({
    where: { id, usuarioId },
    select: { id: true }
  });

  if (!found) {
    throw new HttpError(404, 'NOT_FOUND', 'Empreendimento nao encontrado.');
  }
}
