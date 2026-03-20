import { z } from "zod";

const formasPagamento = [
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "pix",
  "transferencia",
  "outro",
] as const;
const frequencias = [
  "diario",
  "semanal",
  "quinzenal",
  "mensal",
  "bimestral",
  "trimestral",
  "semestral",
  "anual",
] as const;

export const createGastoSchema = z
  .object({
    descricao: z.string().min(1).max(255),
    valor_total: z.number().positive(),
    categoria_id: z.number().int().positive().optional(),
    forma_pagamento: z.enum(formasPagamento),
    cartao_id: z.string().uuid().optional(),
    tipo_pagamento: z.enum(["a_vista", "parcelado"]).default("a_vista"),
    quantidade_parcelas: z.number().int().min(1).default(1),
    recorrente: z.boolean().default(false),
    frequencia_recorrencia: z.enum(frequencias).optional(),
    data_fim_recorrencia: z.string().date().optional(),
    data_gasto: z.string().date(),
    observacoes: z.string().max(1000).optional(),
    status: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
    gasto_origem_id: z.string().uuid().optional(),
  })
  .refine(
    (d) => {
      if (
        d.forma_pagamento === "cartao_credito" ||
        d.forma_pagamento === "cartao_debito"
      ) {
        return !!d.cartao_id;
      }
      return true;
    },
    {
      message: "cartao_id é obrigatório para pagamentos com cartão",
      path: ["cartao_id"],
    },
  )
  .refine((d) => (d.recorrente ? !!d.frequencia_recorrencia : true), {
    message: "frequencia_recorrencia é obrigatória quando recorrente=true",
    path: ["frequencia_recorrencia"],
  })
  .refine(
    (d) =>
      d.tipo_pagamento === "parcelado" ? d.quantidade_parcelas > 1 : true,
    {
      message:
        "quantidade_parcelas deve ser > 1 quando tipo_pagamento=parcelado",
      path: ["quantidade_parcelas"],
    },
  );

export const updateGastoSchema = z.object({
  descricao: z.string().min(1).max(255).optional(),
  valor_total: z.number().positive().optional(),
  categoria_id: z.number().int().positive().nullable().optional(),
  forma_pagamento: z.enum(formasPagamento).optional(),
  cartao_id: z.string().uuid().nullable().optional(),
  recorrente: z.boolean().optional(),
  frequencia_recorrencia: z.enum(frequencias).nullable().optional(),
  data_fim_recorrencia: z.string().date().nullable().optional(),
  data_gasto: z.string().date().optional(),
  observacoes: z.string().max(1000).nullable().optional(),
  status: z.enum(["pendente", "pago", "cancelado"]).optional(),
});

export type CreateGastoInput = z.infer<typeof createGastoSchema>;
export type UpdateGastoInput = z.infer<typeof updateGastoSchema>;
