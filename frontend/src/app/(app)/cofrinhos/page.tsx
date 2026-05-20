"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Landmark,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Target,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { fetchAndCacheQuotes, getCachedQuotes, StockQuote } from "@/lib/stockApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageDataState } from "@/components/ui/page-data-state";
import { PageShell } from "@/components/ui/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cofrinho, CofrinhoDialog, CofrinhoTipo } from "./CofrinhoDialog";
import { CofrinhoDetailDialog } from "./CofrinhoDetailDialog";
import { DepositarDialog } from "./DepositarDialog";
import { cn } from "@/lib/utils";

interface PaginatedResponse {
  data: Cofrinho[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface SummaryResponse {
  data: {
    total_guardado: number;
    total_acoes: number;
    total_contas: number;
    total_itens: number;
    total_itens_acoes: number;
    total_itens_contas: number;
  };
}

const tipoInfo = {
  conta: {
    label: "Contas",
    singular: "conta",
    icon: Landmark,
    badge: "blue" as const,
    color: "text-blue-300",
    glow: "from-blue-500/[0.22] via-white/[0.07] to-blue-950/35",
    border: "border-blue-300/25 hover:border-blue-300/45",
    ring: "ring-blue-300/10",
    shadow: "shadow-blue-950/20 hover:shadow-blue-500/15",
    shine: "via-blue-200/80",
    blob: "bg-blue-300/[0.15]",
    iconBg: "border-blue-200/25 bg-blue-300/15",
    tabActive: "data-[active=true]:bg-blue-500/20 data-[active=true]:text-blue-300",
    button: "border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200",
    depositButton: "border-blue-400/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
    progressBar: "bg-blue-400",
  },
  acao: {
    label: "Ações",
    singular: "ação",
    icon: TrendingUp,
    badge: "green" as const,
    color: "text-emerald-300",
    glow: "from-emerald-500/[0.22] via-white/[0.07] to-emerald-950/35",
    border: "border-emerald-300/25 hover:border-emerald-300/45",
    ring: "ring-emerald-300/10",
    shadow: "shadow-emerald-950/20 hover:shadow-emerald-500/15",
    shine: "via-emerald-200/80",
    blob: "bg-emerald-300/[0.14]",
    iconBg: "border-emerald-200/25 bg-emerald-300/15",
    tabActive: "data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-300",
    button: "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200",
    depositButton: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
    progressBar: "bg-emerald-400",
  },
} as const;

const tabs: CofrinhoTipo[] = ["conta", "acao"];

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value + "T00:00:00").toLocaleDateString("pt-BR");
}

function getProgress(cofrinho: Cofrinho) {
  if (!cofrinho.meta_valor) return 0;
  return Math.min(100, (Number(cofrinho.saldo_atual || 0) / Number(cofrinho.meta_valor)) * 100);
}

export default function CofrinhosPage() {
  const [activeTab, setActiveTab]           = useState<CofrinhoTipo>("conta");
  const [items, setItems]                   = useState<Cofrinho[]>([]);
  const [summary, setSummary]               = useState<SummaryResponse["data"] | null>(null);
  const [loading, setLoading]               = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadError, setLoadError]           = useState(false);
  const [search, setSearch]                 = useState("");
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [selected, setSelected]             = useState<Cofrinho | null>(null);
  const [depositarCofrinho, setDepositarCofrinho] = useState<Cofrinho | null>(null);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [stockPrices, setStockPrices]       = useState<Record<string, StockQuote>>({});
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [detailCofrinho, setDetailCofrinho] = useState<Cofrinho | null>(null);

  const currentInfo = tipoInfo[activeTab];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse>("/cofrinhos", { params: { tipo: activeTab, limit: 100 } });
      setItems(data.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar cofrinhos");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.get<SummaryResponse>("/cofrinhos/summary");
      setSummary(data.data);
    } catch {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const handleFetchPrices = useCallback(async (tickers?: string[]) => {
    const tickerList = tickers ?? items.filter(i => i.tipo === "acao" && i.ticker).map(i => i.ticker!);
    if (tickerList.length === 0) return;
    setFetchingPrices(true);
    try {
      const quotes = await fetchAndCacheQuotes(tickerList);
      setStockPrices({ ...getCachedQuotes(), ...quotes });
    } catch {
      toast.error("Não foi possível buscar cotações");
    } finally {
      setFetchingPrices(false);
    }
  }, [items]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Auto-fetch prices when switching to acao tab
  useEffect(() => {
    if (activeTab !== "acao" || items.length === 0) return;
    const tickers = items.filter(i => i.ticker).map(i => i.ticker!);
    if (tickers.length === 0) return;
    const cached = getCachedQuotes();
    const allCached = tickers.every(t => cached[t]);
    if (allCached) {
      setStockPrices(cached);
      return;
    }
    handleFetchPrices(tickers);
  }, [items, activeTab, handleFetchPrices]);

  const displayedItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.nome, item.ticker, item.instituicao, item.observacoes]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [items, search]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/cofrinhos/${deleteId}`);
      toast.success("Cofrinho excluído");
      setDeleteId(null);
      fetchItems();
      fetchSummary();
    } catch {
      toast.error("Erro ao excluir cofrinho");
    } finally {
      setDeleting(false);
    }
  }

  function onRefresh() { fetchItems(); fetchSummary(); }

  const totalItems = activeTab === "conta" ? (summary?.total_itens_contas ?? 0) : (summary?.total_itens_acoes ?? 0);

  return (
    <PageShell contentClassName="space-y-5">

      {/* ── Hero Header ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-emerald-500/60 via-emerald-400/20 to-transparent" />
        <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          {/* Left */}
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:justify-start sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <PiggyBank className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-4xl leading-none tracking-wide text-white sm:text-5xl">COFRINHOS</h1>
              <p className="mt-0.5 text-[12px] text-white/40">
                {loading ? "…" : `${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
                <span className="ml-1.5 text-emerald-400/70">· {currentInfo.label}</span>
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
            <Button
              onClick={() => { setSelected(null); setDialogOpen(true); }}
              className={cn(
                "h-10 rounded-xl border px-4 text-white shadow-lg ring-1 ring-white/[0.10] transition-all duration-200 hover:-translate-y-0.5",
                activeTab === "conta"
                  ? "border-blue-300/30 bg-gradient-to-br from-blue-500/90 via-blue-500/75 to-blue-700/90 shadow-blue-950/25 hover:border-blue-200/50 hover:shadow-blue-500/20"
                  : "border-emerald-300/30 bg-gradient-to-br from-emerald-500/90 via-emerald-500/75 to-emerald-700/90 shadow-emerald-950/25 hover:border-emerald-200/50 hover:shadow-emerald-500/20",
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova {currentInfo.singular}
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 ui-stagger">

        {/* Total guardado */}
        <div className="group relative overflow-hidden rounded-xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/[0.24] via-white/[0.075] to-emerald-950/35 p-4 shadow-lg shadow-emerald-950/20 ring-1 ring-white/[0.08] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300/45 hover:bg-emerald-500/[0.18] hover:shadow-emerald-500/15">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/80 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-300/[0.14] blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100/75">Total guardado</p>
              {loadingSummary ? (
                <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
              ) : (
                <p className="mt-1.5 font-display text-3xl leading-none tabular-nums text-emerald-100 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                  {formatCurrency(summary?.total_guardado)}
                </p>
              )}
            </div>
            <div className="shrink-0 rounded-xl border border-emerald-200/25 bg-emerald-300/15 p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <PiggyBank className="h-5 w-5 text-emerald-100" />
            </div>
          </div>
        </div>

        {/* Em contas */}
        <div className="group relative overflow-hidden rounded-xl border border-blue-300/25 bg-gradient-to-br from-blue-500/[0.22] via-white/[0.075] to-blue-950/35 p-4 shadow-lg shadow-blue-950/20 ring-1 ring-white/[0.08] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-300/45 hover:bg-blue-500/[0.18] hover:shadow-blue-500/15">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/80 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-300/[0.15] blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100/75">Em contas</p>
              {loadingSummary ? (
                <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
              ) : (
                <>
                  <p className="mt-1.5 font-display text-3xl leading-none tabular-nums text-blue-100 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    {formatCurrency(summary?.total_contas)}
                  </p>
                  {summary && summary.total_itens_contas > 0 && (
                    <p className="mt-2 inline-flex rounded-full border border-blue-200/20 bg-blue-950/25 px-2 py-0.5 text-[11px] font-medium text-blue-100/75">
                      {summary.total_itens_contas} conta{summary.total_itens_contas !== 1 ? "s" : ""}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="shrink-0 rounded-xl border border-blue-200/25 bg-blue-300/15 p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Landmark className="h-5 w-5 text-blue-100" />
            </div>
          </div>
        </div>

        {/* Em ações */}
        <div className="group relative overflow-hidden rounded-xl border border-violet-300/25 bg-gradient-to-br from-violet-500/[0.22] via-white/[0.075] to-violet-950/35 p-4 shadow-lg shadow-violet-950/20 ring-1 ring-white/[0.08] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet-300/45 hover:bg-violet-500/[0.18] hover:shadow-violet-500/15">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/80 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-violet-300/[0.14] blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-100/75">Em ações</p>
              {loadingSummary ? (
                <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
              ) : (
                <>
                  <p className="mt-1.5 font-display text-3xl leading-none tabular-nums text-violet-100 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    {formatCurrency(summary?.total_acoes)}
                  </p>
                  {summary && summary.total_itens_acoes > 0 && (
                    <p className="mt-2 inline-flex rounded-full border border-violet-200/20 bg-violet-950/25 px-2 py-0.5 text-[11px] font-medium text-violet-100/75">
                      {summary.total_itens_acoes} ação{summary.total_itens_acoes !== 1 ? "ões" : ""}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="shrink-0 rounded-xl border border-violet-200/25 bg-violet-300/15 p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TrendingUp className="h-5 w-5 text-violet-100" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: tabs + search + consultar ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        {/* Tab pills */}
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const info = tipoInfo[tab];
            const Icon = info.icon;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(""); }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? tab === "conta"
                      ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30"
                      : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? info.color : "text-white/30")} />
                {info.label}
                {summary && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active
                      ? tab === "conta" ? "bg-blue-400/20 text-blue-300" : "bg-emerald-400/20 text-emerald-300"
                      : "bg-white/10 text-white/30",
                  )}>
                    {tab === "conta" ? summary.total_itens_contas : summary.total_itens_acoes}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Consultar cotações (só aba ações) */}
          {activeTab === "acao" && items.length > 0 && (
            <button
              onClick={() => handleFetchPrices()}
              disabled={fetchingPrices}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {fetchingPrices ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Consultar valores
            </button>
          )}

          {/* Search */}
          <div className="relative min-w-0 lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
            <Input
              placeholder={`Buscar ${currentInfo.singular}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      {/* ── Items grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <PageDataState mode="error" icon={AlertTriangle} title="Não foi possível carregar" description="Erro ao carregar cofrinhos." onAction={fetchItems} />
      ) : displayedItems.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={PiggyBank}
          title="Nenhum cofrinho encontrado"
          description={activeTab === "conta" ? "Cadastre contas para controlar seu saldo." : "Cadastre ações para acompanhar suas cotas."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 ui-stagger">
          {displayedItems.map((item) => {
            const info = tipoInfo[item.tipo];
            const Icon = info.icon;
            const progress = getProgress(item);
            const isAcao = item.tipo === "acao";

            // P&L
            const quote = isAcao && item.ticker ? stockPrices[item.ticker] : null;
            const precoMedio = Number(item.preco_medio ?? item.valor_cota ?? 0);
            const pnlPct = quote && precoMedio > 0
              ? ((quote.price - precoMedio) / precoMedio) * 100
              : null;
            const isProfit = pnlPct !== null && pnlPct >= 0;

            return (
              <div
                key={item.id}
                onClick={() => setDetailCofrinho(item)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 ring-1 ring-white/[0.06]",
                  isAcao
                    ? "border-emerald-300/20 from-emerald-500/[0.12] via-white/[0.04] to-emerald-950/25 hover:border-emerald-300/35"
                    : "border-blue-300/20 from-blue-500/[0.12] via-white/[0.04] to-blue-950/25 hover:border-blue-300/35",
                )}
              >
                {/* Top shine */}
                <div className={cn(
                  "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                  isAcao ? "via-emerald-200/50" : "via-blue-200/50",
                )} />
                {/* Glow blob */}
                <div className={cn(
                  "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125",
                  isAcao ? "bg-emerald-300/[0.10]" : "bg-blue-300/[0.12]",
                )} />

                <div className="relative space-y-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          isAcao ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300",
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <Badge variant={info.badge} className="text-[10px]">
                          {info.singular}
                        </Badge>
                        {/* P&L badge */}
                        {pnlPct !== null && (
                          <span className={cn(
                            "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                            isProfit
                              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                              : "border-rose-400/30 bg-rose-500/15 text-rose-300",
                          )}>
                            {isProfit
                              ? <TrendingUp className="h-2.5 w-2.5" />
                              : <TrendingDown className="h-2.5 w-2.5" />}
                            {isProfit ? "+" : ""}{pnlPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <h2 className="truncate text-base font-bold text-white/90">{item.nome}</h2>
                      <p className="text-xs text-white/40 mt-0.5">
                        {isAcao
                          ? `${item.ticker} · ${Number(item.quantidade_cotas ?? 0).toLocaleString("pt-BR")} cotas`
                          : item.instituicao || "Conta manual"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        title="Depositar / adicionar cotas"
                        onClick={(e) => { e.stopPropagation(); setDepositarCofrinho(item); }}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-all hover:text-white/80",
                          isAcao ? "hover:bg-emerald-500/15" : "hover:bg-blue-500/15",
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(item); setDialogOpen(true); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.08] hover:text-white/80"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-rose-500/15 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Valor */}
                  <div>
                    {isAcao && quote ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-white/35">
                          Valor de mercado
                        </p>
                        <p className={cn("mt-1 text-2xl font-bold tabular-nums", info.color)}>
                          {formatCurrency(Number(item.quantidade_cotas ?? 0) * quote.price)}
                        </p>
                        <p className="mt-0.5 text-xs text-white/30">
                          {Number(item.quantidade_cotas ?? 0).toLocaleString("pt-BR")} cotas × {formatCurrency(quote.price)}
                        </p>
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Valor de compra</span>
                          <span className="text-xs font-semibold tabular-nums text-white/45">{formatCurrency(item.saldo_atual)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-white/35">
                          {isAcao ? "Total em ações" : "Saldo"}
                        </p>
                        <p className={cn("mt-1 text-2xl font-bold tabular-nums", info.color)}>
                          {formatCurrency(item.saldo_atual)}
                        </p>
                        {isAcao && item.valor_cota && (
                          <p className="text-xs text-white/30 mt-0.5">
                            {Number(item.quantidade_cotas ?? 0).toLocaleString("pt-BR")} cotas × {formatCurrency(item.valor_cota)}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Meta progress */}
                  {item.meta_valor && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-white/40">
                          <Target className="h-3 w-3" />
                          Meta {formatCurrency(item.meta_valor)}
                          {item.data_alvo && (
                            <span className="flex items-center gap-1 text-white/30">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(item.data_alvo)}
                            </span>
                          )}
                        </span>
                        <span className={cn("font-bold text-[11px]", progress >= 100 ? "text-emerald-400" : "text-amber-300")}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className={cn("h-full rounded-full transition-all", progress >= 100 ? "bg-emerald-400" : "bg-amber-400")}
                          style={{ width: `${Math.round(progress)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {item.observacoes && (
                    <p className="line-clamp-2 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs text-white/40">
                      {item.observacoes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CofrinhoDetailDialog
        cofrinho={detailCofrinho}
        open={!!detailCofrinho}
        onClose={() => setDetailCofrinho(null)}
        onDepositar={(c) => setDepositarCofrinho(c)}
        onEditar={(c) => { setSelected(c); setDialogOpen(true); }}
      />

      <CofrinhoDialog
        open={dialogOpen}
        tipo={activeTab}
        cofrinho={selected}
        onClose={() => setDialogOpen(false)}
        onSuccess={onRefresh}
      />

      <DepositarDialog
        cofrinho={depositarCofrinho}
        open={!!depositarCofrinho}
        onClose={() => setDepositarCofrinho(null)}
        onSuccess={onRefresh}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cofrinho?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="border border-rose-400/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
