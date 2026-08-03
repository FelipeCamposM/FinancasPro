"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, TrendingDown, TriangleAlert } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api, getToken } from "@/lib/api";
import {
  usePreferencias,
  salvarPreferencias,
  PREFERENCIAS_PADRAO,
} from "@/lib/preferencias";

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const mesPorExtenso = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

export interface CategoriaEstourada {
  id: number;
  nome: string;
  cor: string | null;
  limite_mensal: number;
  gasto: number;
  excedente: number;
  percentual: number;
}

/** Payload de `GET /dashboard/alertas` — já filtrado pelas preferências. */
export interface AlertasStatus {
  mes: string;
  silenciado: boolean;
  total_gastos: number;
  total_renda: number;
  limite_percentual: number;
  gastos_acima_limite: boolean;
  excedente: number;
  projecao_negativa: boolean;
  gasto_projetado: number;
  categorias_estouradas: CategoriaEstourada[];
}

export interface AlertaOrcamento {
  mes: string;
  totalGastos: number;
  totalRenda: number;
  /** Limite configurado nas preferências (% da renda). */
  limitePercentual: number;
  /** Quanto passou do limite. */
  excedente: number;
  /** Quanto os gastos representam da renda (null quando não há renda no mês). */
  percentual: number | null;
}

/**
 * Crítico = gastos atingiram o limite configurado da renda do mês
 * (padrão 100%, ou seja, gastou mais do que entrou).
 */
export function calcularAlerta(
  mes: string,
  totalGastos: number,
  totalRenda: number,
  limitePercentual: number = PREFERENCIAS_PADRAO.limite_gastos_percentual,
): AlertaOrcamento | null {
  const teto = totalRenda * (limitePercentual / 100);
  if (totalGastos <= teto) return null;
  if (totalRenda <= 0 && totalGastos <= 0) return null;
  return {
    mes,
    totalGastos,
    totalRenda,
    limitePercentual,
    excedente: totalGastos - teto,
    percentual: totalRenda > 0 ? (totalGastos / totalRenda) * 100 : null,
  };
}

/** Banner de alerta crítico. Não renderiza nada quando gastos <= renda. */
export function OrcamentoAlertaBanner({
  mes,
  totalGastos,
  totalRenda,
  className = "",
}: {
  mes: string;
  totalGastos: number;
  totalRenda: number;
  className?: string;
}) {
  const prefs = usePreferencias();
  const alerta = prefs.alerta_gastos_ativo
    ? calcularAlerta(mes, totalGastos, totalRenda, prefs.limite_gastos_percentual)
    : null;
  if (!alerta) return null;

  const acimaDaRenda = alerta.limitePercentual >= 100;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/[0.10] px-4 py-3.5 ${className}`}
    >
      <div
        data-alerta-icone
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 ring-1 ring-rose-400/25"
      >
        <TriangleAlert className="h-4.5 w-4.5 text-rose-400" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold uppercase tracking-[0.06em] text-rose-200">
          Alerta crítico ·{" "}
          {acimaDaRenda
            ? "gastos acima da renda"
            : `gastos acima de ${alerta.limitePercentual}% da renda`}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-white/60">
          Em <span className="capitalize">{mesPorExtenso(alerta.mes)}</span> você
          passou{" "}
          <span className="font-semibold text-rose-300">
            {formatBRL(alerta.excedente)}
          </span>{" "}
          do seu limite
          {alerta.percentual !== null && (
            <>
              {" "}
              — {alerta.percentual.toFixed(0)}% da renda comprometida
            </>
          )}
          .
        </p>
        <p className="mt-1 text-[12px] tabular-nums text-white/35">
          Gastos {formatBRL(alerta.totalGastos)} · Renda{" "}
          {formatBRL(alerta.totalRenda)}
        </p>
      </div>
    </div>
  );
}

/** Sino do topo — badge vermelho quando o mês corrente está no vermelho. */
export function OrcamentoAlertaSino() {
  const [alerta, setAlerta] = useState<AlertaOrcamento | null>(null);
  const [status, setStatus] = useState<AlertasStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    const mes = new Date().toISOString().slice(0, 7);
    api
      .get<{ data: AlertasStatus }>(`/dashboard/alertas?mes=${mes}`)
      .then(({ data }) => {
        const s = data.data;
        if (s.silenciado) return;
        setStatus(s);
        if (s.gastos_acima_limite) {
          setAlerta(
            calcularAlerta(mes, s.total_gastos, s.total_renda, s.limite_percentual),
          );
        }
      })
      .catch(() => {});
  }, []);

  /** Adia todos os alertas até amanhã. */
  async function lembrarDepois() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    await salvarPreferencias({
      alertas_silenciados_ate: amanha.toISOString().slice(0, 10),
    }).catch(() => {});
    setStatus(null);
    setAlerta(null);
    setOpen(false);
  }

  const categorias = status?.categorias_estouradas ?? [];
  const projecao = status?.projecao_negativa ?? false;
  const temAlerta = !!alerta || categorias.length > 0 || projecao;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            temAlerta
              ? "Alertas financeiros pendentes"
              : "Notificações"
          }
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.10] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <Bell className="h-[18px] w-[18px]" />
          {temAlerta && (
            <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-[#141018]" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="ui-popover ui-glass-surface-strong w-[320px] border-white/[0.14] p-0"
      >
        <div className="border-b border-white/[0.08] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/40">
            Notificações
          </p>
        </div>

        {alerta ? (
          <Link
            href="/relatorios"
            onClick={() => setOpen(false)}
            className="block px-4 py-3.5 transition-colors hover:bg-white/[0.05]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 ring-1 ring-rose-400/25">
                <TriangleAlert className="h-4 w-4 text-rose-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-rose-200">
                  Gastos acima da renda
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">
                  <span className="capitalize">{mesPorExtenso(alerta.mes)}</span>{" "}
                  fechou {formatBRL(alerta.excedente)} no vermelho.
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] tabular-nums text-white/30">
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  {formatBRL(alerta.totalGastos)} gastos ·{" "}
                  {formatBRL(alerta.totalRenda)} renda
                </p>
              </div>
            </div>
          </Link>
        ) : null}

        {/* Projeção: ainda dentro do limite, mas o ritmo do mês estoura */}
        {projecao && status && (
          <Link
            href="/relatorios"
            onClick={() => setOpen(false)}
            className="block border-t border-white/[0.06] px-4 py-3.5 transition-colors hover:bg-white/[0.05]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-400/25">
                <TrendingDown className="h-4 w-4 text-amber-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-amber-200">
                  Ritmo de gastos vai estourar o limite
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">
                  Mantendo esse ritmo, o mês fecha em{" "}
                  {formatBRL(status.gasto_projetado)}.
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Categorias acima do teto mensal */}
        {categorias.map((c) => (
          <Link
            key={c.id}
            href="/relatorios"
            onClick={() => setOpen(false)}
            className="block border-t border-white/[0.06] px-4 py-3.5 transition-colors hover:bg-white/[0.05]"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.cor ?? "#f43f5e" }}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-rose-200">
                  {c.nome} passou do teto
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-white/50">
                  {formatBRL(c.gasto)} de {formatBRL(c.limite_mensal)} ({c.percentual}%)
                </p>
              </div>
            </div>
          </Link>
        ))}

        {!temAlerta && (
          <p className="px-4 py-6 text-center text-[12px] text-white/35">
            Nenhum alerta no momento
          </p>
        )}

        {temAlerta && (
          <div className="flex justify-end border-t border-white/[0.08] px-4 py-2.5">
            <button
              type="button"
              onClick={lembrarDepois}
              className="text-[11px] font-medium text-white/40 transition-colors hover:text-white/70"
            >
              Lembrar depois
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
