"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Repeat,
  PiggyBank,
  FileBarChart,
  Settings,
  User,
} from "lucide-react";
import {
  SECOES_CONFIGURACOES,
  rotaSecao,
} from "@/lib/configuracoes-secoes";

export type CommandPaletteEntry = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  subtitle?: string;
  keywords?: string[];
};

export function commandPaletteFilterValue(entry: CommandPaletteEntry): string {
  return [entry.label, entry.subtitle, ...(entry.keywords ?? [])]
    .filter(Boolean)
    .join(" ");
}

export const COMMAND_PALETTE_GROUPS: { heading: string; items: CommandPaletteEntry[] }[] =
  [
    {
      heading: "Navegação",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          subtitle: "Painel e resumo",
          keywords: ["painel", "inicio", "home", "resumo", "visao"],
        },
        {
          id: "gastos",
          label: "Gastos",
          href: "/gastos",
          icon: TrendingDown,
          subtitle: "Despesas e lançamentos",
          keywords: ["despesas", "compras", "extrato", "saidas"],
        },
        {
          id: "renda",
          label: "Renda",
          href: "/renda",
          icon: TrendingUp,
          subtitle: "Entradas e origens",
          keywords: ["salario", "entrada", "ganhos", "receita"],
        },
        {
          id: "cartoes",
          label: "Cartões",
          href: "/cartoes",
          icon: CreditCard,
          subtitle: "Faturas e limites",
          keywords: ["cartao", "credito", "fatura", "limite"],
        },
        {
          id: "assinaturas",
          label: "Assinaturas",
          href: "/assinaturas",
          icon: Repeat,
          subtitle: "Recorrências mensais",
          keywords: ["mensalidade", "spotify", "netflix", "plano"],
        },
        {
          id: "cofrinhos",
          label: "Cofrinhos",
          href: "/cofrinhos",
          icon: PiggyBank,
          subtitle: "Metas e reservas",
          keywords: ["poupanca", "meta", "objetivo", "guardar"],
        },
        {
          id: "relatorios",
          label: "Relatórios",
          href: "/relatorios",
          icon: FileBarChart,
          subtitle: "Análises e gráficos",
          keywords: ["graficos", "analise", "exportar"],
        },
      ],
    },
    {
      heading: "Conta e configurações",
      items: [
        {
          id: "perfil",
          label: "Perfil",
          href: "/perfil",
          icon: User,
          subtitle: "Nome, e-mail e avatar",
          keywords: ["conta", "usuario", "senha", "avatar", "email"],
        },
        {
          id: "config",
          label: "Configurações",
          href: "/configuracoes",
          icon: Settings,
          subtitle: "Preferências da conta",
          keywords: ["ajustes", "preferencias", "opcoes", "conta"],
        },
        // As seções de Configurações entram automaticamente a partir de
        // SECOES_CONFIGURACOES: a mesma lista que monta a navegação da tela.
        ...SECOES_CONFIGURACOES.map(
          ({ id, label, desc, icon, keywords }): CommandPaletteEntry => ({
            id: `config-${id}`,
            label,
            href: rotaSecao(id),
            icon,
            subtitle: `Em Configurações · ${desc}`,
            keywords: [...keywords, "configuracoes", "ajustes", "preferencias"],
          }),
        ),
      ],
    },
  ];
