import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const registerSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(180),
  senha: z.string().min(8).max(120)
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1)
});

export const empreendimentoCreateSchema = z.object({
  nome: z.string().min(2).max(140),
  endereco: z.string().min(2).max(255),
  valorPadrao: z.coerce.number().positive()
});

export const empreendimentoUpdateSchema = empreendimentoCreateSchema.partial();

export const contratoCreateSchema = z.object({
  empreendimentoId: z.string().uuid(),
  nomeInquilino: z.string().min(2).max(140),
  dataVencimentoPadrao: dateOnly,
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO')
});

export const contratoUpdateSchema = contratoCreateSchema
  .omit({ empreendimentoId: true })
  .partial();

export const contratoListSchema = z.object({
  empreendimentoId: z.string().uuid().optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional()
});

export const contaCreateSchema = z.object({
  contratoId: z.string().uuid(),
  mesReferencia: dateOnly,
  dataVencimento: dateOnly,
  valor: z.coerce.number().positive(),
  tipo: z.enum(['ALUGUEL', 'CAUCAO']).default('ALUGUEL')
});

export const contaListSchema = z.object({
  status: z.enum(['PENDENTE', 'PAGO', 'EM_ATRASO']).optional(),
  empreendimentoId: z.string().uuid().optional(),
  tipo: z.enum(['ALUGUEL', 'CAUCAO']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const contaExportSchema = contaListSchema.omit({ page: true, pageSize: true });

export const pagamentoSchema = z.object({
  dataPagamento: dateOnly.optional()
});
