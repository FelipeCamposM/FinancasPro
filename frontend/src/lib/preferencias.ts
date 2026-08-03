"use client";

import { useEffect, useState } from "react";
import { api, getToken } from "@/lib/api";

export type FormaPagamento =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "transferencia"
  | "outro";

export type PaginaInicial = "dashboard" | "gastos" | "renda" | "relatorios";

export interface Preferencias {
  // Alertas
  limite_gastos_percentual: number;
  alerta_gastos_ativo: boolean;
  alerta_fatura_ativo: boolean;
  alerta_fatura_dias_antes: number;
  alerta_saldo_projetado: boolean;
  alerta_categoria_ativo: boolean;
  alertas_silenciados_ate: string | null;

  // Padrões de lançamento
  forma_pagamento_padrao: FormaPagamento;
  cartao_padrao_id: string | null;
  categoria_gasto_padrao: number | null;
  categoria_renda_padrao: number | null;
  assinatura_meses_antecipados: number;
  auto_lancar_renda: boolean;

  // Comportamento das telas
  pagina_inicial: PaginaInicial;
  itens_por_pagina: 10 | 15 | 25 | 50;
  periodo_padrao: "mes" | "todos";
  ordenacao_gastos: {
    campo: "data" | "descricao" | "categoria" | "status" | "pagamento" | "valor";
    direcao: "asc" | "desc";
  };
  modo_privacidade: boolean;
  abrir_mes_apos_fechamento: boolean;

  // Aparência
  background: string;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
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
};

// Uma requisição por sessão — várias telas consomem as mesmas preferências.
let cache: Promise<Preferencias> | null = null;

// Quem estiver montado é avisado quando as preferências mudam, para a tela
// refletir a alteração na hora (sem recarregar a página).
type Ouvinte = (p: Preferencias) => void;
const ouvintes = new Set<Ouvinte>();

export function fetchPreferencias(): Promise<Preferencias> {
  if (!getToken()) return Promise.resolve(PREFERENCIAS_PADRAO);
  if (!cache) {
    cache = api
      .get<{ data: Preferencias }>("/users/me/preferencias")
      .then(({ data }) => ({ ...PREFERENCIAS_PADRAO, ...data.data }))
      .catch(() => PREFERENCIAS_PADRAO);
  }
  return cache;
}

export async function salvarPreferencias(
  patch: Partial<Preferencias>,
): Promise<Preferencias> {
  const { data } = await api.put<{ data: Preferencias }>(
    "/users/me/preferencias",
    patch,
  );
  const atualizadas = { ...PREFERENCIAS_PADRAO, ...data.data };
  cache = Promise.resolve(atualizadas);
  ouvintes.forEach((ouvir) => ouvir(atualizadas));
  return atualizadas;
}

/** Rota para onde mandar o usuário logo após o login. */
export async function paginaInicial(): Promise<string> {
  const { pagina_inicial } = await fetchPreferencias();
  return `/${pagina_inicial}`;
}

/**
 * Preferências do usuário; devolve os padrões enquanto carrega e re-renderiza
 * sozinho quando alguém chama `salvarPreferencias`.
 */
export function usePreferencias(): Preferencias {
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_PADRAO);

  useEffect(() => {
    let vivo = true;
    const ouvir: Ouvinte = (p) => {
      if (vivo) setPrefs(p);
    };
    ouvintes.add(ouvir);
    fetchPreferencias().then(ouvir);
    return () => {
      vivo = false;
      ouvintes.delete(ouvir);
    };
  }, []);

  return prefs;
}
