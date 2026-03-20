import { z } from "zod";

export const updateParcelaSchema = z.object({
  data_pagamento: z.string().date().nullable().optional(),
  status: z.enum(["pendente", "pago", "vencido", "cancelado"]).optional(),
});

export type UpdateParcelaInput = z.infer<typeof updateParcelaSchema>;
