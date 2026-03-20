import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hexadecimal, ex: #8A05BE");

export const createCartaoSchema = z
  .object({
    apelido: z.string().min(1).max(50),
    nome_no_cartao: z.string().min(1).max(100),
    ultimos_4_digitos: z
      .string()
      .length(4)
      .regex(/^\d{4}$/, "Deve conter exatamente 4 dígitos numéricos"),
    bandeira: z.enum([
      "visa",
      "mastercard",
      "elo",
      "amex",
      "hipercard",
      "discover",
      "outro",
    ]),
    tipo: z.enum(["credito", "debito", "credito_debito"]),
    cor: hexColor,
    banco: z.string().min(1).max(100),
    limite: z.number().positive().optional(),
    dia_fechamento: z.number().int().min(1).max(31).optional(),
    dia_vencimento: z.number().int().min(1).max(31).optional(),
  })
  .refine(
    (data) => {
      if (data.tipo === "debito") return true;
      return (
        data.limite !== undefined &&
        data.dia_fechamento !== undefined &&
        data.dia_vencimento !== undefined
      );
    },
    {
      message:
        "Cartões de crédito exigem limite, dia_fechamento e dia_vencimento",
      path: ["limite"],
    },
  );

export const updateCartaoSchema = z.object({
  apelido: z.string().min(1).max(50).optional(),
  nome_no_cartao: z.string().min(1).max(100).optional(),
  cor: hexColor.optional(),
  banco: z.string().min(1).max(100).optional(),
  limite: z.number().positive().nullable().optional(),
  dia_fechamento: z.number().int().min(1).max(31).nullable().optional(),
  dia_vencimento: z.number().int().min(1).max(31).nullable().optional(),
  ativo: z.boolean().optional(),
});

export type CreateCartaoInput = z.infer<typeof createCartaoSchema>;
export type UpdateCartaoInput = z.infer<typeof updateCartaoSchema>;
