import { z } from "zod";

const strongPassword = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(100)
  .regex(/[A-Z]/, "Deve conter ao menos 1 letra maiúscula")
  .regex(/[a-z]/, "Deve conter ao menos 1 letra minúscula")
  .regex(/[^A-Za-z0-9]/, "Deve conter ao menos 1 caractere especial");

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: strongPassword,
  avatar: z.string().url().optional(),
  user_level: z.enum(["admin", "premium", "free"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: strongPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
