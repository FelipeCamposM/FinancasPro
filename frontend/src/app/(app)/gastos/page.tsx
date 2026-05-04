"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageDataState } from "@/components/ui/page-data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { GastoDialog } from "./GastoDialog";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Receipt,
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
  TrendingDown,
  TrendingUp,
  Wallet,
  SlidersHorizontal,
  X,
  CalendarRange,
  FilterX,
  LayoutGrid,
  Layers,
  CreditCard,
  CircleCheckBig,
  Banknote,
  QrCode,
  ArrowLeftRight,
  HelpCircle,
  Clock,
  CircleCheck,
  CircleX,
  Zap,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

interface Gasto {
  id: string;
  descricao: string;
  valor_total: number;
  data_gasto: string;
  categoria_id?: number;
  categoria_nome?: string;
  categoria_cor?: string;
  categoria_icone?: string;
  forma_pagamento: string;
  status: string;
  observacoes?: string;
  tipo_pagamento: string;
  quantidade_parcelas: number;
  numero_parcela?: number;
  gasto_origem_id?: string;
}

interface Categoria {
  id: number;
  nome: string;
  cor: string;
  icone: string;
}

interface PaginatedResponse {
  data: Gasto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  pendente: {
    label: "Pendente",
    className: "border-yellow-400/40 bg-yellow-500/10 text-yellow-300",
  },
  pago: {
    label: "Pago",
    className: "border-blue-400/40 bg-blue-500/10 text-blue-300",
  },
  cancelado: {
    label: "Cancelado",
    className: "border-rose-400/40 bg-rose-500/10 text-rose-300",
  },
};

const formaLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Crédito",
  cartao_debito: "Débito",
  pix: "Pix",
  transferencia: "Transferência",
  outro: "Outro",
};

function formaPagtoLabel(forma: string, tipo: string): string {
  const parcelado = tipo === "parcelado";
  if (forma === "cartao_credito")
    return parcelado ? "Crédito a Prazo" : "Crédito à Vista";
  if (forma === "cartao_debito")
    return parcelado ? "Débito a Prazo" : "Débito à Vista";
  const labels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "Pix",
    transferencia: "Transferência",
    outro: "Outro",
  };
  return labels[forma] ?? forma;
}

function getFormaIcon(forma: string, cls = "h-3.5 w-3.5"): JSX.Element {
  const map: Record<string, JSX.Element> = {
    dinheiro: <Banknote className={`${cls} text-blue-600`} />,
    cartao_credito: <CreditCard className={`${cls} text-violet-600`} />,
    cartao_debito: <Wallet className={`${cls} text-blue-600`} />,
    pix: <QrCode className={`${cls} text-cyan-600`} />,
    transferencia: <ArrowLeftRight className={`${cls} text-sky-600`} />,
    outro: <HelpCircle className={`${cls} text-muted-foreground`} />,
  };
  return map[forma] ?? <HelpCircle className={cls} />;
}

function getStatusIcon(status: string, cls = "h-3.5 w-3.5"): JSX.Element {
  const map: Record<string, JSX.Element> = {
    pendente: <Clock className={`${cls} text-yellow-500`} />,
    pago: <CircleCheck className={`${cls} text-blue-500`} />,
    cancelado: <CircleX className={`${cls} text-red-500`} />,
  };
  return map[status] ?? <Clock className={cls} />;
}

function getCategoryIcon(nome: string) {
  const icons: Record<string, JSX.Element> = {
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

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: string) {
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return date;
  }
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sumário do período
  const [summary, setSummary] = useState<{
    total_gastos: number;
    total_renda: number;
    diferenca: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Categorias para o filtro
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const categoriasFetched = useRef(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterForma, setFilterForma] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterTipoPagto, setFilterTipoPagto] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [periodoMode, setPeriodoMode] = useState<"mes" | "custom" | "todos">(
    "mes",
  );
  const [mesAtual, setMesAtual] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Gasto | null>(null);

  useEffect(() => {
    if (categoriasFetched.current) return;
    categoriasFetched.current = true;
    api
      .get<{ data: Categoria[] }>("/categorias?limit=200")
      .then(({ data }) => setCategorias(data.data))
      .catch(() => {});
  }, []);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterForma) params.set("forma_pagamento", filterForma);
      if (filterCategoria) params.set("categoria_id", filterCategoria);
      if (filterTipoPagto) params.set("tipo_pagamento", filterTipoPagto);
      if (periodoMode === "mes") {
        const y = mesAtual.getFullYear();
        const m = mesAtual.getMonth();
        params.set("data_inicio", `${y}-${String(m + 1).padStart(2, "0")}-01`);
        params.set("data_fim", format(new Date(y, m + 1, 0), "yyyy-MM-dd"));
      } else if (periodoMode === "custom") {
        if (filterDataInicio) params.set("data_inicio", filterDataInicio);
        if (filterDataFim) params.set("data_fim", filterDataFim);
      }
      // periodoMode === "todos": sem filtro de data

      const { data } = await api.get<PaginatedResponse>(`/gastos?${params}`);
      setGastos(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar gastos");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    filterStatus,
    filterForma,
    filterCategoria,
    filterTipoPagto,
    periodoMode,
    mesAtual,
    filterDataInicio,
    filterDataFim,
  ]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (periodoMode === "mes") {
        params.set("mes", format(mesAtual, "yyyy-MM"));
      } else if (periodoMode === "custom") {
        if (filterDataInicio) params.set("data_inicio", filterDataInicio);
        if (filterDataFim) params.set("data_fim", filterDataFim);
      }
      const { data } = await api.get(`/dashboard/period-summary?${params}`);
      setSummary(data);
    } catch {
      // silencia erro do sumário para não atrapalhar a listagem
    } finally {
      setLoadingSummary(false);
    }
  }, [periodoMode, mesAtual, filterDataInicio, filterDataFim]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setPage(1);
  }, [
    filterStatus,
    filterForma,
    filterCategoria,
    filterTipoPagto,
    periodoMode,
    mesAtual,
    filterDataInicio,
    filterDataFim,
  ]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/gastos/${deleteTarget.id}`);
      toast.success("Gasto excluído");
      fetchGastos();
      fetchSummary();
    } catch {
      toast.error("Erro ao excluir gasto");
    } finally {
      setDeleteTarget(null);
    }
  }

  // Filtragem local por busca (nome)
  const displayedGastos = search
    ? gastos.filter((g) =>
        g.descricao.toLowerCase().includes(search.toLowerCase()),
      )
    : gastos;

  const activeFilterCount = [
    filterStatus,
    filterCategoria,
    filterTipoPagto,
    filterForma,
  ].filter(Boolean).length;
  const hasActiveFilters = !!(
    search ||
    filterStatus ||
    filterCategoria ||
    filterTipoPagto ||
    filterForma
  );

  function clearFilters() {
    setSearch("");
    setFilterStatus("");
    setFilterCategoria("");
    setFilterTipoPagto("");
    setFilterForma("");
  }

  const activeChips = [
    filterCategoria && {
      key: "categoria",
      label:
        categorias.find((c) => String(c.id) === filterCategoria)?.nome ?? "?",
      onRemove: () => setFilterCategoria(""),
    },
    filterTipoPagto && {
      key: "tipo",
      label: filterTipoPagto === "a_vista" ? "À vista" : "A prazo",
      onRemove: () => setFilterTipoPagto(""),
    },
    filterForma && {
      key: "forma",
      label: formaLabels[filterForma] ?? filterForma,
      onRemove: () => setFilterForma(""),
    },
    filterStatus && {
      key: "status",
      label: statusConfig[filterStatus]?.label ?? filterStatus,
      onRemove: () => setFilterStatus(""),
    },
  ].filter(Boolean) as { key: string; label: string; onRemove: () => void }[];

  const totalExibido = displayedGastos.reduce(
    (acc, gasto) => acc + Number(gasto.valor_total || 0),
    0,
  );
  const pendentesExibidos = displayedGastos.filter(
    (gasto) => gasto.status === "pendente",
  ).length;
  const ticketMedio = displayedGastos.length
    ? totalExibido / displayedGastos.length
    : 0;

  return (
    <PageShell contentClassName="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Gastos"
        titleClassName="text-rose-400"
        description={`${total} ${total === 1 ? "registro" : "registros"}`}
        actions={
          <Button
            onClick={() => {
              setEditingGasto(null);
              setDialogOpen(true);
            }}
            className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 backdrop-blur"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Gasto
          </Button>
        }
      />

      {/* Cards de sumário do período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ui-stagger">
        {/* Total Gastos */}
        <Card className="border-rose-400/30 bg-rose-500/10 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-rose-500/20 p-2.5 shrink-0">
              <TrendingDown className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Total Gastos
              </p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="text-xl font-bold text-rose-300 tabular-nums">
                  {formatBRL(summary?.total_gastos ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Renda */}
        <Card className="border-blue-400/30 bg-blue-500/10 backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-500/20 p-2.5 shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Total Renda
              </p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="text-xl font-bold text-blue-300 tabular-nums">
                  {formatBRL(summary?.total_renda ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Diferença */}
        <Card
          className={
            (summary?.diferenca ?? 0) >= 0
              ? "border-blue-400/30 bg-blue-500/10 backdrop-blur-xl"
              : "border-orange-400/30 bg-orange-500/10 backdrop-blur-xl"
          }
        >
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`rounded-lg p-2.5 shrink-0 ${
                (summary?.diferenca ?? 0) >= 0
                  ? "bg-blue-500/20"
                  : "bg-orange-500/20"
              }`}
            >
              <Wallet
                className={`h-5 w-5 ${
                  (summary?.diferenca ?? 0) >= 0
                    ? "text-blue-400"
                    : "text-orange-400"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
                Saldo
              </p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p
                  className={`text-xl font-bold tabular-nums ${
                    (summary?.diferenca ?? 0) >= 0
                      ? "text-blue-300"
                      : "text-orange-300"
                  }`}
                >
                  {formatBRL(summary?.diferenca ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-md ring-1 ring-white/10">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 bg-rose-500/[0.07] px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
              <SlidersHorizontal className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <span className="text-sm font-semibold text-white">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-white/40 transition-all hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
              aria-label="Limpar todos os filtros"
            >
              <FilterX className="h-3.5 w-3.5" />
              Limpar tudo
            </button>
          )}
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* Linha 1: Busca + Período */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Busca */}
            <div className="group relative min-w-[220px] max-w-md flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Search className="h-4 w-4 text-white/40 transition-colors group-focus-within:text-rose-400" />
              </div>
              <Input
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-white/15 bg-white/[0.06] text-white placeholder:text-white/30 pl-9 shadow-sm transition-all focus-visible:border-rose-400/40 focus-visible:ring-rose-400/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 rounded"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Navegador de mês */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-xl border border-rose-500/25 bg-rose-500/[0.06] shadow-sm">
                <button
                  className="flex h-10 w-9 items-center justify-center border-r border-rose-500/20 text-rose-400/70 transition-all hover:bg-rose-500/15 hover:text-rose-400"
                  aria-label="Mês anterior"
                  onClick={() => {
                    setPeriodoMode("mes");
                    setMesAtual(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                    );
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPeriodoMode((prev) =>
                      prev === "todos" ? "mes" : "todos",
                    )
                  }
                  className="flex h-10 min-w-[168px] flex-col items-center justify-center px-4 transition-all hover:bg-rose-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                  aria-label="Alternar período entre mês atual e todos os meses"
                >
                  {periodoMode === "todos" ? (
                    <span className="text-sm font-medium text-white/40">
                      Todos os meses
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400/50">
                        {format(mesAtual, "yyyy")}
                      </span>
                      <span className="text-[15px] font-bold capitalize leading-tight text-rose-400">
                        {format(mesAtual, "MMMM", { locale: ptBR })}
                      </span>
                    </>
                  )}
                </button>
                <button
                  className="flex h-10 w-9 items-center justify-center border-l border-rose-500/20 text-rose-400/70 transition-all hover:bg-rose-500/15 hover:text-rose-400"
                  aria-label="Próximo mês"
                  onClick={() => {
                    setPeriodoMode("mes");
                    setMesAtual(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                    );
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() =>
                  setPeriodoMode((prev) =>
                    prev === "custom" ? "mes" : "custom",
                  )
                }
                className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-xs font-medium transition-all ${
                  periodoMode === "custom"
                    ? "border-rose-400/30 bg-rose-500/10 text-rose-400 shadow-sm"
                    : "border-white/15 bg-white/[0.06] text-white/50 hover:border-rose-400/25 hover:bg-rose-500/5 hover:text-rose-400"
                }`}
                aria-label="Alternar filtro de período customizado"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Período
              </button>

              {periodoMode === "custom" && (
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 shadow-sm">
                  <Input
                    type="date"
                    className="h-7 w-32 border-0 p-0 text-xs shadow-none focus-visible:ring-0"
                    value={filterDataInicio}
                    onChange={(e) => setFilterDataInicio(e.target.value)}
                  />
                  <div className="h-3.5 w-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    até
                  </span>
                  <div className="h-3.5 w-px bg-border" />
                  <Input
                    type="date"
                    className="h-7 w-32 border-0 p-0 text-xs shadow-none focus-visible:ring-0"
                    value={filterDataFim}
                    onChange={(e) => setFilterDataFim(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Linha 2: Selects coloridos */}
          <div className="flex flex-wrap gap-3">
            {/* Categoria — violet */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 pl-1">
                <LayoutGrid className="h-3 w-3 text-violet-500" />
                <label className="text-[10px] font-bold uppercase tracking-wider text-violet-400/70">
                  Categoria
                </label>
              </div>
              <Select
                value={filterCategoria || "todas"}
                onValueChange={(v) =>
                  setFilterCategoria(v === "todas" ? "" : v)
                }
              >
                <SelectTrigger
                  className={`h-9 min-w-[155px] text-sm transition-all ${
                    filterCategoria
                      ? "border-violet-400/40 bg-violet-500/10 text-violet-300"
                      : "border-white/15 bg-white/[0.06] text-white/70 hover:border-violet-400/25 hover:bg-violet-500/5"
                  }`}
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-muted shrink-0">
                        <LayoutGrid className="h-3 w-3 text-muted-foreground" />
                      </span>
                      Todas
                    </div>
                  </SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded shrink-0"
                          style={{
                            backgroundColor: `${c.cor ?? "#94a3b8"}22`,
                            color: c.cor ?? "#94a3b8",
                          }}
                        >
                          {getCategoryIcon(c.nome)}
                        </span>
                        {c.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modalidade — amber */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 pl-1">
                <Layers className="h-3 w-3 text-amber-500" />
                <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">
                  Modalidade
                </label>
              </div>
              <Select
                value={filterTipoPagto || "todos"}
                onValueChange={(v) =>
                  setFilterTipoPagto(v === "todos" ? "" : v)
                }
              >
                <SelectTrigger
                  className={`h-9 min-w-[155px] text-sm transition-all ${
                    filterTipoPagto
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                      : "border-white/15 bg-white/[0.06] text-white/70 hover:border-amber-400/25 hover:bg-amber-500/5"
                  }`}
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />À
                      vista e a prazo
                    </div>
                  </SelectItem>
                  <SelectItem value="a_vista">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />À vista
                    </div>
                  </SelectItem>
                  <SelectItem value="parcelado">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-orange-500" />A
                      prazo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagamento — sky */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 pl-1">
                <CreditCard className="h-3 w-3 text-sky-500" />
                <label className="text-[10px] font-bold uppercase tracking-wider text-sky-400/70">
                  Pagamento
                </label>
              </div>
              <Select
                value={filterForma || "todos"}
                onValueChange={(v) => setFilterForma(v === "todos" ? "" : v)}
              >
                <SelectTrigger
                  className={`h-9 min-w-[165px] text-sm transition-all ${
                    filterForma
                      ? "border-sky-400/40 bg-sky-500/10 text-sky-300"
                      : "border-white/15 bg-white/[0.06] text-white/70 hover:border-sky-400/25 hover:bg-sky-500/5"
                  }`}
                >
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      Todas
                    </div>
                  </SelectItem>
                  <SelectItem value="dinheiro">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3.5 w-3.5 text-blue-600" />
                      Dinheiro
                    </div>
                  </SelectItem>
                  <SelectItem value="cartao_credito">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5 text-violet-600" />
                      Cartão de Crédito
                    </div>
                  </SelectItem>
                  <SelectItem value="cartao_debito">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-blue-600" />
                      Cartão de Débito
                    </div>
                  </SelectItem>
                  <SelectItem value="pix">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-3.5 w-3.5 text-cyan-600" />
                      Pix
                    </div>
                  </SelectItem>
                  <SelectItem value="transferencia">
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-sky-600" />
                      Transferência
                    </div>
                  </SelectItem>
                  <SelectItem value="outro">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      Outro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status — emerald */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 pl-1">
                <CircleCheckBig className="h-3 w-3 text-blue-500" />
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-400/70">
                  Status
                </label>
              </div>
              <Select
                value={filterStatus || "todos"}
                onValueChange={(v) => setFilterStatus(v === "todos" ? "" : v)}
              >
                <SelectTrigger
                  className={`h-9 min-w-[135px] text-sm transition-all ${
                    filterStatus
                      ? "border-blue-400/40 bg-blue-500/10 text-blue-300"
                      : "border-white/15 bg-white/[0.06] text-white/70 hover:border-blue-400/25 hover:bg-blue-500/5"
                  }`}
                >
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <CircleCheckBig className="h-3.5 w-3.5 text-muted-foreground" />
                      Todos
                    </div>
                  </SelectItem>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-yellow-500" />
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="pago">
                    <div className="flex items-center gap-2">
                      <CircleCheck className="h-3.5 w-3.5 text-blue-500" />
                      Pago
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelado">
                    <div className="flex items-center gap-2">
                      <CircleX className="h-3.5 w-3.5 text-red-500" />
                      Cancelado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chips de filtros ativos */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Ativos:
              </span>
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-white/80"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="ml-0.5 rounded-full p-0.5 text-white/40 transition-colors hover:bg-rose-500/20 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                    aria-label={`Remover filtro ${chip.label}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && !loadError && displayedGastos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ui-stagger">
          <Card className="border-white/15 bg-white/[0.06] backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/45 font-semibold">
                Exibição atual
              </p>
              <p className="mt-1 text-lg font-bold text-white tabular-nums">
                {displayedGastos.length}
              </p>
              <p className="text-xs text-white/55">
                de {total} registros no período
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-400/25 bg-rose-500/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-rose-300/80 font-semibold">
                Valor total exibido
              </p>
              <p className="mt-1 text-lg font-bold text-rose-300 tabular-nums">
                {formatBRL(totalExibido)}
              </p>
              <p className="text-xs text-white/55">
                Ticket médio de {formatBRL(ticketMedio)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-400/25 bg-yellow-500/10 backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-yellow-300/80 font-semibold">
                Pendências
              </p>
              <p className="mt-1 text-lg font-bold text-yellow-200 tabular-nums">
                {pendentesExibidos}
              </p>
              <p className="text-xs text-white/55">
                {pendentesExibidos === 0
                  ? "Nenhum gasto pendente nesta visão."
                  : "Itens ainda não pagos para acompanhamento."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="rounded-lg border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-rose-500/[0.05] hover:bg-rose-500/[0.05] border-b border-white/10">
                  <TableHead className="text-rose-400/80 font-semibold">
                    Descrição
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Data
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Categoria
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Pagamento
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-rose-400/80 font-semibold">
                    Valor
                  </TableHead>
                  <TableHead className="w-24 text-center text-rose-400/80 font-semibold">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar os gastos"
          description="Verifique sua conexão e tente novamente para atualizar a tabela."
          onAction={fetchGastos}
        />
      ) : displayedGastos.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={Receipt}
          title="Nenhum gasto encontrado"
          description="Ajuste os filtros ou cadastre um novo gasto para visualizar resultados."
        />
      ) : (
        <div className="rounded-lg border border-white/15 bg-white/[0.08] backdrop-blur-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-rose-500/[0.05] hover:bg-rose-500/[0.05] border-b border-white/10">
                  <TableHead className="text-rose-400/80 font-semibold">
                    Descrição
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Data
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Categoria
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Pagamento
                  </TableHead>
                  <TableHead className="text-rose-400/80 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-rose-400/80 font-semibold">
                    Valor
                  </TableHead>
                  <TableHead className="w-24 text-center text-rose-400/80 font-semibold">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="ui-stagger-rows">
                {displayedGastos.map((g) => {
                  const statusInfo = statusConfig[g.status] ?? {
                    label: g.status,
                    className: "border-white/20 bg-white/[0.06] text-white/60",
                  };
                  return (
                    <TableRow
                      key={g.id}
                      className="hover:bg-white/[0.04] border-white/5"
                    >
                      <TableCell className="font-medium max-w-[200px] truncate text-white">
                        {g.descricao}
                      </TableCell>
                      <TableCell className="text-white/50 whitespace-nowrap">
                        {formatDate(g.data_gasto)}
                      </TableCell>
                      <TableCell>
                        {g.categoria_nome ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md shrink-0"
                              style={{
                                backgroundColor: `${g.categoria_cor ?? "#94a3b8"}28`,
                                color: g.categoria_cor ?? "#94a3b8",
                              }}
                            >
                              {getCategoryIcon(g.categoria_nome)}
                            </span>
                            <span className="text-sm">{g.categoria_nome}</span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-white/50">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            {getFormaIcon(g.forma_pagamento)}
                            <span>
                              {formaPagtoLabel(
                                g.forma_pagamento,
                                g.tipo_pagamento,
                              )}
                            </span>
                          </div>
                          {g.tipo_pagamento === "parcelado" && (
                            <span className="inline-flex w-fit items-center gap-px rounded-full bg-orange-500/15 border border-orange-400/30 px-2 py-0.5 text-[10px] leading-none">
                              <span className="font-bold text-orange-300">
                                {g.numero_parcela ?? 1}
                              </span>
                              <span className="text-orange-400/50 mx-px">
                                /
                              </span>
                              <span className="font-medium text-orange-400">
                                {g.quantidade_parcelas}
                              </span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`flex w-fit items-center gap-1 ${statusInfo.className}`}
                        >
                          {getStatusIcon(g.status, "h-3 w-3")}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-rose-300">
                        {formatBRL(Number(g.valor_total))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
                            aria-label={`Editar gasto ${g.descricao}`}
                            onClick={() => {
                              setEditingGasto(g);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                            aria-label={`Excluir gasto ${g.descricao}`}
                            onClick={() => setDeleteTarget(g)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              className="bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90"
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              className="bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90"
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de criação/edição */}
      <GastoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          fetchGastos();
          fetchSummary();
        }}
        gasto={editingGasto}
      />

      {/* AlertDialog de exclusão */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>&quot;{deleteTarget?.descricao}&quot;</strong>? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
