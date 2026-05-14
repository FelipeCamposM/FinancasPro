import { z } from "zod";

const tipoCofrinhoSchema = z.enum(["acao", "conta", "objetivo"]);
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
    instituicao: z.string().max(120).nullable().optional(),
    data_alvo: optionalDateSchema,
    observacoes: optionalTextSchema,
    ativo: z.boolean().optional(),
  })
  .refine((data) => data.tipo !== "acao" || !!data.ticker, {
    message: "ticker \u00e9 obrigat\u00f3rio para a\u00e7\u00f5es",
    path: ["ticker"],
  })
  .refine((data) => data.tipo !== "acao" || !!data.quantidade_cotas, {
    message: "quantidade_cotas \u00e9 obrigat\u00f3ria para a\u00e7\u00f5es",
    path: ["quantidade_cotas"],
  })
  .refine((data) => data.tipo !== "objetivo" || !!data.meta_valor, {
    message: "meta_valor \u00e9 obrigat\u00f3rio para objetivos",
    path: ["meta_valor"],
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
    instituicao: z.string().max(120).nullable().optional(),
    data_alvo: optionalDateSchema,
    observacoes: optionalTextSchema,
    ativo: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export type CreateCofrinhoInput = z.infer<typeof createCofrinhoSchema>;
export type UpdateCofrinhoInput = z.infer<typeof updateCofrinhoSchema>;
