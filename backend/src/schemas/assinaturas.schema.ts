import { z } from "zod";

const formasPagamento = [
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "pix",
  "transferencia",
  "outro",
] as const;

export const createAssinaturaSchema = z
  .object({
    descricao: z.string().min(1).max(255),
    valor: z.number().positive(),
    categoria_id: z.number().int().positive().optional(),
    forma_pagamento: z.enum(formasPagamento),
    cartao_id: z.string().uuid().optional(),
    dia_cobranca: z.number().int().min(1).max(31).default(1),
    data_inicio: z.string().date(),
    observacoes: z.string().max(1000).optional(),
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
  );

export const cancelAssinaturaSchema = z.object({});

export const updateAssinaturaSchema = z.object({
  descricao: z.string().min(1).max(255).optional(),
  valor: z.number().positive().optional(),
  categoria_id: z.number().int().positive().nullable().optional(),
  forma_pagamento: z.enum(formasPagamento).optional(),
  cartao_id: z.string().uuid().nullable().optional(),
  observacoes: z.string().max(1000).nullable().optional(),
  dia_cobranca: z.number().int().min(1).max(31).optional(),
  data_inicio: z.string().date().optional(),
});

export type CreateAssinaturaInput = z.infer<typeof createAssinaturaSchema>;
export type CancelAssinaturaInput = z.infer<typeof cancelAssinaturaSchema>;
export type UpdateAssinaturaInput = z.infer<typeof updateAssinaturaSchema>;
