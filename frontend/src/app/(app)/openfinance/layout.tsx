"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Repeat,
  FileBarChart,
  Link2,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { PageDataState } from "@/components/ui/page-data-state";
import { cn } from "@/lib/utils";

const abas = [
  { href: "/openfinance", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/openfinance/extrato", label: "Extrato", icon: Receipt },
  { href: "/openfinance/gastos", label: "Gastos", icon: TrendingDown },
  { href: "/openfinance/renda", label: "Renda", icon: TrendingUp },
  { href: "/openfinance/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/openfinance/assinaturas", label: "Assinaturas", icon: Repeat },
  { href: "/openfinance/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/openfinance/conexoes", label: "Conexões", icon: Link2 },
];

export default function OpenFinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();

  // A rota já é protegida no backend pelo requireOpenFinance; aqui é só para
  // não deixar a página em branco para quem não tem a flag.
  useEffect(() => {
    if (!loading && user && !user.open_finance_habilitado) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <PageDataState mode="loading" title="Carregando Open Finance" />
    );
  }

  if (!user?.open_finance_habilitado) {
    return (
      <PageDataState
        mode="empty"
        title="Open Finance indisponível"
        description="Esta área não está habilitada para a sua conta."
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav className="ui-glass-surface overflow-x-auto p-2">
        <ul className="flex min-w-max items-center gap-1">
          {abas.map((aba) => {
            const ativo = aba.exact
              ? pathname === aba.href
              : pathname.startsWith(aba.href);
            return (
              <li key={aba.href}>
                <Link
                  href={aba.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-colors",
                    ativo
                      ? "bg-emerald-500/15 font-semibold text-emerald-200"
                      : "text-white/60 hover:bg-white/5 hover:text-white/90",
                  )}
                >
                  <aba.icon className="h-4 w-4" />
                  {aba.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
    </div>
  );
}
