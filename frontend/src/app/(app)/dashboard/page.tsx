"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
import { RendaVsGastosChart } from "@/components/dashboard/RendaVsGastosChart";
import { GastosCategoriaChart } from "@/components/dashboard/GastosCategoriaChart";
import { FormaPagamentoChart } from "@/components/dashboard/FormaPagamentoChart";
import {
  DashboardHeroInsights,
  type DashboardInsightsPayload,
} from "@/components/dashboard/DashboardHeroInsights";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  BarChart3,
  Layers,
  ShoppingBag,
  Activity,
  AlertTriangle,
  Target,
  Flame,
  BarChart2,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

interface Summary {
  total_renda: number;
  total_gastos: number;
  saldo: number;
  parcelas_pendentes: { count: number; total: number };
}

interface RendaVsGastos {
  mes: string;
  total_renda: number;
  total_gastos: number;
}

interface GastoCategoria {
  categoria_id?: number;
  nome?: string;
  /** Resposta de `/dashboard/gastos-por-categoria` costuma usar este campo. */
  categoria?: string;
  cor: string;
  icone?: string;
  quantidade: number;
  total: number;
}

interface GastoFormaPagamento {
  forma_pagamento: string;
  quantidade: number;
  total: number;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function labelCategoria(c: Pick<GastoCategoria, "nome" | "categoria">) {
  const n = c.nome?.trim();
  if (n) return n;
  const alt = c.categoria?.trim();
  if (alt) return alt;
  return "Sem categoria";
}

function formatMesSerie(mes: string) {
  try {
    return format(parseISO(`${mes}-01`), "MMMM yyyy", { locale: ptBR });
  } catch {
    return mes;
  }
}

function getMesAtual() {
  return format(new Date(), "yyyy-MM");
}

function navegarMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return format(d, "yyyy-MM");
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default function DashboardPage() {
  const [mes, setMes] = useState(getMesAtual());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rendaVsGastos, setRendaVsGastos] = useState<RendaVsGastos[]>([]);
  const [porCategoria, setPorCategoria] = useState<GastoCategoria[]>([]);
  const [porFormaPgto, setPorFormaPgto] = useState<GastoFormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [insights, setInsights] = useState<DashboardInsightsPayload | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const fetchInsights = useCallback(async (mesSelecionado: string) => {
    setInsightsLoading(true);
    try {
      const { data } = await api.get<DashboardInsightsPayload>(
        `/dashboard/insights?mes=${mesSelecionado}`,
      );
      setInsights(data);
    } catch {
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async (mesSelecionado: string) => {
    setLoading(true);
    try {
      const [sumRes, rvgRes, catRes, fmRes] = await Promise.all([
        api.get<Summary>(`/dashboard/summary?mes=${mesSelecionado}`),
        api.get<RendaVsGastos[]>("/dashboard/renda-vs-gastos?meses=6"),
        api.get<GastoCategoria[]>(
          `/dashboard/gastos-por-categoria?mes=${mesSelecionado}`,
        ),
        api.get<GastoFormaPagamento[]>(
          `/dashboard/gastos-por-forma-pagamento?mes=${mesSelecionado}`,
        ),
      ]);
      setSummary(sumRes.data);
      setRendaVsGastos(rvgRes.data);
      setPorCategoria(catRes.data);
      setPorFormaPgto(fmRes.data);
      setLoadError(false);
    } catch {
      // 401 é redirecionado pelo interceptor do axios
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(mes);
  }, [mes, fetchAll]);

  useEffect(() => {
    void fetchInsights(mes);
  }, [mes, fetchInsights]);

  const mesDisplay = (() => {
    try {
      return format(new Date(mes + "-02"), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return mes;
    }
  })();

  const totalGeral = porCategoria.reduce((s, x) => s + Number(x.total), 0);
  const topCategoria = [...porCategoria].sort(
    (a, b) => Number(b.total) - Number(a.total),
  )[0];

  const serieAtual = rendaVsGastos[rendaVsGastos.length - 1];
  const serieAnterior = rendaVsGastos[rendaVsGastos.length - 2];

  const variacaoRenda =
    serieAtual && serieAnterior && serieAnterior.total_renda > 0
      ? ((serieAtual.total_renda - serieAnterior.total_renda) /
          serieAnterior.total_renda) *
        100
      : null;

  const taxaPoupanca =
    summary && summary.total_renda > 0
      ? (summary.saldo / summary.total_renda) * 100
      : null;

  const [anoMes, mesNumero] = mes.split("-").map(Number);
  const hoje = new Date();
  const isMesAtual =
    hoje.getFullYear() === anoMes && hoje.getMonth() + 1 === mesNumero;
  const diasNoMes = new Date(anoMes, mesNumero, 0).getDate();
  const diasConsiderados = isMesAtual ? hoje.getDate() : diasNoMes;
  const gastoMedioDiario = summary
    ? summary.total_gastos / Math.max(diasConsiderados, 1)
    : 0;

  return (
    <PageShell contentClassName="space-y-6 pb-6">
      {/* ── Header ────────────────────────────────────── */}
      <SectionHeader
        title={mesDisplay}
        titleClassName="capitalize"
        description="Painel vivo com semana atual, comparativos e selos de progresso"
        actions={
          <div className="flex w-full items-center gap-1.5 sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => setMes((m) => navegarMes(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm backdrop-blur-sm sm:min-w-[180px]">
              <CalendarDays className="h-4 w-4 shrink-0 text-white/40" />
              <span className="select-none font-medium capitalize text-white/80">
                {mesDisplay}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => setMes((m) => navegarMes(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar o dashboard"
          description="Falha ao buscar os indicadores financeiros deste mês."
          onAction={() => fetchAll(mes)}
        />
      ) : !loading &&
        !summary &&
        rendaVsGastos.length === 0 &&
        porCategoria.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={Wallet}
          title="Sem dados para exibir"
          description="Cadastre rendas e gastos para visualizar os indicadores do dashboard."
        />
      ) : (
        <>
          <DashboardHeroInsights
            data={insights}
            loading={insightsLoading}
          />

          {!loading && summary && (
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md sm:p-6">
              <div className="flex flex-col gap-1 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Resumo estrategico
                  </p>
                  <p className="mt-1 font-display text-xl uppercase tracking-wide text-white/90 sm:text-2xl">
                    Sinais do mes
                  </p>
                  <p className="mt-1 max-w-xl text-sm text-white/50">
                    Leitura rapida do comportamento financeiro no periodo selecionado
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4 ui-stagger">
                {/* Taxa de poupança */}
                <Card className="group relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/[0.14] via-white/[0.02] to-blue-600/[0.08] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/30 hover:shadow-[0_20px_50px_-24px_rgba(56,189,248,0.35)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
                  <CardContent className="relative flex min-h-[168px] flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-200/75">
                          Taxa de poupança
                        </p>
                        <p className="font-display text-4xl leading-none tracking-tight text-white tabular-nums sm:text-[2.75rem]">
                          {taxaPoupanca === null ? (
                            <span className="text-white/35">—</span>
                          ) : (
                            <>
                              {taxaPoupanca.toFixed(1)}
                              <span className="ml-0.5 text-2xl font-normal text-sky-200/90 sm:text-3xl">
                                %
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 ring-1 ring-sky-300/25 transition-transform duration-300 group-hover:scale-105">
                        <Target className="h-6 w-6 text-sky-200" />
                      </div>
                    </div>
                    {taxaPoupanca !== null && (
                      <div className="mt-4 space-y-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                              taxaPoupanca >= 20
                                ? "from-emerald-400 to-cyan-300"
                                : taxaPoupanca >= 10
                                  ? "from-amber-400 to-orange-300"
                                  : "from-rose-400 to-orange-400",
                            )}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  4,
                                  taxaPoupanca <= 0 ? 4 : taxaPoupanca,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] leading-relaxed text-white/50">
                          {taxaPoupanca >= 20
                            ? "Margem confortavel — bom espaco para investir ou poupar."
                            : "Ha espaco para melhorar a margem entre renda e gastos."}
                        </p>
                      </div>
                    )}
                    {taxaPoupanca === null && (
                      <p className="mt-auto pt-4 text-[11px] leading-relaxed text-white/45">
                        Sem renda suficiente no mes para calcular a taxa.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Categoria dominante */}
                <Card className="group relative overflow-hidden rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/[0.12] via-white/[0.02] to-fuchsia-600/[0.07] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-300/30 hover:shadow-[0_20px_50px_-24px_rgba(244,63,94,0.28)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/55 to-transparent" />
                  <CardContent className="relative flex min-h-[168px] flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-200/75">
                          Categoria dominante
                        </p>
                        <div className="mt-3 flex items-center gap-2.5">
                          {topCategoria ? (
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ring-1 ring-white/15"
                              style={{
                                backgroundColor: `${topCategoria.cor || "#fb7185"}22`,
                                color: topCategoria.cor || "#fda4af",
                              }}
                            >
                              {topCategoria.icone ?? "📦"}
                            </span>
                          ) : null}
                          <p className="truncate font-medium text-lg leading-tight text-white sm:text-xl">
                            {topCategoria
                              ? labelCategoria(topCategoria)
                              : "Sem dados"}
                          </p>
                        </div>
                        <p className="mt-3 font-display text-2xl tabular-nums text-rose-100 sm:text-3xl">
                          {topCategoria
                            ? formatBRL(Number(topCategoria.total))
                            : "—"}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 ring-1 ring-rose-300/25 transition-transform duration-300 group-hover:scale-105">
                        <Flame className="h-6 w-6 text-rose-200" />
                      </div>
                    </div>
                    <p className="mt-auto pt-4 text-[11px] leading-relaxed text-white/50">
                      {topCategoria && totalGeral > 0
                        ? `${((Number(topCategoria.total) / totalGeral) * 100).toFixed(1)}% do volume de gastos do mes nesta categoria.`
                        : "Cadastre gastos para ver onde o dinheiro mais se concentra."}
                    </p>
                  </CardContent>
                </Card>

                {/* Variação da renda */}
                <Card className="group relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.13] via-white/[0.02] to-indigo-600/[0.08] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/30 hover:shadow-[0_20px_50px_-24px_rgba(167,139,250,0.3)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/55 to-transparent" />
                  <CardContent className="relative flex min-h-[168px] flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-200/75">
                          Variação da renda
                        </p>
                        <p className="font-display text-4xl leading-none tracking-tight text-white tabular-nums sm:text-[2.75rem]">
                          {variacaoRenda === null ? (
                            <span className="text-white/35">—</span>
                          ) : (
                            formatPercent(variacaoRenda)
                          )}
                        </p>
                        {variacaoRenda !== null && (
                          <span
                            className={cn(
                              "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                              variacaoRenda >= 0
                                ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-200"
                                : "border-rose-400/35 bg-rose-500/12 text-rose-200",
                            )}
                          >
                            {variacaoRenda >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            vs mes anterior (serie 6 meses)
                          </span>
                        )}
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-300/25 transition-transform duration-300 group-hover:scale-105">
                        <BarChart2 className="h-6 w-6 text-violet-200" />
                      </div>
                    </div>
                    <p className="mt-auto pt-4 text-[11px] leading-relaxed text-white/50">
                      {variacaoRenda === null
                        ? "Historico curto demais para comparar com o mes anterior na serie."
                        : variacaoRenda >= 0
                          ? "Entradas em alta frente ao mes anterior — otimo momento para revisar metas."
                          : "Queda nas entradas vs mes anterior; vale checar recorrencias e fontes."}
                    </p>
                  </CardContent>
                </Card>

                {/* Gasto médio diário */}
                <Card className="group relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.11] via-white/[0.02] to-orange-600/[0.07] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/30 hover:shadow-[0_20px_50px_-24px_rgba(251,191,36,0.22)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
                  <CardContent className="relative flex min-h-[168px] flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/75">
                          Gasto medio diario
                        </p>
                        <p className="font-display text-4xl leading-none tracking-tight text-white tabular-nums sm:text-[2.65rem]">
                          {formatBRL(gastoMedioDiario)}
                        </p>
                        <p className="pt-1 text-[11px] text-amber-100/55">
                          Media sobre {diasConsiderados}{" "}
                          {diasConsiderados === 1 ? "dia" : "dias"} do mes
                          {isMesAtual ? " (ate hoje)" : ""}.
                        </p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-300/25 transition-transform duration-300 group-hover:scale-105">
                        <Gauge className="h-6 w-6 text-amber-200" />
                      </div>
                    </div>
                    <div className="mt-auto flex items-center gap-2 border-t border-white/[0.08] pt-4 text-[11px] text-white/45">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-amber-200/50" />
                      <span>
                        Ajuda a comparar meses curtos com meses cheios de forma justa.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {summary.total_renda > 0 ? (
                (() => {
                  const gasto = summary.total_gastos;
                  const renda = summary.total_renda;
                  const pct = Math.min((gasto / renda) * 100, 100);
                  const overspent = gasto > renda;
                  const poupado = Math.max(renda - gasto, 0);
                  const barGradient = overspent
                    ? "from-rose-500 via-orange-500 to-rose-400"
                    : pct > 85
                      ? "from-amber-400 via-orange-400 to-amber-500"
                      : "from-sky-500 via-cyan-400 to-blue-500";
                  const badgeClass = overspent
                    ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                    : pct > 85
                      ? "border-amber-400/40 bg-amber-500/12 text-amber-100"
                      : "border-emerald-400/35 bg-emerald-500/12 text-emerald-100";
                  const labelSoft = overspent
                    ? "text-rose-200/90"
                    : pct > 85
                      ? "text-amber-200/90"
                      : "text-cyan-200/90";

                  return (
                    <div className="group relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.1] via-white/[0.04] to-emerald-500/[0.09] p-5 shadow-none backdrop-blur-xl transition-all duration-300 hover:border-white/15 sm:p-6">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/45 to-transparent" />
                      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl transition-opacity group-hover:opacity-80" />
                      <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

                      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 ring-1 ring-white/15">
                            <PiggyBank className="h-7 w-7 text-violet-100" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                              Orcamento do mes
                            </p>
                            <p className="font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
                              Renda x gastos
                            </p>
                            <p className="max-w-md text-[12px] leading-relaxed text-white/50">
                              Quanto da sua renda ja foi utilizada neste periodo — ideal
                              manter folga para imprevistos.
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "flex shrink-0 flex-col items-start gap-1 rounded-2xl border px-4 py-3 sm:items-end sm:text-right",
                            badgeClass,
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
                            Status
                          </span>
                          <span className="font-display text-2xl tabular-nums leading-none tracking-tight">
                            {overspent
                              ? formatBRL(gasto - renda)
                              : `${pct.toFixed(0)}%`}
                          </span>
                          <span className="text-[11px] font-medium text-white/60">
                            {overspent
                              ? "acima da renda do mes"
                              : "da renda utilizada"}
                          </span>
                        </div>
                      </div>

                      <div className="relative mt-6">
                        <div className="h-4 w-full overflow-hidden rounded-full bg-black/25 ring-1 ring-inset ring-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r shadow-[0_0_24px_-4px_rgba(56,189,248,0.55)] transition-all duration-700",
                              barGradient,
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wider text-white/35">
                          <span>0%</span>
                          <span>100% da renda</span>
                        </div>
                      </div>

                      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                            Gastos
                          </p>
                          <p className="mt-1 font-display text-xl tabular-nums text-white">
                            {formatBRL(gasto)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                            Renda
                          </p>
                          <p className="mt-1 font-display text-xl tabular-nums text-white">
                            {formatBRL(renda)}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "rounded-xl border px-4 py-3 backdrop-blur-sm",
                            overspent
                              ? "border-rose-400/25 bg-rose-500/[0.08]"
                              : "border-emerald-400/20 bg-emerald-500/[0.07]",
                          )}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                            {overspent ? "Deficit" : "Disponivel"}
                          </p>
                          <p
                            className={cn(
                              "mt-1 font-display text-xl tabular-nums",
                              overspent ? "text-rose-100" : labelSoft,
                            )}
                          >
                            {overspent
                              ? formatBRL(gasto - renda)
                              : formatBRL(poupado)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-center text-sm text-white/45 backdrop-blur-sm">
                  Cadastre renda neste mes para ver a barra de orcamento (uso da
                  renda vs gastos).
                </div>
              )}
            </div>
          )}

          <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-md sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
            <div className="relative flex flex-col gap-1 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                  Evolucao e distribuicao
                </p>
                <p className="mt-1 font-display text-xl uppercase tracking-wide text-white/90 sm:text-2xl">
                  Tendencia e composicao
                </p>
                <p className="mt-1 max-w-xl text-sm text-white/50">
                  Serie de 6 meses e onde os gastos se concentram no mes selecionado
                </p>
              </div>
            </div>

            <div className="relative mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12 ui-stagger">
              <div className="flex flex-col gap-4 xl:col-span-7">
                <Card className="group/chart relative overflow-hidden rounded-2xl border border-blue-400/18 bg-gradient-to-br from-blue-500/[0.11] via-white/[0.02] to-cyan-600/[0.07] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300/28 hover:shadow-[0_20px_50px_-28px_rgba(56,189,248,0.28)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-300/25">
                        <BarChart3 className="h-4 w-4 text-sky-200" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">
                        Renda × Gastos — últimos 6 meses
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative pt-0 pb-4">
                    {loading ? (
                      <Skeleton className="h-[248px] w-full rounded-lg" />
                    ) : (
                      <RendaVsGastosChart data={rendaVsGastos} height={248} />
                    )}
                  </CardContent>
                </Card>

                <Card className="group/chart relative overflow-hidden rounded-2xl border border-emerald-400/18 bg-gradient-to-br from-emerald-500/[0.1] via-white/[0.02] to-teal-600/[0.07] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/28 hover:shadow-[0_20px_50px_-28px_rgba(16,185,129,0.22)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/45 to-transparent" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-300/25">
                        <Activity className="h-4 w-4 text-emerald-200" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">
                        Ultimo mes na serie
                      </CardTitle>
                    </div>
                    <p className="pt-1 text-xs text-white/45">
                      Valores do ponto mais recente da curva (nao confundir com o
                      mes do filtro acima).
                    </p>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    {loading ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                        <Skeleton className="h-20 rounded-xl" />
                      </div>
                    ) : serieAtual ? (
                      <>
                        <p className="mb-3 text-xs font-medium capitalize text-white/55">
                          {formatMesSerie(serieAtual.mes)}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                              Renda
                            </p>
                            <p className="mt-1 font-display text-lg tabular-nums text-white">
                              {formatBRL(serieAtual.total_renda)}
                            </p>
                            {serieAnterior &&
                              serieAnterior.total_renda > 0 && (
                                <p
                                  className={cn(
                                    "mt-1 text-[11px] font-medium",
                                    serieAtual.total_renda >=
                                      serieAnterior.total_renda
                                      ? "text-emerald-300/90"
                                      : "text-rose-300/90",
                                  )}
                                >
                                  {formatPercent(
                                    ((serieAtual.total_renda -
                                      serieAnterior.total_renda) /
                                      serieAnterior.total_renda) *
                                      100,
                                  )}{" "}
                                  vs anterior
                                </p>
                              )}
                          </div>
                          <div className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                              Gastos
                            </p>
                            <p className="mt-1 font-display text-lg tabular-nums text-white">
                              {formatBRL(serieAtual.total_gastos)}
                            </p>
                            {serieAnterior &&
                              serieAnterior.total_gastos > 0 && (
                                <p
                                  className={cn(
                                    "mt-1 text-[11px] font-medium",
                                    serieAtual.total_gastos <=
                                      serieAnterior.total_gastos
                                      ? "text-emerald-300/90"
                                      : "text-rose-300/90",
                                  )}
                                >
                                  {formatPercent(
                                    ((serieAtual.total_gastos -
                                      serieAnterior.total_gastos) /
                                      serieAnterior.total_gastos) *
                                      100,
                                  )}{" "}
                                  vs anterior
                                </p>
                              )}
                          </div>
                          <div
                            className={cn(
                              "rounded-xl border px-4 py-3 backdrop-blur-sm",
                              serieAtual.total_gastos >
                                serieAtual.total_renda
                                ? "border-rose-400/25 bg-rose-500/[0.08]"
                                : "border-emerald-400/20 bg-emerald-500/[0.07]",
                            )}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                              Saldo (serie)
                            </p>
                            <p
                              className={cn(
                                "mt-1 font-display text-lg tabular-nums",
                                serieAtual.total_gastos >
                                  serieAtual.total_renda
                                  ? "text-rose-100"
                                  : "text-emerald-100",
                              )}
                            >
                              {formatBRL(
                                serieAtual.total_renda -
                                  serieAtual.total_gastos,
                              )}
                            </p>
                            <p className="mt-1 text-[11px] text-white/45">
                              Renda menos gastos neste mes da serie
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="py-6 text-center text-sm text-white/45">
                        Sem pontos na serie para exibir.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:col-span-5 ui-stagger">
                <Card className="group/chart relative overflow-hidden rounded-2xl border border-violet-400/18 bg-gradient-to-br from-violet-500/[0.11] via-white/[0.02] to-fuchsia-600/[0.07] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300/28 hover:shadow-[0_20px_50px_-28px_rgba(167,139,250,0.25)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/45 to-transparent" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-300/25">
                        <Layers className="h-4 w-4 text-violet-200" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">
                        Gastos por categoria
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    {loading ? (
                      <Skeleton className="h-64 w-full rounded-lg" />
                    ) : (
                      <GastosCategoriaChart data={porCategoria} />
                    )}
                  </CardContent>
                </Card>

                <Card className="group/chart relative overflow-hidden rounded-2xl border border-sky-400/18 bg-gradient-to-br from-sky-500/[0.1] via-white/[0.02] to-blue-600/[0.07] shadow-none backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/28 hover:shadow-[0_20px_50px_-28px_rgba(56,189,248,0.22)]">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/45 to-transparent" />
                  <CardHeader className="relative pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-300/25">
                        <ShoppingBag className="h-4 w-4 text-sky-200" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-white/90">
                        Por forma de pagamento
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    {loading ? (
                      <Skeleton className="h-64 w-full rounded-lg" />
                    ) : (
                      <FormaPagamentoChart data={porFormaPgto} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Valora &copy; {new Date().getFullYear()}
          </p>
        </>
      )}
    </PageShell>
  );
}
