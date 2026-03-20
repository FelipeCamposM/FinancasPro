import { z } from "zod";

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

export const createRendaSchema = z
  .object({
    descricao: z.string().min(1).max(255),
    valor: z.number().positive(),
    tipo: z.enum([
      "salario",
      "freelance",
      "investimento",
      "aluguel",
      "bonus",
      "outro",
    ]),
    origem: z.string().min(1).max(100),
    categoria_id: z.number().int().positive().optional(),
    mes_referencia: z.string().date(),
    data_recebimento: z.string().date(),
    recorrente: z.boolean().default(false),
    frequencia_recorrencia: z.enum(frequencias).optional(),
    data_fim_recorrencia: z.string().date().optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine((d) => (d.recorrente ? !!d.frequencia_recorrencia : true), {
    message: "frequencia_recorrencia é obrigatória quando recorrente=true",
    path: ["frequencia_recorrencia"],
  });

export const updateRendaSchema = z.object({
  descricao: z.string().min(1).max(255).optional(),
  valor: z.number().positive().optional(),
  tipo: z
    .enum(["salario", "freelance", "investimento", "aluguel", "bonus", "outro"])
    .optional(),
  origem: z.string().min(1).max(100).optional(),
  categoria_id: z.number().int().positive().nullable().optional(),
  mes_referencia: z.string().date().optional(),
  data_recebimento: z.string().date().optional(),
  recorrente: z.boolean().optional(),
  frequencia_recorrencia: z.enum(frequencias).nullable().optional(),
  data_fim_recorrencia: z.string().date().nullable().optional(),
  observacoes: z.string().max(1000).nullable().optional(),
});

export type CreateRendaInput = z.infer<typeof createRendaSchema>;
export type UpdateRendaInput = z.infer<typeof updateRendaSchema>;
