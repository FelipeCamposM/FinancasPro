import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
});

export const updatePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(100),
});

const formasPagamento = [
  "dinheiro",
  "cartao_credito",
  "cartao_debito",
  "pix",
  "transferencia",
  "outro",
] as const;

/** Preferências do usuário — todas opcionais no PUT (merge com o que já existe). */
export const preferenciasSchema = z.object({
  // ── Alertas ──────────────────────────────────────────────
  /** Dispara o alerta crítico quando os gastos atingem esse % da renda do mês. */
  limite_gastos_percentual: z.number().int().min(10).max(300).optional(),
  /** Liga o sino/banner de gastos acima do limite. */
  alerta_gastos_ativo: z.boolean().optional(),
  /** Liga o aviso de fatura fechada e ainda não paga. */
  alerta_fatura_ativo: z.boolean().optional(),
  /** Avisa também as faturas a vencer dentro desse número de dias (0 = só as fechadas). */
  alerta_fatura_dias_antes: z.number().int().min(0).max(15).optional(),
  /** Avisa quando o ritmo de gastos projeta saldo negativo no fim do mês. */
  alerta_saldo_projetado: z.boolean().optional(),
  /** Avisa quando uma categoria passa do teto mensal dela. */
  alerta_categoria_ativo: z.boolean().optional(),
  /** Silencia todos os alertas até esta data (YYYY-MM-DD). */
  alertas_silenciados_ate: z.string().date().nullable().optional(),

  // ── Padrões de lançamento ────────────────────────────────
  forma_pagamento_padrao: z.enum(formasPagamento).optional(),
  cartao_padrao_id: z.string().uuid().nullable().optional(),
  categoria_gasto_padrao: z.number().int().positive().nullable().optional(),
  categoria_renda_padrao: z.number().int().positive().nullable().optional(),
  /** Quantos meses de assinatura são lançados à frente na criação. */
  assinatura_meses_antecipados: z.number().int().min(6).max(60).optional(),
  /** Lança as rendas recorrentes do mês ao abrir a tela de renda. */
  auto_lancar_renda: z.boolean().optional(),

  // ── Comportamento das telas ──────────────────────────────
  pagina_inicial: z
    .enum(["dashboard", "gastos", "renda", "relatorios"])
    .optional(),
  itens_por_pagina: z.union([
    z.literal(10),
    z.literal(15),
    z.literal(25),
    z.literal(50),
  ]).optional(),
  periodo_padrao: z.enum(["mes", "todos"]).optional(),
  ordenacao_gastos: z
    .object({
      campo: z.enum(["data", "descricao", "categoria", "status", "pagamento", "valor"]),
      direcao: z.enum(["asc", "desc"]),
    })
    .optional(),
  /** Borra os valores na tela (útil em público). */
  modo_privacidade: z.boolean().optional(),
  /** Mantém a tela no mês anterior enquanto a fatura dele não fecha. */
  abrir_mes_apos_fechamento: z.boolean().optional(),

  // ── Aparência ────────────────────────────────────────────
  /** Identificador do fundo animado escolhido. */
  background: z.string().max(40).optional(),
});

export const PREFERENCIAS_PADRAO = {
  limite_gastos_percentual: 100,
  alerta_gastos_ativo: true,
  alerta_fatura_ativo: true,
  alerta_fatura_dias_antes: 0,
  alerta_saldo_projetado: true,
  alerta_categoria_ativo: true,
  alertas_silenciados_ate: null,

  forma_pagamento_padrao: "dinheiro",
  cartao_padrao_id: null,
  categoria_gasto_padrao: null,
  categoria_renda_padrao: null,
  assinatura_meses_antecipados: 24,
  auto_lancar_renda: true,

  pagina_inicial: "dashboard",
  itens_por_pagina: 15,
  periodo_padrao: "mes",
  ordenacao_gastos: { campo: "data", direcao: "desc" },
  modo_privacidade: false,
  abrir_mes_apos_fechamento: true,

  background: "padrao",
} as const;

/** Lê as preferências de um usuário já mescladas com os padrões. */
export type Preferencias = typeof PREFERENCIAS_PADRAO;

export type PreferenciasInput = z.infer<typeof preferenciasSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
