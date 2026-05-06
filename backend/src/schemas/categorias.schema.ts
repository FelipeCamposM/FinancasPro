import { z } from "zod";

export const createCategoriaSchema = z.object({
  nome: z.string().min(1).max(100),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser hexadecimal, ex: #FF5733")
    .optional(),
  icone: z.string().max(50).optional(),
  tipo: z.enum(["gasto", "renda"]),
});

export const updateCategoriaSchema = createCategoriaSchema.partial();

export const importCategoriasSchema = z.object({
  categorias: z.array(createCategoriaSchema).min(1).max(200),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
export type ImportCategoriasInput = z.infer<typeof importCategoriasSchema>;
