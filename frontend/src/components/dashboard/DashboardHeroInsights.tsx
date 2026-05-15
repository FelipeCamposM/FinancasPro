"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarRange,
  Gift,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DashboardInsightsPayload {
  semana_iso: { inicio: string; fim: string };
  semana_anterior_iso: { inicio: string; fim: string };
  semana_atual: {
    total_gastos: number;
    dias_com_gasto: number;
    media_diaria: number;
    variacao_vs_semana_anterior_pct: number | null;
    gastos_semana_anterior: number;
  };
  ultimos_7_dias: { data: string; total: number }[];
  mes: {
    referencia: string;
    anterior: string;
    total_renda: number;
    total_renda_anterior: number;
    total_gastos: number;
    total_gastos_anterior: number;
    saldo: number;
    saldo_anterior: number;
    variacao_gastos_pct_vs_anterior: number | null;
    variacao_saldo_pct_vs_anterior: number | null;
  };
  recompensa: {
    mostrar: true;
    tipo: string;
    titulo: string;
    mensagem: string;
    valor_bonus_virtual: number;
    aviso_legal: string;
  } | null;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPct(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function DashboardHeroInsights({
  data,
  loading,
}: {
  data: DashboardInsightsPayload | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return (
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-44 rounded-2xl lg:col-span-5" />
        <Skeleton className="h-44 rounded-2xl lg:col-span-4" />
        <Skeleton className="h-44 rounded-2xl lg:col-span-3" />
      </div>
    );
  }

  if (!data) return null;

  const wi = parseISO(data.semana_iso.inicio);
  const wf = parseISO(data.semana_iso.fim);
  const rotuloSemana = `${format(wi, "d MMM", { locale: ptBR })} – ${format(wf, "d MMM yyyy", { locale: ptBR })}`;

  const maxBar = Math.max(
    ...data.ultimos_7_dias.map((d) => Number(d.total)),
    1,
  );

  const vSem = data.semana_atual.variacao_vs_semana_anterior_pct;
  const vMesG = data.mes.variacao_gastos_pct_vs_anterior;
  const vMesS = data.mes.variacao_saldo_pct_vs_anterior;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Recompensa */}
      <Card
        className={cn(
          "overflow-hidden border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.14] via-white/[0.03] to-cyan-500/[0.08] backdrop-blur-xl lg:col-span-5",
          !data.recompensa && "from-white/[0.04] via-white/[0.02] to-white/[0.04] border-white/10",
        )}
      >
        <CardContent className="p-5 sm:p-6">
          {data.recompensa ? (
            <>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30">
                  <Gift className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/80">
                    Recompensa Valora
                  </p>
                  <h2 className="font-display text-2xl uppercase leading-tight tracking-wide text-white sm:text-3xl">
                    {data.recompensa.titulo}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/70">
                    {data.recompensa.mensagem}
                  </p>
                  <div className="flex flex-wrap items-end gap-2 pt-1">
                    <span className="font-display text-4xl tabular-nums leading-none text-emerald-300 sm:text-5xl">
                      {formatBRL(data.recompensa.valor_bonus_virtual)}
                    </span>
                    <span className="pb-1 text-xs font-medium text-emerald-100/80">
                      bonus simbolico
                    </span>
                  </div>
                  <p className="text-[11px] leading-snug text-white/40">
                    {data.recompensa.aviso_legal}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/60 ring-1 ring-white/15">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Continue registrando
                </p>
                <h2 className="font-display text-xl uppercase tracking-wide text-white/90 sm:text-2xl">
                  Insights de recompensa
                </h2>
                <p className="text-sm text-white/55">
                  Quando seus gastos cairem frente ao mes anterior, ou sua semana
                  estiver mais leve, aparece aqui um selo com bonus simbolico para
                  celebrar.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Semana + sparkline */}
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl lg:col-span-4">
        <CardContent className="flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center gap-2 text-white/50">
            <CalendarRange className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
              Esta semana (gastos)
            </span>
          </div>
          <p className="mt-2 font-medium capitalize leading-snug text-white/85">
            {rotuloSemana}
          </p>
          <p className="mt-3 font-display text-3xl tabular-nums text-white">
            {formatBRL(data.semana_atual.total_gastos)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
            <span>{data.semana_atual.dias_com_gasto} dia(s) com lancamento</span>
            <span className="text-white/30">|</span>
            <span>media {formatBRL(data.semana_atual.media_diaria)}/dia</span>
          </div>
          {vSem !== null && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                vSem <= 0
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-400/30 bg-rose-500/10 text-rose-300",
              )}
            >
              {vSem <= 0 ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              vs semana anterior: {formatPct(vSem, 1)} gastos
            </div>
          )}

          <div className="mt-auto flex flex-1 items-end gap-1 pt-6">
            {data.ultimos_7_dias.map((d) => {
              const barPx = Math.max(
                6,
                Math.round((Number(d.total) / maxBar) * 72),
              );
              const label = format(parseISO(d.data), "EEE", { locale: ptBR });
              return (
                <div
                  key={d.data}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex h-24 w-full items-end justify-center rounded-lg bg-white/[0.06] px-0.5 pb-1 pt-2">
                    <div
                      className="w-full max-w-[14px] rounded-md bg-gradient-to-t from-sky-500/80 to-cyan-300/90 transition-all"
                      style={{ height: `${barPx}px` }}
                      title={`${d.data}: ${formatBRL(Number(d.total))}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium uppercase text-white/35">
                    {label.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparativo mes (selecionado vs anterior) */}
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl lg:col-span-3">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Mes vs mes anterior
            </p>
            <p className="mt-1 text-xs text-white/50">
              Baseado no mes que voce selecionou no topo
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
              <span className="text-white/55">Gastos</span>
              <span className="font-semibold tabular-nums text-white/90">
                {formatPct(vMesG, 1)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
              <span className="text-white/55">Saldo</span>
              <span className="font-semibold tabular-nums text-white/90">
                {formatPct(vMesS, 1)}
              </span>
            </div>
            <div className="space-y-1 border-t border-white/10 pt-3 text-xs text-white/45">
              <div className="flex justify-between gap-2">
                <span>Renda (mes)</span>
                <span className="tabular-nums text-white/70">
                  {formatBRL(data.mes.total_renda)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Gastos (mes)</span>
                <span className="tabular-nums text-white/70">
                  {formatBRL(data.mes.total_gastos)}
                </span>
              </div>
              <div className="flex justify-between gap-2 font-medium text-white/80">
                <span>Saldo</span>
                <span className="tabular-nums">{formatBRL(data.mes.saldo)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
