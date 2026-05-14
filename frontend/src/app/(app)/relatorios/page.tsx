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
import { StatCard } from "@/components/ui/stat-card";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Layers,
  ShoppingBag,
  ReceiptText,
  AlertTriangle,
  FileBarChart,
  Flame,
  CalendarClock,
  Repeat,
  CreditCard,
  Trophy,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MensalResumo {
  total_renda: number;
  total_gastos: number;
  saldo: number;
  taxa_poupanca: number | null;
  parcelas_pendentes: { count: number; total: number };
}

interface CategoriaData {
  nome: string;
  cor: string;
  icone?: string;
  quantidade: number;
  total: number;
}

interface FormaPgtoData {
  forma_pagamento: string;
  quantidade: number;
  total: number;
}

interface TopGasto {
  descricao: string;
  valor_total: number;
  data_gasto: string;
  categoria_nome: string;
  categoria_cor: string;
}

interface RelatorioMensalData {
  mes: string;
  resumo: MensalResumo;
  categorias: CategoriaData[];
  formas_pagamento: FormaPgtoData[];
  top_gastos: TopGasto[];
}

interface MesAnualData {
  mes: string;
  total_renda: number;
  total_gastos: number;
  saldo: number;
}

interface RelatorioAnualData {
  ano: number;
  resumo: {
    total_renda: number;
    total_gastos: number;
    saldo: number;
    taxa_poupanca: number | null;
  };
  meses: MesAnualData[];
  categorias: CategoriaData[];
  formas_pagamento: FormaPgtoData[];
}

interface MesProjecao {
  mes: string;
  renda_esperada: number;
  total_parcelas: number;
  quantidade_parcelas: number;
  total_assinaturas: number;
  total_gastos_projetados: number;
  saldo_projetado: number;
}

interface ProjecoesData {
  resumo: {
    renda_mensal_recorrente: number;
    assinaturas_mensais: number;
  };
  meses: MesProjecao[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getMesAtual() {
  return format(new Date(), "yyyy-MM");
}

function navegarMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return format(d, "yyyy-MM");
}

function mesLabel(mesStr: string) {
  try {
    return format(new Date(mesStr + "-02"), "MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return mesStr;
  }
}

function mesNomeCurto(mesStr: string) {
  try {
    return format(new Date(mesStr + "-02"), "MMMM", { locale: ptBR });
  } catch {
    return mesStr;
  }
}

function mesNomeMedium(mesStr: string) {
  try {
    return format(new Date(mesStr + "-02"), "MMM/yy", { locale: ptBR });
  } catch {
    return mesStr;
  }
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

function SectionLabel({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {title}
      </p>
      {description && (
        <p className="text-sm text-white/60">{description}</p>
      )}
    </div>
  );
}

// ─── Aba Mensal ───────────────────────────────────────────────────────────────

function MensalTab() {
  const [mes, setMes] = useState(getMesAtual());
  const [data, setData] = useState<RelatorioMensalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetch = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await api.get<RelatorioMensalData>(
        `/dashboard/relatorio-mensal?mes=${m}`,
      );
      setData(res.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(mes);
  }, [mes, fetch]);

  const totalGeral = data?.categorias.reduce(
    (s, c) => s + Number(c.total),
    0,
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Seletor de mês */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => setMes((m) => navegarMes(m, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-[200px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm backdrop-blur-sm">
          <span className="select-none font-medium capitalize text-white/80">
            {mesLabel(mes)}
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

      {loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar o relatório"
          description="Falha ao buscar os dados do mês selecionado."
          onAction={() => fetch(mes)}
        />
      ) : !loading && !data?.resumo.total_gastos && !data?.resumo.total_renda ? (
        <PageDataState
          mode="empty"
          icon={FileBarChart}
          title="Sem dados para este mês"
          description="Nenhum registro de renda ou gastos encontrado."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="space-y-3">
            <SectionLabel title="Indicadores do mês" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ui-stagger">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                : data && (
                    <>
                      <StatCard
                        label="Renda Total"
                        value={formatBRL(data.resumo.total_renda)}
                        description={`Entradas em ${mesNomeCurto(mes)}`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        tone="green"
                      />
                      <StatCard
                        label="Gastos Total"
                        value={formatBRL(data.resumo.total_gastos)}
                        description={
                          data.resumo.total_renda > 0
                            ? `${((data.resumo.total_gastos / data.resumo.total_renda) * 100).toFixed(0)}% da renda`
                            : "Sem renda cadastrada"
                        }
                        icon={<TrendingDown className="h-5 w-5" />}
                        tone="rose"
                      />
                      <StatCard
                        label="Saldo"
                        value={formatBRL(data.resumo.saldo)}
                        description={
                          data.resumo.saldo >= 0
                            ? "Balanço positivo"
                            : "Balanço negativo"
                        }
                        icon={<Wallet className="h-5 w-5" />}
                        tone={data.resumo.saldo >= 0 ? "blue" : "rose"}
                      />
                      <StatCard
                        label="Taxa de Poupança"
                        value={
                          data.resumo.taxa_poupanca !== null
                            ? `${data.resumo.taxa_poupanca.toFixed(1)}%`
                            : "—"
                        }
                        description={
                          data.resumo.taxa_poupanca === null
                            ? "Sem renda para calcular"
                            : data.resumo.taxa_poupanca >= 20
                              ? "Meta saudável"
                              : "Há espaço para melhorar"
                        }
                        icon={<Target className="h-5 w-5" />}
                        tone="violet"
                      />
                    </>
                  )}
            </div>
          </div>

          {/* O que mais impactou */}
          {!loading && data && (
            <div className="space-y-3">
              <SectionLabel
                title="O que mais impactou"
                description="Principais focos de gasto no mês"
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Top categorias */}
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-rose-500/10 p-1.5">
                        <Flame className="h-4 w-4 text-rose-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Top categorias
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-1">
                    {data.categorias.length === 0 ? (
                      <p className="text-sm text-white/40">
                        Nenhum gasto registrado.
                      </p>
                    ) : (
                      data.categorias.slice(0, 5).map((c, i) => {
                        const pct =
                          totalGeral > 0
                            ? (Number(c.total) / totalGeral) * 100
                            : 0;
                        return (
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="shrink-0 text-base leading-none"
                                  style={{ color: c.cor }}
                                >
                                  {c.icone ?? "📦"}
                                </span>
                                <span className="text-sm font-medium text-white/80 truncate">
                                  {c.nome}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-white/40">
                                  {pct.toFixed(0)}%
                                </span>
                                <span className="text-sm font-semibold tabular-nums text-white/80">
                                  {formatBRL(Number(c.total))}
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: c.cor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Top gastos individuais */}
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-500/10 p-1.5">
                        <ReceiptText className="h-4 w-4 text-amber-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Maiores gastos individuais
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-1">
                    {data.top_gastos.length === 0 ? (
                      <p className="text-sm text-white/40">
                        Nenhum gasto registrado.
                      </p>
                    ) : (
                      data.top_gastos.map((g, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-sm font-bold text-white/25 tabular-nums w-4 shrink-0">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white/80 truncate">
                                {g.descricao}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold"
                                  style={{
                                    backgroundColor: `${g.categoria_cor}22`,
                                    color: g.categoria_cor,
                                  }}
                                >
                                  {g.categoria_nome}
                                </span>
                                <span className="text-[10px] text-white/30">
                                  {format(
                                    new Date(g.data_gasto.slice(0, 10) + "T00:00:00"),
                                    "dd/MM",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums text-white/80 shrink-0">
                            {formatBRL(Number(g.valor_total))}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Distribuição */}
          {!loading && data && (
            <div className="space-y-3">
              <SectionLabel
                title="Distribuição"
                description="Como os gastos estão distribuídos"
              />
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 ui-stagger">
                <Card className="hover:shadow-md transition-shadow duration-200 xl:col-span-7">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-violet-500/10 p-1.5">
                        <Layers className="h-4 w-4 text-violet-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Por categoria
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <GastosCategoriaChart data={data.categorias} />
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200 xl:col-span-5">
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
                    <FormaPagamentoChart data={data.formas_pagamento} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Aba Anual ────────────────────────────────────────────────────────────────

function AnualTab() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [data, setData] = useState<RelatorioAnualData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetch = useCallback(async (a: number) => {
    setLoading(true);
    try {
      const res = await api.get<RelatorioAnualData>(
        `/dashboard/relatorio-anual?ano=${a}`,
      );
      setData(res.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(ano);
  }, [ano, fetch]);

  const melhorMes = data?.meses.length
    ? data.meses.reduce((best, m) => (m.saldo > best.saldo ? m : best))
    : null;
  const piorMes = data?.meses.length
    ? data.meses.reduce((worst, m) => (m.saldo < worst.saldo ? m : worst))
    : null;

  const hasData =
    data && (data.meses.length > 0 || data.categorias.length > 0);

  return (
    <div className="space-y-6">
      {/* Seletor de ano */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => setAno((a) => a - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-[100px] items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm backdrop-blur-sm">
          <span className="select-none font-bold tabular-nums text-white/80">
            {ano}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
          onClick={() => setAno((a) => a + 1)}
          disabled={ano >= new Date().getFullYear()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar o relatório"
          description="Falha ao buscar os dados do ano selecionado."
          onAction={() => fetch(ano)}
        />
      ) : !loading && !hasData ? (
        <PageDataState
          mode="empty"
          icon={FileBarChart}
          title="Sem dados para este ano"
          description="Não há registros de renda ou gastos para o ano selecionado."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="space-y-3">
            <SectionLabel title="Resumo anual" description={`Totais consolidados de ${ano}`} />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ui-stagger">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                : data && (
                    <>
                      <StatCard
                        label="Total de Renda"
                        value={formatBRL(data.resumo.total_renda)}
                        description={`Entradas registradas em ${ano}`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        tone="green"
                      />
                      <StatCard
                        label="Total de Gastos"
                        value={formatBRL(data.resumo.total_gastos)}
                        description={
                          data.resumo.total_renda > 0
                            ? `${((data.resumo.total_gastos / data.resumo.total_renda) * 100).toFixed(0)}% da renda total`
                            : "Sem renda cadastrada"
                        }
                        icon={<TrendingDown className="h-5 w-5" />}
                        tone="rose"
                      />
                      <StatCard
                        label="Saldo do Ano"
                        value={formatBRL(data.resumo.saldo)}
                        description={
                          data.resumo.saldo >= 0
                            ? "Balanço positivo"
                            : "Balanço negativo"
                        }
                        icon={<Wallet className="h-5 w-5" />}
                        tone={data.resumo.saldo >= 0 ? "blue" : "rose"}
                      />
                      <StatCard
                        label="Taxa de Poupança"
                        value={
                          data.resumo.taxa_poupanca !== null
                            ? `${data.resumo.taxa_poupanca.toFixed(1)}%`
                            : "—"
                        }
                        description={
                          data.resumo.taxa_poupanca === null
                            ? "Sem renda para calcular"
                            : data.resumo.taxa_poupanca >= 20
                              ? "Meta saudável atingida"
                              : "Há espaço para melhorar"
                        }
                        icon={<Target className="h-5 w-5" />}
                        tone="violet"
                      />
                    </>
                  )}
            </div>
          </div>

          {/* Insights rápidos */}
          {!loading && melhorMes && piorMes && (
            <div className="space-y-3">
              <SectionLabel title="Destaques do ano" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-400/20 bg-green-500/10">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-green-400">
                      <Trophy className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wide font-semibold">
                        Melhor mês
                      </p>
                    </div>
                    <p className="text-lg font-bold text-white capitalize">
                      {mesNomeMedium(melhorMes.mes)}
                    </p>
                    <p className="text-sm font-semibold text-green-400 tabular-nums">
                      {formatBRL(melhorMes.saldo)}
                    </p>
                    <p className="text-xs text-white/50">
                      Renda {formatBRL(melhorMes.total_renda)} · Gastos{" "}
                      {formatBRL(melhorMes.total_gastos)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-rose-400/20 bg-rose-500/10">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2 text-rose-400">
                      <TrendingDown className="h-4 w-4" />
                      <p className="text-xs uppercase tracking-wide font-semibold">
                        Mês mais difícil
                      </p>
                    </div>
                    <p className="text-lg font-bold text-white capitalize">
                      {mesNomeMedium(piorMes.mes)}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        piorMes.saldo >= 0
                          ? "text-green-400"
                          : "text-rose-400",
                      )}
                    >
                      {formatBRL(piorMes.saldo)}
                    </p>
                    <p className="text-xs text-white/50">
                      Renda {formatBRL(piorMes.total_renda)} · Gastos{" "}
                      {formatBRL(piorMes.total_gastos)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Gráfico de tendência */}
          <div className="space-y-3">
            <SectionLabel
              title="Tendência"
              description={`Renda × Gastos mês a mês em ${ano}`}
            />
            <Card className="hover:shadow-md transition-shadow duration-200 ring-1 ring-white/10">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-500/10 p-1.5">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    Renda × Gastos — {ano}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                {loading ? (
                  <Skeleton className="h-72 w-full rounded-lg" />
                ) : (
                  <RendaVsGastosChart data={data?.meses ?? []} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribuição anual */}
          {!loading && data && (
            <div className="space-y-3">
              <SectionLabel title="Distribuição anual" />
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 ui-stagger">
                <Card className="hover:shadow-md transition-shadow duration-200 xl:col-span-7">
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
                    <GastosCategoriaChart data={data.categorias} />
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200 xl:col-span-5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-sky-500/10 p-1.5">
                        <ShoppingBag className="h-4 w-4 text-sky-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Forma de pagamento
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <FormaPagamentoChart data={data.formas_pagamento} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tabela mensal */}
          {!loading && data && data.meses.length > 0 && (
            <div className="space-y-3">
              <SectionLabel title="Detalhamento mensal" />
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-orange-500/10 p-1.5">
                      <ReceiptText className="h-4 w-4 text-orange-500" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      Mês a mês — {ano}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-y border-white/10 bg-white/[0.04]">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                            Mês
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Renda
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Gastos
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Saldo
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Poupança
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.meses.map((m, i) => {
                          const poupanca =
                            m.total_renda > 0
                              ? (m.saldo / m.total_renda) * 100
                              : null;
                          return (
                            <tr
                              key={i}
                              className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                            >
                              <td className="px-5 py-3.5 font-medium capitalize text-white/80">
                                {mesNomeMedium(m.mes)}
                              </td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-medium text-blue-300">
                                {formatBRL(m.total_renda)}
                              </td>
                              <td className="px-5 py-3.5 text-right tabular-nums font-medium text-rose-300">
                                {formatBRL(m.total_gastos)}
                              </td>
                              <td
                                className={cn(
                                  "px-5 py-3.5 text-right tabular-nums font-semibold",
                                  m.saldo >= 0
                                    ? "text-green-400"
                                    : "text-rose-400",
                                )}
                              >
                                {formatBRL(m.saldo)}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {poupanca === null ? (
                                  <span className="text-white/30">—</span>
                                ) : (
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
                                      poupanca >= 20
                                        ? "bg-green-500/15 text-green-400"
                                        : poupanca >= 0
                                          ? "bg-amber-500/15 text-amber-400"
                                          : "bg-rose-500/15 text-rose-400",
                                    )}
                                  >
                                    {poupanca.toFixed(1)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t border-white/15 bg-white/[0.03]">
                        <tr>
                          <td className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-white/40">
                            Total
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums font-bold text-blue-300">
                            {formatBRL(data.resumo.total_renda)}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums font-bold text-rose-300">
                            {formatBRL(data.resumo.total_gastos)}
                          </td>
                          <td
                            className={cn(
                              "px-5 py-3.5 text-right tabular-nums font-bold",
                              data.resumo.saldo >= 0
                                ? "text-green-400"
                                : "text-rose-400",
                            )}
                          >
                            {formatBRL(data.resumo.saldo)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {data.resumo.taxa_poupanca !== null && (
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold",
                                  data.resumo.taxa_poupanca >= 20
                                    ? "bg-green-500/15 text-green-400"
                                    : data.resumo.taxa_poupanca >= 0
                                      ? "bg-amber-500/15 text-amber-400"
                                      : "bg-rose-500/15 text-rose-400",
                                )}
                              >
                                {data.resumo.taxa_poupanca.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Aba Projeções ────────────────────────────────────────────────────────────

function ProjecoesTab() {
  const [data, setData] = useState<ProjecoesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ProjecoesData>("/dashboard/projecoes?meses=6");
      setData(res.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const proximoMes = data?.meses[0];

  return (
    <div className="space-y-6">
      {/* Aviso contextual */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3">
        <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300/80 leading-relaxed">
          Os valores projetados consideram <strong>rendas recorrentes cadastradas</strong>,{" "}
          <strong>parcelas pendentes confirmadas</strong> e{" "}
          <strong>assinaturas ativas</strong>. Gastos imprevistos não são incluídos.
        </p>
      </div>

      {loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar as projeções"
          description="Falha ao buscar os dados de projeção."
          onAction={fetch}
        />
      ) : (
        <>
          {/* KPIs de referência */}
          <div className="space-y-3">
            <SectionLabel
              title="Base mensal"
              description="Valores fixos que compõem cada mês projetado"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ui-stagger">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              ) : data ? (
                <>
                  <StatCard
                    label="Renda Mensal Esperada"
                    value={formatBRL(data.resumo.renda_mensal_recorrente)}
                    description="Soma das rendas recorrentes ativas"
                    icon={<TrendingUp className="h-5 w-5" />}
                    tone="green"
                  />
                  <StatCard
                    label="Assinaturas Ativas"
                    value={formatBRL(data.resumo.assinaturas_mensais)}
                    description="Custo fixo mensal de assinaturas"
                    icon={<Repeat className="h-5 w-5" />}
                    tone="amber"
                  />
                  <StatCard
                    label="Parcelas — Próx. Mês"
                    value={
                      proximoMes
                        ? formatBRL(proximoMes.total_parcelas)
                        : "R$ 0,00"
                    }
                    description={
                      proximoMes
                        ? `${proximoMes.quantidade_parcelas} parcela(s) a vencer`
                        : "Nenhuma parcela pendente"
                    }
                    icon={<CreditCard className="h-5 w-5" />}
                    tone="rose"
                  />
                </>
              ) : null}
            </div>
          </div>

          {/* Projeção por mês */}
          {!loading && data && (
            <div className="space-y-3">
              <SectionLabel
                title="Próximos 6 meses"
                description="Estimativa de saldo mês a mês"
              />
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-violet-500/10 p-1.5">
                      <CalendarClock className="h-4 w-4 text-violet-500" />
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      Projeção financeira
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-y border-white/10 bg-white/[0.04]">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                            Mês
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Renda Esperada
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Parcelas
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Assinaturas
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Saldo Projetado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.meses.map((m, i) => (
                          <tr
                            key={i}
                            className={cn(
                              "border-b border-white/[0.06] transition-colors",
                              i === 0
                                ? "bg-white/[0.03]"
                                : "hover:bg-white/[0.04]",
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium capitalize text-white/80">
                                  {mesLabel(m.mes)}
                                </span>
                                {i === 0 && (
                                  <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded px-1.5 py-0.5">
                                    atual
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-medium text-blue-300">
                              {formatBRL(m.renda_esperada)}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex flex-col items-end">
                                <span className="tabular-nums font-medium text-rose-300">
                                  {formatBRL(m.total_parcelas)}
                                </span>
                                {m.quantidade_parcelas > 0 && (
                                  <span className="text-[10px] text-white/30">
                                    {m.quantidade_parcelas} parcela(s)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-medium text-amber-300">
                              {formatBRL(m.total_assinaturas)}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span
                                className={cn(
                                  "tabular-nums font-bold",
                                  m.saldo_projetado >= 0
                                    ? "text-green-400"
                                    : "text-rose-400",
                                )}
                              >
                                {formatBRL(m.saldo_projetado)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Mini cards de destaque */}
              {data.meses.length > 0 && (() => {
                const melhor = data.meses.reduce((b, m) =>
                  m.saldo_projetado > b.saldo_projetado ? m : b,
                );
                const pior = data.meses.reduce((b, m) =>
                  m.saldo_projetado < b.saldo_projetado ? m : b,
                );
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Card className="border-green-400/20 bg-green-500/10">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2 text-green-400">
                          <Trophy className="h-4 w-4" />
                          <p className="text-xs uppercase tracking-wide font-semibold">
                            Melhor mês projetado
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white capitalize">
                          {mesLabel(melhor.mes)}
                        </p>
                        <p className="text-sm font-semibold text-green-400 tabular-nums">
                          {formatBRL(melhor.saldo_projetado)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-rose-400/20 bg-rose-500/10">
                      <CardContent className="p-4 space-y-1">
                        <div className="flex items-center gap-2 text-rose-400">
                          <CalendarClock className="h-4 w-4" />
                          <p className="text-xs uppercase tracking-wide font-semibold">
                            Mês mais comprometido
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white capitalize">
                          {mesLabel(pior.mes)}
                        </p>
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            pior.saldo_projetado >= 0
                              ? "text-green-400"
                              : "text-rose-400",
                          )}
                        >
                          {formatBRL(pior.saldo_projetado)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  return (
    <PageShell contentClassName="space-y-6 pb-6">
      <SectionHeader
        title={"Relat\u00f3rios"}
        titleColor="text-amber-400"
        description={
          "An\u00e1lise mensal, vis\u00e3o anual e proje\u00e7\u00f5es futuras"
        }
      />
      <Tabs defaultValue="mensal" className="space-y-6">
        <TabsList className="bg-white/[0.06] border border-white/10 p-1 h-auto">
          <TabsTrigger
            value="mensal"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-4 py-1.5 text-sm font-medium transition-all"
          >
            Mensal
          </TabsTrigger>
          <TabsTrigger
            value="anual"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-4 py-1.5 text-sm font-medium transition-all"
          >
            Anual
          </TabsTrigger>
          <TabsTrigger
            value="projecoes"
            className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-4 py-1.5 text-sm font-medium transition-all"
          >
            Projeções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mensal" className="mt-0">
          <MensalTab />
        </TabsContent>

        <TabsContent value="anual" className="mt-0">
          <AnualTab />
        </TabsContent>

        <TabsContent value="projecoes" className="mt-0">
          <ProjecoesTab />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Valora &copy; {new Date().getFullYear()}
      </p>
    </PageShell>
  );
}
