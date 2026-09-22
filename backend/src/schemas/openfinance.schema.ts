import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hexadecimal, ex: #8A05BE");

export const uuidParamsSchema = z.object({
  id: z.string().uuid("id deve ser um UUID válido"),
});

/** Só o que é personalização do usuário: o resto vem da Pluggy a cada sync. */
export const updateContaSchema = z
  .object({
    apelido: z.string().min(1).max(100).optional(),
    cor: hexColor.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Informe apelido ou cor",
  });

/**
 * Além de apelido e cor, o cartão aceita os dias de fechamento e vencimento
 * digitados à mão: a Pluggy manda balanceCloseDate nulo em alguns conectores.
 */
export const updateCartaoSchema = z
  .object({
    apelido: z.string().min(1).max(100).optional(),
    cor: hexColor.optional(),
    dia_fechamento_manual: z.number().int().min(1).max(31).optional(),
    dia_vencimento_manual: z.number().int().min(1).max(31).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Nenhum campo informado",
  });

export const classificarSchema = z.object({
  itens: z
    .array(
      z.object({
        id: z.string().uuid(),
        destino: z.enum(["gasto", "renda", "ignorado", "a_classificar"]),
        categoria_id: z.number().int().positive().optional(),
      }),
    )
    .min(1)
    .max(500),
});

export const updateGastoSchema = z
  .object({
    categoria_id: z.number().int().positive().optional(),
    observacoes: z.string().max(2000).optional(),
  })
  .refine((d) => d.categoria_id !== undefined || d.observacoes !== undefined, {
    message: "Informe categoria_id ou observacoes",
  });

export const updateAssinaturaSchema = z
  .object({
    status: z.enum(["sugerida", "confirmada", "ignorada"]).optional(),
    nome: z.string().min(1).max(150).optional(),
    categoria_id: z.number().int().positive().optional(),
    dia_cobranca: z.number().int().min(1).max(31).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Nenhum campo informado",
  });

export type ClassificarInput = z.infer<typeof classificarSchema>;
