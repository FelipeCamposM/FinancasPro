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
import { EvolucaoDiariaChart } from "@/components/dashboard/EvolucaoDiariaChart";
import type { EvolucaoDiariaPoint } from "@/components/dashboard/EvolucaoDiariaChart";
import { StatCard } from "@/components/ui/stat-card";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CalendarClock,
  Repeat,
  CreditCard,
  Trophy,
  Info,
  Activity,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MensalResumo {
  total_renda: number;
  total_gastos: number;
  saldo: number;
  percentual_comprometido: number | null;
  media_diaria: number;
  projecao_mensal: number;
  quantidade_transacoes: number;
  ticket_medio: number;
  maior_gasto: TopGasto | null;
  maior_categoria: { nome: string; valor: number; percentual: number } | null;
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
  evolucao_diaria: EvolucaoDiariaPoint[];
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

interface CategoriaOption {
  id: number;
  nome: string;
  cor: string;
  icone: string;
}

interface CartaoOption {
  id: string;
  apelido: string;
  bandeira: string;
  cor: string;
  ultimos_4_digitos: string;
}

interface GastoDetalhe {
  id: string;
  descricao: string;
  valor_total: number;
  data_gasto: string;
  forma_pagamento: string;
  tipo_pagamento: string;
  categoria_nome: string | null;
  categoria_cor: string | null;
  categoria_icone: string | null;
  cartao_apelido: string | null;
  status: string;
}

interface RendaDetalhe {
  id: string;
  descricao: string;
  valor: number;
  data_recebimento: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Crédito",
  cartao_debito: "Débito",
  pix: "Pix",
  transferencia: "Transferência",
  outro: "Outro",
};

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

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseDateInput(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDaysInput(value: string, days: number) {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

function getInicioSemana(value: string) {
  const date = parseDateInput(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateInput(date);
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
  const [categoriaId, setCategoriaId] = useState<string>("__all__");
  const [cartaoId, setCartaoId] = useState<string>("__all__");
  const [formaPagamento, setFormaPagamento] = useState<string>("__all__");

  const [data, setData] = useState<RelatorioMensalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [gastos, setGastos] = useState<GastoDetalhe[]>([]);
  const [gastosTotal, setGastosTotal] = useState(0);
  const [gastosLoading, setGastosLoading] = useState(false);

  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [cartoes, setCartoes] = useState<CartaoOption[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<{ data: CategoriaOption[] }>("/categorias?tipo=gasto"),
      api.get<{ data: CartaoOption[] }>("/cartoes"),
    ])
      .then(([catRes, ctRes]) => {
        setCategorias(catRes.data.data ?? []);
        setCartoes(ctRes.data.data ?? []);
      })
      .catch(() => {});
  }, []);

  const fetchRelatorio = useCallback(
    async (m: string, catId: string, ctId: string, fp: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ mes: m });
        if (catId !== "__all__") params.set("categoria_id", catId);
        if (ctId !== "__all__") params.set("cartao_id", ctId);
        if (fp !== "__all__") params.set("forma_pagamento", fp);
        const res = await api.get<RelatorioMensalData>(
          `/relatorios/mensal?${params}`,
        );
        setData(res.data);
        setLoadError(false);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchGastos = useCallback(
    async (m: string, catId: string, ctId: string, fp: string) => {
      setGastosLoading(true);
      try {
        const [y, mo] = m.split("-").map(Number);
        const dataInicio = `${m}-01`;
        const lastDay = new Date(y, mo, 0).getDate();
        const dataFim = `${m}-${String(lastDay).padStart(2, "0")}`;
        const params = new URLSearchParams({
          data_inicio: dataInicio,
          data_fim: dataFim,
          limit: "50",
          page: "1",
        });
        if (catId !== "__all__") params.set("categoria_id", catId);
        if (ctId !== "__all__") params.set("cartao_id", ctId);
        if (fp !== "__all__") params.set("forma_pagamento", fp);
        const res = await api.get<{
          data: GastoDetalhe[];
          pagination: { total: number };
        }>(`/gastos?${params}`);
        setGastos(res.data.data ?? []);
        setGastosTotal(res.data.pagination?.total ?? 0);
      } catch {
        setGastos([]);
      } finally {
        setGastosLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchRelatorio(mes, categoriaId, cartaoId, formaPagamento);
    fetchGastos(mes, categoriaId, cartaoId, formaPagamento);
  }, [mes, categoriaId, cartaoId, formaPagamento, fetchRelatorio, fetchGastos]);

  const totalGeral = data?.resumo.total_gastos ?? 0;
  const hasData =
    !loading && (data?.resumo.total_gastos || data?.resumo.total_renda);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full items-center gap-1.5 sm:w-auto sm:shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => setMes((m) => navegarMes(m, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm backdrop-blur-sm sm:min-w-[170px] sm:flex-none">
            <span className="truncate select-none font-medium capitalize text-white/80">
              {mesLabel(mes)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => setMes((m) => navegarMes(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger className="h-9 w-full rounded-lg border-white/15 bg-white/[0.06] text-white/70 text-sm sm:w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.icone} {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {cartoes.length > 0 && (
          <Select value={cartaoId} onValueChange={setCartaoId}>
            <SelectTrigger className="h-9 w-full rounded-lg border-white/15 bg-white/[0.06] text-white/70 text-sm sm:w-[150px]">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os cartões</SelectItem>
              {cartoes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.apelido}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={formaPagamento} onValueChange={setFormaPagamento}>
          <SelectTrigger className="h-9 w-full rounded-lg border-white/15 bg-white/[0.06] text-white/70 text-sm sm:w-[175px]">
            <SelectValue placeholder="Forma de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as formas</SelectItem>
            {Object.entries(FORMA_PAGAMENTO_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar o relatório"
          description="Falha ao buscar os dados do mês selecionado."
          onAction={() =>
            fetchRelatorio(mes, categoriaId, cartaoId, formaPagamento)
          }
        />
      ) : !loading && !hasData ? (
        <PageDataState
          mode="empty"
          icon={FileBarChart}
          title="Sem dados para este mês"
          description="Nenhum registro de renda ou gastos encontrado."
        />
      ) : (
        <>
          {/* KPIs principais */}
          <div className="space-y-3">
            <SectionLabel title="Resumo do mês" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 ui-stagger">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                : data && (
                    <>
                      <StatCard
                        label="Total Gasto"
                        value={formatBRL(data.resumo.total_gastos)}
                        description={
                          data.resumo.percentual_comprometido !== null
                            ? `${data.resumo.percentual_comprometido.toFixed(0)}% da renda`
                            : "Sem renda cadastrada"
                        }
                        icon={<TrendingDown className="h-5 w-5" />}
                        tone="rose"
                      />
                      <StatCard
                        label="Renda Total"
                        value={formatBRL(data.resumo.total_renda)}
                        description={`Entradas em ${mesNomeCurto(mes)}`}
                        icon={<TrendingUp className="h-5 w-5" />}
                        tone="green"
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
                        label="Média Diária"
                        value={formatBRL(data.resumo.media_diaria)}
                        description="Gasto médio por dia"
                        icon={<Activity className="h-5 w-5" />}
                        tone="amber"
                      />
                      <StatCard
                        label="Projeção do Mês"
                        value={formatBRL(data.resumo.projecao_mensal)}
                        description="Se mantiver o ritmo atual"
                        icon={<Target className="h-5 w-5" />}
                        tone="violet"
                      />
                      <StatCard
                        label="Transações"
                        value={String(data.resumo.quantidade_transacoes)}
                        description={`Ticket médio ${formatBRL(data.resumo.ticket_medio)}`}
                        icon={<Hash className="h-5 w-5" />}
                        tone="blue"
                      />
                    </>
                  )}
            </div>
          </div>

          {/* Evolução diária + Por categoria */}
          {!loading && data && (
            <div className="space-y-3">
              <SectionLabel
                title="Evolução"
                description="Gastos dia a dia no mês"
              />
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 ui-stagger">
                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200 xl:col-span-7">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-lg bg-rose-500/10 p-1.5">
                        <Activity className="h-4 w-4 text-rose-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Evolução diária
                      </CardTitle>
                      <div className="flex w-full flex-wrap items-center gap-3 text-[11px] text-white/40 sm:ml-auto sm:w-auto">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-5 rounded-sm bg-rose-500/70 inline-block" />
                          Dia
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-px w-5 inline-block bg-violet-400"
                            style={{ borderTop: "2px dashed #8b5cf6" }}
                          />
                          Acumulado
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2 pb-4">
                    <EvolucaoDiariaChart data={data.evolucao_diaria} />
                  </CardContent>
                </Card>

                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200 xl:col-span-5">
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
              </div>
            </div>
          )}

          {/* Forma de pagamento + Maiores gastos */}
          {!loading && data && (
            <div className="space-y-3">
              <SectionLabel title="Distribuição" />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 ui-stagger">
                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200">
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

                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-amber-500/10 p-1.5">
                        <ReceiptText className="h-4 w-4 text-amber-500" />
                      </div>
                      <CardTitle className="text-sm font-semibold">
                        Maiores gastos
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
                                    new Date(
                                      g.data_gasto.slice(0, 10) + "T00:00:00",
                                    ),
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

          {/* Tabela resumo por categoria */}
          {!loading && data && data.categorias.length > 0 && (
            <div className="space-y-3">
              <SectionLabel title="Resumo por categoria" />
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-2 p-3 md:hidden">
                    {data.categorias.map((c, i) => {
                      const pct =
                        totalGeral > 0
                          ? ((Number(c.total) / totalGeral) * 100).toFixed(1)
                          : "0.0";
                      const ticket =
                        c.quantidade > 0 ? Number(c.total) / c.quantidade : 0;
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span style={{ color: c.cor }}>
                                  {c.icone ?? "📦"}
                                </span>
                                <p className="truncate text-sm font-semibold text-white/85">
                                  {c.nome}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-white/45">
                                {c.quantidade} transação
                                {c.quantidade !== 1 ? "ões" : ""} · {pct}%
                              </p>
                            </div>
                            <p className="shrink-0 text-right text-sm font-bold tabular-nums text-white/85">
                              {formatBRL(Number(c.total))}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
                            <span className="text-white/40">Ticket médio</span>
                            <span className="font-semibold tabular-nums text-white/65">
                              {formatBRL(ticket)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="rounded-xl border border-white/[0.10] bg-white/[0.06] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide text-white/45">
                          Total
                        </span>
                        <span className="text-sm font-bold tabular-nums text-white/85">
                          {formatBRL(totalGeral)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-[640px] w-full text-sm">
                      <thead className="border-y border-white/10 bg-white/[0.04]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                            Categoria
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            %
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Qtd
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                            Ticket médio
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.categorias.map((c, i) => {
                          const pct =
                            totalGeral > 0
                              ? (
                                  (Number(c.total) / totalGeral) *
                                  100
                                ).toFixed(1)
                              : "0.0";
                          const ticket =
                            c.quantidade > 0
                              ? Number(c.total) / c.quantidade
                              : 0;
                          return (
                            <tr
                              key={i}
                              className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span style={{ color: c.cor }}>
                                    {c.icone ?? "📦"}
                                  </span>
                                  <span className="font-medium text-white/80">
                                    {c.nome}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-semibold text-white/80">
                                {formatBRL(Number(c.total))}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-xs font-medium text-white/50">
                                  {pct}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-white/50">
                                {c.quantidade}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-white/50">
                                {formatBRL(ticket)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="border-t border-white/15 bg-white/[0.03]">
                        <tr>
                          <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-white/40">
                            Total
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-white/80">
                            {formatBRL(totalGeral)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-white/40">
                            100%
                          </td>
                          <td className="px-4 py-3 text-right text-white/50">
                            {data.resumo.quantidade_transacoes}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-white/50">
                            {formatBRL(data.resumo.ticket_medio)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabela de gastos detalhados */}
          {!loading && (
            <div className="space-y-3">
              <SectionLabel
                title="Gastos detalhados"
                description={
                  gastosTotal > 50
                    ? `${gastosTotal} gastos — exibindo os 50 mais recentes`
                    : `${gastosTotal} gasto${gastosTotal !== 1 ? "s" : ""}`
                }
              />
              <Card>
                <CardContent className="p-0">
                  {gastosLoading ? (
                    <div className="p-4 space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : gastos.length === 0 ? (
                    <p className="py-10 text-center text-sm text-white/40">
                      Nenhum gasto encontrado.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 p-3 md:hidden">
                        {gastos.map((g, i) => (
                          <div
                            key={g.id ?? i}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white/85">
                                  {g.descricao}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
                                  <span>
                                    {format(
                                      new Date(
                                        g.data_gasto.slice(0, 10) + "T00:00:00",
                                      ),
                                      "dd/MM",
                                    )}
                                  </span>
                                  {g.cartao_apelido && (
                                    <>
                                      <span>·</span>
                                      <span>{g.cartao_apelido}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-bold tabular-nums text-white/85">
                                {formatBRL(Number(g.valor_total))}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {g.categoria_nome && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
                                  style={{
                                    backgroundColor: `${g.categoria_cor ?? "#9ca3af"}22`,
                                    color: g.categoria_cor ?? "#9ca3af",
                                  }}
                                >
                                  {g.categoria_icone} {g.categoria_nome}
                                </span>
                              )}
                              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-white/55">
                                {FORMA_PAGAMENTO_LABELS[g.forma_pagamento] ??
                                  g.forma_pagamento}
                              </span>
                              <span
                                className={cn(
                                  "rounded-md px-2 py-1 text-[11px] font-semibold",
                                  g.status === "pago"
                                    ? "bg-green-500/15 text-green-400"
                                    : g.status === "cancelado"
                                      ? "bg-white/10 text-white/30"
                                      : "bg-amber-500/15 text-amber-400",
                                )}
                              >
                                {g.status === "pago"
                                  ? "Pago"
                                  : g.status === "cancelado"
                                    ? "Cancelado"
                                    : "Pendente"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-[640px] w-full text-sm">
                        <thead className="border-y border-white/10 bg-white/[0.04]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                              Data
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                              Descrição
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide hidden md:table-cell">
                              Categoria
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide hidden lg:table-cell">
                              Pagamento
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                              Valor
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wide hidden sm:table-cell">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {gastos.map((g, i) => (
                            <tr
                              key={g.id ?? i}
                              className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                            >
                              <td className="px-4 py-3 tabular-nums text-white/50 whitespace-nowrap">
                                {format(
                                  new Date(
                                    g.data_gasto.slice(0, 10) + "T00:00:00",
                                  ),
                                  "dd/MM",
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-white/80 truncate max-w-[200px]">
                                  {g.descricao}
                                </p>
                                {g.cartao_apelido && (
                                  <p className="text-[10px] text-white/30 mt-0.5">
                                    {g.cartao_apelido}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                {g.categoria_nome && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      backgroundColor: `${g.categoria_cor ?? "#9ca3af"}22`,
                                      color: g.categoria_cor ?? "#9ca3af",
                                    }}
                                  >
                                    {g.categoria_icone} {g.categoria_nome}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell text-white/50 text-xs whitespace-nowrap">
                                {FORMA_PAGAMENTO_LABELS[g.forma_pagamento] ??
                                  g.forma_pagamento}
                                {g.tipo_pagamento === "parcelado" && (
                                  <span className="ml-1 text-white/30">
                                    (parc.)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-semibold text-white/80 whitespace-nowrap">
                                {formatBRL(Number(g.valor_total))}
                              </td>
                              <td className="px-4 py-3 text-center hidden sm:table-cell">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold",
                                    g.status === "pago"
                                      ? "bg-green-500/15 text-green-400"
                                      : g.status === "cancelado"
                                        ? "bg-white/10 text-white/30"
                                        : "bg-amber-500/15 text-amber-400",
                                  )}
                                >
                                  {g.status === "pago"
                                    ? "Pago"
                                    : g.status === "cancelado"
                                      ? "Cancelado"
                                      : "Pendente"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Aba Anual ────────────────────────────────────────────────────────────────

function PeriodoCurtoTab({ modo }: { modo: "diaria" | "semanal" }) {
  const hoje = toDateInput(new Date());
  const [dataBase, setDataBase] = useState(
    modo === "semanal" ? getInicioSemana(hoje) : hoje,
  );
  const [gastos, setGastos] = useState<GastoDetalhe[]>([]);
  const [rendas, setRendas] = useState<RendaDetalhe[]>([]);
  const [totalGastos, setTotalGastos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const dataInicio = modo === "semanal" ? getInicioSemana(dataBase) : dataBase;
  const dataFim = modo === "semanal" ? addDaysInput(dataInicio, 6) : dataInicio;
  const tituloPeriodo =
    modo === "semanal"
      ? `${format(parseDateInput(dataInicio), "dd/MM", { locale: ptBR })} a ${format(parseDateInput(dataFim), "dd/MM/yyyy", { locale: ptBR })}`
      : format(parseDateInput(dataInicio), "dd 'de' MMMM 'de' yyyy", {
          locale: ptBR,
        });

  const navegar = (delta: number) => {
    setDataBase((current) =>
      addDaysInput(current, modo === "semanal" ? delta * 7 : delta),
    );
  };

  const fetchPeriodo = useCallback(async (inicio: string, fim: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        data_inicio: inicio,
        data_fim: fim,
        limit: "200",
        page: "1",
      });
      const [gastosRes, rendaRes] = await Promise.all([
        api.get<{ data: GastoDetalhe[]; pagination: { total: number } }>(
          `/gastos?${params}`,
        ),
        api.get<{ data: RendaDetalhe[] }>(`/renda?${params}`),
      ]);

      setGastos(
        (gastosRes.data.data ?? []).filter((g) => g.status !== "cancelado"),
      );
      setTotalGastos(gastosRes.data.pagination?.total ?? 0);
      setRendas(rendaRes.data.data ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
      setGastos([]);
      setRendas([]);
      setTotalGastos(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriodo(dataInicio, dataFim);
  }, [dataInicio, dataFim, fetchPeriodo]);

  const totalGasto = gastos.reduce(
    (acc, g) => acc + Number(g.valor_total || 0),
    0,
  );
  const totalRenda = rendas.reduce((acc, r) => acc + Number(r.valor || 0), 0);
  const saldo = totalRenda - totalGasto;
  const ticketMedio = gastos.length > 0 ? totalGasto / gastos.length : 0;
  const categorias = gastos
    .reduce<CategoriaData[]>((acc, gasto) => {
      const nome = gasto.categoria_nome ?? "Sem Categoria";
      const found = acc.find((item) => item.nome === nome);
      if (found) {
        found.quantidade += 1;
        found.total += Number(gasto.valor_total || 0);
        return acc;
      }
      acc.push({
        nome,
        cor: gasto.categoria_cor ?? "#9CA3AF",
        icone: gasto.categoria_icone ?? "📦",
        quantidade: 1,
        total: Number(gasto.valor_total || 0),
      });
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);

  const formasPagamento = gastos
    .reduce<FormaPgtoData[]>((acc, gasto) => {
      const found = acc.find(
        (item) => item.forma_pagamento === gasto.forma_pagamento,
      );
      if (found) {
        found.quantidade += 1;
        found.total += Number(gasto.valor_total || 0);
        return acc;
      }
      acc.push({
        forma_pagamento: gasto.forma_pagamento,
        quantidade: 1,
        total: Number(gasto.valor_total || 0),
      });
      return acc;
    }, [])
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => navegar(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm backdrop-blur-sm sm:min-w-[220px] sm:flex-none sm:px-4">
          <span className="truncate select-none font-medium text-white/80">
            {tituloPeriodo}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => navegar(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar o relatório"
          description="Falha ao buscar os dados do período selecionado."
          onAction={() => fetchPeriodo(dataInicio, dataFim)}
        />
      ) : !loading && gastos.length === 0 && rendas.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={FileBarChart}
          title={`Sem dados para ${modo === "semanal" ? "esta semana" : "este dia"}`}
          description="Nenhum registro de renda ou gastos encontrado."
        />
      ) : (
        <>
          <div className="space-y-3">
            <SectionLabel
              title={modo === "semanal" ? "Resumo semanal" : "Resumo diário"}
              description={tituloPeriodo}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 ui-stagger">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))
              ) : (
                <>
                  <StatCard
                    label="Total de Gastos"
                    value={formatBRL(totalGasto)}
                    description={`${gastos.length} transação${gastos.length !== 1 ? "ões" : ""}`}
                    icon={<TrendingDown className="h-5 w-5" />}
                    tone="rose"
                  />
                  <StatCard
                    label="Total de Renda"
                    value={formatBRL(totalRenda)}
                    description={`${rendas.length} entrada${rendas.length !== 1 ? "s" : ""}`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    tone="green"
                  />
                  <StatCard
                    label="Saldo"
                    value={formatBRL(saldo)}
                    description={
                      saldo >= 0 ? "Balanço positivo" : "Balanço negativo"
                    }
                    icon={<Wallet className="h-5 w-5" />}
                    tone={saldo >= 0 ? "blue" : "rose"}
                  />
                  <StatCard
                    label="Ticket Médio"
                    value={formatBRL(ticketMedio)}
                    description="Média por gasto"
                    icon={<Hash className="h-5 w-5" />}
                    tone="amber"
                  />
                </>
              )}
            </div>
          </div>

          {!loading && (
            <div className="space-y-3">
              <SectionLabel title="Distribuição" />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 ui-stagger">
                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200">
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
                    <GastosCategoriaChart data={categorias} />
                  </CardContent>
                </Card>

                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200">
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
                    <FormaPagamentoChart data={formasPagamento} />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!loading && (
            <div className="space-y-3">
              <SectionLabel
                title="Gastos detalhados"
                description={
                  totalGastos > 200
                    ? `${totalGastos} gastos — exibindo os 200 mais recentes`
                    : `${gastos.length} gasto${gastos.length !== 1 ? "s" : ""}`
                }
              />
              <Card>
                <CardContent className="p-0">
                  {gastos.length === 0 ? (
                    <p className="py-10 text-center text-sm text-white/40">
                      Nenhum gasto encontrado.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 p-3 md:hidden">
                        {gastos.map((g, i) => (
                          <div
                            key={g.id ?? i}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white/85">
                                  {g.descricao}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
                                  <span>
                                    {format(
                                      new Date(
                                        `${g.data_gasto.slice(0, 10)}T00:00:00`,
                                      ),
                                      "dd/MM",
                                    )}
                                  </span>
                                  {g.cartao_apelido && (
                                    <>
                                      <span>·</span>
                                      <span>{g.cartao_apelido}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-bold tabular-nums text-white/85">
                                {formatBRL(Number(g.valor_total))}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {g.categoria_nome && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
                                  style={{
                                    backgroundColor: `${g.categoria_cor ?? "#9ca3af"}22`,
                                    color: g.categoria_cor ?? "#9ca3af",
                                  }}
                                >
                                  {g.categoria_icone} {g.categoria_nome}
                                </span>
                              )}
                              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[11px] text-white/55">
                                {FORMA_PAGAMENTO_LABELS[g.forma_pagamento] ??
                                  g.forma_pagamento}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-[520px] w-full text-sm">
                        <thead className="border-y border-white/10 bg-white/[0.04]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                              Data
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide">
                              Descrição
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wide hidden md:table-cell">
                              Categoria
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wide">
                              Valor
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {gastos.map((g, i) => (
                            <tr
                              key={g.id ?? i}
                              className="border-b border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                            >
                              <td className="px-4 py-3 tabular-nums text-white/50 whitespace-nowrap">
                                {format(
                                  new Date(
                                    `${g.data_gasto.slice(0, 10)}T00:00:00`,
                                  ),
                                  "dd/MM",
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-white/80 truncate max-w-[220px]">
                                  {g.descricao}
                                </p>
                                {g.cartao_apelido && (
                                  <p className="text-[10px] text-white/30 mt-0.5">
                                    {g.cartao_apelido}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                {g.categoria_nome && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
                                    style={{
                                      backgroundColor: `${g.categoria_cor ?? "#9ca3af"}22`,
                                      color: g.categoria_cor ?? "#9ca3af",
                                    }}
                                  >
                                    {g.categoria_icone} {g.categoria_nome}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-semibold text-white/80 whitespace-nowrap">
                                {formatBRL(Number(g.valor_total))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg shrink-0 border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
          onClick={() => setAno((a) => a - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm backdrop-blur-sm sm:min-w-[100px] sm:flex-none">
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
            <Card className="min-w-0 hover:shadow-md transition-shadow duration-200 ring-1 ring-white/10">
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
                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200 xl:col-span-7">
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

                <Card className="min-w-0 hover:shadow-md transition-shadow duration-200 xl:col-span-5">
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
              <Card className="min-w-0 hover:shadow-md transition-shadow duration-200">
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
                    <table className="min-w-[720px] w-full text-sm">
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
              <Card className="min-w-0 hover:shadow-md transition-shadow duration-200">
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
                    <table className="min-w-[760px] w-full text-sm">
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
              {data.meses.length > 0 &&
                (() => {
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
        title={"Relatórios"}
        titleColor="text-amber-400"
        description={
          "Análise diária, semanal, mensal, anual e projeções futuras"
        }
      />
      <Tabs defaultValue="mensal" className="space-y-6">
        <TabsList className="!grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.06] p-1 sm:!inline-flex sm:w-auto sm:flex-wrap">
          <TabsTrigger
            value="diaria"
            className="min-w-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-2 py-2 text-xs font-medium transition-all sm:px-4 sm:py-1.5 sm:text-sm"
          >
            Diária
          </TabsTrigger>
          <TabsTrigger
            value="semanal"
            className="min-w-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-2 py-2 text-xs font-medium transition-all sm:px-4 sm:py-1.5 sm:text-sm"
          >
            Semanal
          </TabsTrigger>
          <TabsTrigger
            value="mensal"
            className="min-w-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-2 py-2 text-xs font-medium transition-all sm:px-4 sm:py-1.5 sm:text-sm"
          >
            Mensal
          </TabsTrigger>
          <TabsTrigger
            value="anual"
            className="min-w-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-2 py-2 text-xs font-medium transition-all sm:px-4 sm:py-1.5 sm:text-sm"
          >
            Anual
          </TabsTrigger>
          <TabsTrigger
            value="projecoes"
            className="col-span-2 min-w-0 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 rounded-md px-2 py-2 text-xs font-medium transition-all sm:col-span-1 sm:px-4 sm:py-1.5 sm:text-sm"
          >
            Projeções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diaria" className="mt-0">
          <PeriodoCurtoTab modo="diaria" />
        </TabsContent>

        <TabsContent value="semanal" className="mt-0">
          <PeriodoCurtoTab modo="semanal" />
        </TabsContent>

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
