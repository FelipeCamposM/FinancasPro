import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
});

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(100),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
