"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
import { RendaVsGastosChart } from "@/components/dashboard/RendaVsGastosChart";
import { GastosCategoriaChart } from "@/components/dashboard/GastosCategoriaChart";
import { FormaPagamentoChart } from "@/components/dashboard/FormaPagamentoChart";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  BarChart3,
  Layers,
  ReceiptText,
  ShoppingBag,
  Utensils,
  Car,
  HeartPulse,
  BookOpen,
  Gamepad2,
  Home,
  Shirt,
  Laptop,
  Smartphone,
  PawPrint,
  Plane,
  Sparkles,
  ShoppingCart,
  Pill,
  Package,
  Tag,
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
import { StatCard } from "@/components/ui/stat-card";

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
  nome: string;
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

function getCategoryIcon(nome: string) {
  const icons: Record<string, React.ReactElement> = {
    Alimentação: <Utensils className="h-3.5 w-3.5" />,
    Transporte: <Car className="h-3.5 w-3.5" />,
    Saúde: <HeartPulse className="h-3.5 w-3.5" />,
    Educação: <BookOpen className="h-3.5 w-3.5" />,
    Lazer: <Gamepad2 className="h-3.5 w-3.5" />,
    Moradia: <Home className="h-3.5 w-3.5" />,
    Vestuário: <Shirt className="h-3.5 w-3.5" />,
    Tecnologia: <Laptop className="h-3.5 w-3.5" />,
    Assinaturas: <Smartphone className="h-3.5 w-3.5" />,
    Pets: <PawPrint className="h-3.5 w-3.5" />,
    Viagem: <Plane className="h-3.5 w-3.5" />,
    "Beleza & Estética": <Sparkles className="h-3.5 w-3.5" />,
    Mercado: <ShoppingCart className="h-3.5 w-3.5" />,
    Farmácia: <Pill className="h-3.5 w-3.5" />,
    "Outros Gastos": <Package className="h-3.5 w-3.5" />,
  };
  return icons[nome] ?? <Tag className="h-3.5 w-3.5" />;
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

function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [mes, setMes] = useState(getMesAtual());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rendaVsGastos, setRendaVsGastos] = useState<RendaVsGastos[]>([]);
  const [porCategoria, setPorCategoria] = useState<GastoCategoria[]>([]);
  const [porFormaPgto, setPorFormaPgto] = useState<GastoFormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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

  const mesDisplay = (() => {
    try {
      return format(new Date(mes + "-02"), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return mes;
    }
  })();

  const saldoPositivo = (summary?.saldo ?? 0) >= 0;
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
        description="Visão geral das suas finanças"
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => setMes((m) => navegarMes(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex min-w-[180px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm backdrop-blur-sm">
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
          </>
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
          {/* ── Summary Cards ─────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Indicadores principais
              </p>
              <p className="text-sm text-white/60">
                O que mais importa no mês selecionado
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ui-stagger">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              ) : summary ? (
                <>
                  <StatCard
                    className="md:col-span-2 xl:col-span-2 ring-1 ring-white/15"
                    description={
                      saldoPositivo
                        ? "Balanço positivo no mês"
                        : "Balanço negativo no mês"
                    }
                    icon={<Wallet className="h-5 w-5" />}
                    label="Saldo atual"
                    tone={saldoPositivo ? "blue" : "rose"}
                    value={formatBRL(summary.saldo)}
                    valueClassName="text-3xl"
                  />

                  <StatCard
                    description={`Entradas em ${format(new Date(mes + "-02"), "MMMM", { locale: ptBR })}`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    label="Renda total"
                    tone="blue"
                    value={formatBRL(summary.total_renda)}
                  />

                  <StatCard
                    description={
                      summary.total_renda > 0
                        ? `${((summary.total_gastos / summary.total_renda) * 100).toFixed(0)}% da renda`
                        : "Sem renda cadastrada"
                    }
                    icon={<TrendingDown className="h-5 w-5" />}
                    label="Gastos total"
                    tone="rose"
                    value={formatBRL(summary.total_gastos)}
                  />

                  <StatCard
                    description={`${summary.parcelas_pendentes.count} parcela(s) em aberto`}
                    icon={<Clock className="h-5 w-5" />}
                    label="Parcelas pendentes"
                    tone="amber"
                    value={formatBRL(summary.parcelas_pendentes.total)}
                  />
                </>
              ) : null}
            </div>
          </div>

          {!loading && summary && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                  Resumo estratégico
                </p>
                <p className="text-sm text-white/60">
                  Sinais rápidos para orientar suas decisões no mês
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ui-stagger">
                <Card className="border-blue-400/25 bg-blue-500/10 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Target className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wide font-semibold">
                        Taxa de poupança
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {taxaPoupanca === null
                        ? "—"
                        : `${taxaPoupanca.toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-white/55">
                      {taxaPoupanca === null
                        ? "Sem renda suficiente para calcular."
                        : taxaPoupanca >= 20
                          ? "Meta saudável para manter crescimento."
                          : "Há espaço para melhorar a margem mensal."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-rose-400/25 bg-rose-500/10 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-rose-300">
                      <Flame className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wide font-semibold">
                        Categoria dominante
                      </p>
                    </div>
                    <p className="text-base font-semibold text-white truncate">
                      {topCategoria?.nome ?? "Sem dados"}
                    </p>
                    <p className="text-sm font-bold text-rose-300 tabular-nums">
                      {topCategoria
                        ? formatBRL(Number(topCategoria.total))
                        : "—"}
                    </p>
                    <p className="text-xs text-white/55">
                      {topCategoria && totalGeral > 0
                        ? `${((Number(topCategoria.total) / totalGeral) * 100).toFixed(1)}% dos gastos do mês.`
                        : "Cadastre gastos para descobrir o principal centro de custo."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-violet-400/25 bg-violet-500/10 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-violet-300">
                      <BarChart2 className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wide font-semibold">
                        Variação da renda
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {variacaoRenda === null
                        ? "—"
                        : formatPercent(variacaoRenda)}
                    </p>
                    <p className="text-xs text-white/55">
                      {variacaoRenda === null
                        ? "Histórico insuficiente para comparar com mês anterior."
                        : variacaoRenda >= 0
                          ? "Tendência positiva em relação ao mês anterior."
                          : "Queda em relação ao mês anterior; revise entradas recorrentes."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-amber-400/25 bg-amber-500/10 backdrop-blur-xl">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Gauge className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wide font-semibold">
                        Gasto médio diário
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white tabular-nums">
                      {formatBRL(gastoMedioDiario)}
                    </p>
                    <p className="text-xs text-white/55">
                      Baseado em {diasConsiderados} dia(s) do período
                      selecionado.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ── Budget Bar ────────────────────────────────── */}
          {!loading &&
            summary &&
            summary.total_renda > 0 &&
            (() => {
              const gasto = summary.total_gastos;
              const renda = summary.total_renda;
              const pct = Math.min((gasto / renda) * 100, 100);
              const overspent = gasto > renda;
              const poupado = Math.max(renda - gasto, 0);
              const barColor = overspent
                ? "bg-rose-500"
                : pct > 85
                  ? "bg-amber-500"
                  : "bg-blue-500";
              const labelColor = overspent
                ? "text-rose-400"
                : pct > 85
                  ? "text-amber-400"
                  : "text-blue-400";
              return (
                <Card className="hover:shadow-md transition-shadow duration-200 ring-1 ring-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-violet-500/10 p-1.5">
                          <PiggyBank className="h-4 w-4 text-violet-500" />
                        </div>
                        <span className="text-sm font-semibold">
                          Orçamento do mês
                        </span>
                      </div>
                      <span className={cn("text-sm font-bold", labelColor)}>
                        {overspent
                          ? `Acima em ${formatBRL(gasto - renda)}`
                          : `${pct.toFixed(0)}% utilizado`}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          barColor,
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-muted-foreground mt-2.5">
                      <span>
                        Gastos:{" "}
                        <span className="font-semibold text-foreground">
                          {formatBRL(gasto)}
                        </span>
                      </span>
                      <span>
                        Renda:{" "}
                        <span className="font-semibold text-foreground">
                          {formatBRL(renda)}
                        </span>
                      </span>
                      {!overspent && (
                        <span>
                          Disponível:{" "}
                          <span className={cn("font-semibold", labelColor)}>
                            {formatBRL(poupado)}
                          </span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Evolução e distribuição
              </p>
              <p className="text-sm text-white/60">
                Tendência de 6 meses e composição dos gastos
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 ui-stagger">
              <Card className="hover:shadow-md transition-shadow duration-200 ring-1 ring-white/10 xl:col-span-7">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-500/10 p-1.5">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      Renda × Gastos — últimos 6 meses
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 pb-4">
                  {loading ? (
                    <Skeleton className="h-72 w-full rounded-lg" />
                  ) : (
                    <RendaVsGastosChart data={rendaVsGastos} />
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 xl:col-span-5 ui-stagger">
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-violet-500/10 p-1.5">
                        <Layers className="h-4 w-4 text-violet-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Gastos por categoria
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {loading ? (
                      <Skeleton className="h-64 w-full rounded-lg" />
                    ) : (
                      <GastosCategoriaChart data={porCategoria} />
                    )}
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-sky-500/10 p-1.5">
                        <ShoppingBag className="h-4 w-4 text-sky-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Por forma de pagamento
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
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

          {/* ── Category Table ────────────────────────────── */}
          {!loading && porCategoria.length > 0 && (
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-orange-500/10 p-1.5">
                    <ReceiptText className="h-4 w-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    Detalhamento por categoria
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-y border-white/10 bg-white/[0.04]">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                          Categoria
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                          Qtd
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                          Total
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                          % gasto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="ui-stagger-rows">
                      {porCategoria.map((c, i) => {
                        const pct =
                          totalGeral > 0
                            ? (Number(c.total) / totalGeral) * 100
                            : 0;
                        return (
                          <tr
                            key={i}
                            className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
                                  style={{
                                    backgroundColor: `${c.cor || "#94a3b8"}22`,
                                    color: c.cor || "#94a3b8",
                                  }}
                                >
                                  {getCategoryIcon(c.nome)}
                                </span>
                                <div>
                                  <span className="font-medium text-white/80">
                                    {c.nome}
                                  </span>
                                  <div className="mt-1.5 h-1 w-full min-w-[80px] max-w-[120px] rounded-full bg-white/10 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: c.cor || "#94a3b8",
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right text-white/50">
                              {c.quantidade}
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-white/80">
                              {formatBRL(Number(c.total))}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span
                                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border"
                                style={{
                                  backgroundColor: `${c.cor || "#94a3b8"}18`,
                                  color: c.cor || "#94a3b8",
                                  borderColor: `${c.cor || "#94a3b8"}40`,
                                }}
                              >
                                {pct.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2">
            FinançasPro &copy; {new Date().getFullYear()}
          </p>
        </>
      )}
    </PageShell>
  );
}
