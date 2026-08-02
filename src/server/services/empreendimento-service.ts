import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/http-error.js';
import { prisma } from '../lib/prisma.js';

const selectEmpreendimento = {
  id: true,
  nome: true,
  tipo: true,
  statusImovel: true,
  inscricaoIptu: true,
  valorPadrao: true,
  endereco: {
    select: {
      id: true,
      cep: true,
      rua: true,
      numero: true,
      bairro: true,
      cidade: true,
      estado: true
    }
  },
  createdAt: true,
  updatedAt: true
};

type EnderecoInput = {
  cep: string;
  rua: string;
  numero?: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type EmpreendimentoCreateInput = {
  nome: string;
  tipo: 'CASA' | 'APARTAMENTO' | 'COMERCIAL' | 'OUTRO';
  statusImovel?: 'DISPONIVEL' | 'ALUGADO' | 'MANUTENCAO';
  inscricaoIptu?: string;
  valorPadrao: number;
  endereco: EnderecoInput;
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
  input: EmpreendimentoCreateInput
) {
  return prisma.empreendimento.create({
    data: {
      usuarioId,
      nome: input.nome,
      tipo: input.tipo,
      statusImovel: input.statusImovel ?? 'DISPONIVEL',
      inscricaoIptu: input.inscricaoIptu ?? null,
      valorPadrao: new Prisma.Decimal(input.valorPadrao),
      endereco: {
        create: {
          cep: input.endereco.cep,
          rua: input.endereco.rua,
          numero: input.endereco.numero ?? null,
          bairro: input.endereco.bairro,
          cidade: input.endereco.cidade,
          estado: input.endereco.estado
        }
      }
    },
    select: selectEmpreendimento
  });
}

export async function updateEmpreendimento(
  usuarioId: string,
  id: string,
  input: Partial<EmpreendimentoCreateInput>
) {
  await assertOwnsEmpreendimento(usuarioId, id);

  return prisma.empreendimento.update({
    where: { id },
    data: {
      ...(input.nome ? { nome: input.nome } : {}),
      ...(input.tipo ? { tipo: input.tipo } : {}),
      ...(input.statusImovel ? { statusImovel: input.statusImovel } : {}),
      ...(input.inscricaoIptu !== undefined ? { inscricaoIptu: input.inscricaoIptu } : {}),
      ...(input.valorPadrao !== undefined
        ? { valorPadrao: new Prisma.Decimal(input.valorPadrao) }
        : {}),
      ...(input.endereco
        ? {
            endereco: {
              upsert: {
                create: {
                  cep: input.endereco.cep,
                  rua: input.endereco.rua,
                  numero: input.endereco.numero ?? null,
                  bairro: input.endereco.bairro,
                  cidade: input.endereco.cidade,
                  estado: input.endereco.estado
                },
                update: {
                  cep: input.endereco.cep,
                  rua: input.endereco.rua,
                  numero: input.endereco.numero ?? null,
                  bairro: input.endereco.bairro,
                  cidade: input.endereco.cidade,
                  estado: input.endereco.estado
                }
              }
            }
          }
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
