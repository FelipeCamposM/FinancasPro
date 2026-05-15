import { z } from "zod";

const tipoCofrinhoSchema = z.enum(["acao", "conta"]);
const optionalDateSchema = z.string().date().nullable().optional();
const optionalTextSchema = z.string().max(1000).nullable().optional();

export const createCofrinhoSchema = z
  .object({
    tipo: tipoCofrinhoSchema,
    nome: z.string().min(1).max(120),
    saldo_atual: z.number().min(0).default(0),
    meta_valor: z.number().positive().nullable().optional(),
    ticker: z
      .string()
      .min(1)
      .max(12)
      .transform((value) => value.toUpperCase())
      .nullable()
      .optional(),
    quantidade_cotas: z.number().positive().nullable().optional(),
    valor_cota: z.number().positive().nullable().optional(),
    instituicao: z.string().max(120).nullable().optional(),
    data_alvo: optionalDateSchema,
    observacoes: optionalTextSchema,
    ativo: z.boolean().optional(),
  })
  .refine((data) => data.tipo !== "acao" || !!data.ticker, {
    message: "ticker é obrigatório para ações",
    path: ["ticker"],
  })
  .refine((data) => data.tipo !== "acao" || !!data.quantidade_cotas, {
    message: "quantidade_cotas é obrigatória para ações",
    path: ["quantidade_cotas"],
  })
  .refine((data) => data.tipo !== "acao" || !!data.valor_cota, {
    message: "valor_cota é obrigatório para ações",
    path: ["valor_cota"],
  });

export const updateCofrinhoSchema = z
  .object({
    tipo: tipoCofrinhoSchema.optional(),
    nome: z.string().min(1).max(120).optional(),
    saldo_atual: z.number().min(0).optional(),
    meta_valor: z.number().positive().nullable().optional(),
    ticker: z
      .string()
      .min(1)
      .max(12)
      .transform((value) => value.toUpperCase())
      .nullable()
      .optional(),
    quantidade_cotas: z.number().positive().nullable().optional(),
    valor_cota: z.number().positive().nullable().optional(),
    instituicao: z.string().max(120).nullable().optional(),
    data_alvo: optionalDateSchema,
    observacoes: optionalTextSchema,
    ativo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const depositarContaSchema = z.object({
  valor: z.number().positive(),
  observacoes: z.string().max(1000).optional(),
});

export const depositarAcaoSchema = z.object({
  quantidade_cotas: z.number().positive(),
  valor_cota: z.number().positive(),
  observacoes: z.string().max(1000).optional(),
});

export type CreateCofrinhoInput = z.infer<typeof createCofrinhoSchema>;
export type UpdateCofrinhoInput = z.infer<typeof updateCofrinhoSchema>;
export type DepositarContaInput = z.infer<typeof depositarContaSchema>;
export type DepositarAcaoInput = z.infer<typeof depositarAcaoSchema>;
