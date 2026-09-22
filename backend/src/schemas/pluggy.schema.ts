import { z } from "zod";

export const createPluggyItemSchema = z.object({
  item_id: z.string().uuid("itemId deve ser um UUID válido"),
  apelido: z.string().min(1).max(100).optional(),
});

export type CreatePluggyItemInput = z.infer<typeof createPluggyItemSchema>;

export const pluggyItemParamsSchema = z.object({
  id: z.string().uuid("id deve ser um UUID válido"),
});
