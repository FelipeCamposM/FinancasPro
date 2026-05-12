"use client";

import { useCallback, useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  ChevronsUpDown,
  Check,
  CreditCard,
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
  Repeat,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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
  cartao_apelido?: string;
  cartao_bandeira?: string;
  cartao_cor?: string;
  cartao_ultimos_4_digitos?: string;
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
    variant: "pending" | "paid" | "cancelled" | "slate";
  }
> = {
  pendente:  { label: "Pendente",  variant: "pending"   },
  pago:      { label: "Pago",      variant: "paid"      },
  cancelado: { label: "Cancelado", variant: "cancelled" },
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
    pendente: <Clock className={`${cls} text-amber-400`} />,
    pago: <CircleCheck className={`${cls} text-blue-400`} />,
    cancelado: <CircleX className={`${cls} text-rose-400`} />,
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

const BANDEIRA_LOGOS: Record<string, string> = {
  visa:       "/brand_cardlogos/visa.svg",
  mastercard: "/brand_cardlogos/mastercard.svg",
  elo:        "/brand_cardlogos/elo.svg",
  amex:       "/brand_cardlogos/amex.svg",
  hipercard:  "/brand_cardlogos/hipercard.svg",
  alelo:      "/brand_cardlogos/alelo.svg",
  paypal:     "/brand_cardlogos/paypal.svg",
};

function getContrastColor(hex: string): string {
  if (!hex || !hex.startsWith("#")) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? "#1a1a1a" : "#ffffff";
}

function CartaoChip({ apelido, bandeira, cor }: { apelido: string; bandeira?: string; cor?: string }) {
  const logo = bandeira ? BANDEIRA_LOGOS[bandeira.toLowerCase()] : undefined;
  const dot = cor ?? "#64748b";

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
      {logo && (
        <img
          src={logo}
          alt={bandeira}
          className="h-2.5 w-auto max-w-[14px] object-contain shrink-0 opacity-50"
        />
      )}
      <span>{apelido}</span>
    </span>
  );
}

function CartaoMiniDetail({
  apelido, bandeira, cor, ultimos4,
}: { apelido: string; bandeira?: string; cor?: string; ultimos4?: string }) {
  const bg = cor ?? "#334155";
  const textColor = getContrastColor(bg);
  const isLight = textColor === "#1a1a1a";
  const logo = bandeira ? BANDEIRA_LOGOS[bandeira.toLowerCase()] : undefined;

  return (
    <div
      className="relative h-[72px] w-32 shrink-0 rounded-xl p-3 select-none"
      style={{ background: bg, color: textColor }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold truncate max-w-[68px]" style={{ color: textColor, opacity: 0.85 }}>
          {apelido}
        </p>
        {logo ? (
          <img
            src={logo}
            alt={bandeira}
            className="h-4 w-auto max-w-[28px] object-contain shrink-0"
            style={isLight ? {} : { filter: "brightness(0) invert(1)" }}
          />
        ) : (
          <div className={`h-3.5 w-5 rounded shrink-0 ${isLight ? "bg-black/20" : "bg-white/30"}`} />
        )}
      </div>
      {ultimos4 && (
        <p className="mt-auto pt-2 font-mono text-[10px] tracking-widest" style={{ color: textColor, opacity: 0.7 }}>
          •••• {ultimos4}
        </p>
      )}
    </div>
  );
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
  return (
    <Suspense>
      <GastosPageInner />
    </Suspense>
  );
}

function GastosPageInner() {
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

  // Combobox open state
  const [openCategoria, setOpenCategoria] = useState(false);
  const [openTipoPagto, setOpenTipoPagto] = useState(false);
  const [openForma, setOpenForma] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  // Detail sheet
  const [detailGasto, setDetailGasto] = useState<Gasto | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditingGasto(null);
      setDialogOpen(true);
      router.replace("/gastos");
    }
  }, [searchParams, router]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Gasto | null>(null);

  useEffect(() => {
    if (categoriasFetched.current) return;
    categoriasFetched.current = true;
    api
      .get<{ data: Categoria[] }>("/categorias?tipo=gasto&limit=200")
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
    <PageShell contentClassName="space-y-5">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        {/* top rose accent line */}
        <div className="h-px w-full bg-gradient-to-r from-rose-500/60 via-rose-400/20 to-transparent" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: title block */}
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-400/30">
              <TrendingDown className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="font-display text-4xl leading-none tracking-wide text-white sm:text-5xl">
                GASTOS
              </h1>
              <p className="mt-0.5 text-[12px] text-white/40">
                {total} {total === 1 ? "registro" : "registros"}
                {periodoMode === "mes" && (
                  <span className="ml-1.5 capitalize text-rose-400/70">
                    · {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
                  </span>
                )}
                {periodoMode === "todos" && (
                  <span className="ml-1.5 text-white/30">· todos os períodos</span>
                )}
              </p>
            </div>
          </div>

          {/* Right: period nav + CTA */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month navigator */}
            <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
              <button
                className="flex h-9 w-9 items-center justify-center border-r border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
                aria-label="Mês anterior"
                onClick={() => { setPeriodoMode("mes"); setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPeriodoMode((prev) => prev === "todos" ? "mes" : "todos")}
                className="flex h-9 min-w-[140px] items-center justify-center px-3 transition-colors hover:bg-white/[0.04] focus-visible:outline-none"
              >
                {periodoMode === "todos" ? (
                  <span className="text-xs text-white/35">Todos os meses</span>
                ) : (
                  <span className="text-sm font-semibold capitalize text-white/80">
                    {format(mesAtual, "MMM yyyy", { locale: ptBR })}
                  </span>
                )}
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center border-l border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
                aria-label="Próximo mês"
                onClick={() => { setPeriodoMode("mes"); setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={() => { setEditingGasto(null); setDialogOpen(true); }}
              variant="default"
              className="h-9"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Gasto
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 ui-stagger">
        {/* Total Gastos */}
        <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
          <p className="ds-label text-white/35">Total gastos</p>
          {loadingSummary ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-1.5 font-display text-3xl leading-none ds-numeric text-rose-400">
              {formatBRL(summary?.total_gastos ?? 0)}
            </p>
          )}
        </div>

        {/* Total Renda */}
        <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
          <p className="ds-label text-white/35">Total renda</p>
          {loadingSummary ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-1.5 font-display text-3xl leading-none ds-numeric text-white/70">
              {formatBRL(summary?.total_renda ?? 0)}
            </p>
          )}
        </div>

        {/* Saldo */}
        <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
          <p className="ds-label text-white/35">Saldo do período</p>
          {loadingSummary ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className={`mt-1.5 font-display text-3xl leading-none ds-numeric ${(summary?.diferenca ?? 0) >= 0 ? "text-white/70" : "text-amber-400"}`}>
              {formatBRL(summary?.diferenca ?? 0)}
            </p>
          )}
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        {/* Row 1: search + period */}
        <div className="flex items-center gap-2 border-b border-white/[0.07] p-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Buscar por descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute inset-y-0 right-2.5 flex items-center text-white/30 hover:text-white/70">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setPeriodoMode((prev) => prev === "custom" ? "mes" : "custom")}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
              periodoMode === "custom"
                ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
                : "border-white/10 bg-white/[0.04] text-white/45 hover:text-white/70"
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Período</span>
          </button>

          {periodoMode === "custom" && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <Input type="date" className="h-7 w-32 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} />
              <span className="text-xs text-white/30">→</span>
              <Input type="date" className="h-7 w-32 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} />
            </div>
          )}

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/35 transition-colors hover:text-rose-400">
              <FilterX className="h-3 w-3" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>

        {/* Row 2: combobox filters — always horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto p-3 scrollbar-none">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-white/25" />

          {/* Categoria */}
          <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
            <PopoverTrigger asChild>
              <button className={`flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-all ${filterCategoria ? "border-rose-400/40 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white/80"}`}>
                {filterCategoria ? (categorias.find(c => String(c.id) === filterCategoria)?.nome ?? "Categoria") : "Categoria"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar categoria..." />
                <CommandList>
                  <CommandEmpty>Nenhuma categoria.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="todas" onSelect={() => { setFilterCategoria(""); setOpenCategoria(false); }}>
                      <Check className={`mr-2 h-3.5 w-3.5 ${!filterCategoria ? "opacity-100" : "opacity-0"}`} />
                      Todas
                    </CommandItem>
                    {categorias.map((c) => (
                      <CommandItem key={c.id} value={c.nome} onSelect={() => { setFilterCategoria(String(c.id)); setOpenCategoria(false); }}>
                        <Check className={`mr-2 h-3.5 w-3.5 ${filterCategoria === String(c.id) ? "opacity-100" : "opacity-0"}`} />
                        <span className="mr-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.cor ?? "#94a3b8" }} />
                        {c.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Modalidade */}
          <Popover open={openTipoPagto} onOpenChange={setOpenTipoPagto}>
            <PopoverTrigger asChild>
              <button className={`flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-all ${filterTipoPagto ? "border-rose-400/40 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white/80"}`}>
                {filterTipoPagto === "a_vista" ? "À vista" : filterTipoPagto === "parcelado" ? "A prazo" : "Modalidade"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar..." />
                <CommandList>
                  <CommandEmpty>Sem resultado.</CommandEmpty>
                  <CommandGroup>
                    {[
                      { value: "", label: "Todas" },
                      { value: "a_vista", label: "À vista" },
                      { value: "parcelado", label: "A prazo" },
                    ].map((opt) => (
                      <CommandItem key={opt.value || "todos"} value={opt.label} onSelect={() => { setFilterTipoPagto(opt.value); setOpenTipoPagto(false); }}>
                        <Check className={`mr-2 h-3.5 w-3.5 ${filterTipoPagto === opt.value ? "opacity-100" : "opacity-0"}`} />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Pagamento */}
          <Popover open={openForma} onOpenChange={setOpenForma}>
            <PopoverTrigger asChild>
              <button className={`flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-all ${filterForma ? "border-rose-400/40 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white/80"}`}>
                {filterForma ? (formaLabels[filterForma] ?? filterForma) : "Pagamento"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar forma..." />
                <CommandList>
                  <CommandEmpty>Sem resultado.</CommandEmpty>
                  <CommandGroup>
                    {[
                      { value: "", label: "Todas" },
                      { value: "dinheiro", label: "Dinheiro" },
                      { value: "cartao_credito", label: "Crédito" },
                      { value: "cartao_debito", label: "Débito" },
                      { value: "pix", label: "Pix" },
                      { value: "transferencia", label: "Transferência" },
                      { value: "outro", label: "Outro" },
                    ].map((opt) => (
                      <CommandItem key={opt.value || "todos"} value={opt.label} onSelect={() => { setFilterForma(opt.value); setOpenForma(false); }}>
                        <Check className={`mr-2 h-3.5 w-3.5 ${filterForma === opt.value ? "opacity-100" : "opacity-0"}`} />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Status */}
          <Popover open={openStatus} onOpenChange={setOpenStatus}>
            <PopoverTrigger asChild>
              <button className={`flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-all ${filterStatus ? "border-rose-400/40 bg-rose-500/10 text-rose-300" : "border-white/10 bg-white/[0.04] text-white/55 hover:text-white/80"}`}>
                {filterStatus ? (statusConfig[filterStatus]?.label ?? filterStatus) : "Status"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar status..." />
                <CommandList>
                  <CommandEmpty>Sem resultado.</CommandEmpty>
                  <CommandGroup>
                    {[
                      { value: "", label: "Todos" },
                      { value: "pendente", label: "Pendente" },
                      { value: "pago", label: "Pago" },
                      { value: "cancelado", label: "Cancelado" },
                    ].map((opt) => (
                      <CommandItem key={opt.value || "todos"} value={opt.label} onSelect={() => { setFilterStatus(opt.value); setOpenStatus(false); }}>
                        <Check className={`mr-2 h-3.5 w-3.5 ${filterStatus === opt.value ? "opacity-100" : "opacity-0"}`} />
                        {opt.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] px-3 pb-3">
            {activeChips.map((chip) => (
              <span key={chip.key} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/60">
                {chip.label}
                <button onClick={chip.onRemove} className="ml-0.5 text-white/30 hover:text-rose-400">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Mini stats strip ────────────────────────────────── */}
      {!loading && !loadError && displayedGastos.length > 0 && (
        <div className="flex flex-wrap gap-3 ui-stagger">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs">
            <span className="text-white/40">Exibindo</span>
            <span className="font-semibold text-white">{displayedGastos.length}</span>
            <span className="text-white/25">de {total}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs">
            <span className="text-white/40">Total</span>
            <span className="font-semibold tabular-nums text-rose-400">{formatBRL(totalExibido)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-xs">
            <span className="text-white/40">Ticket médio</span>
            <span className="font-semibold tabular-nums text-white/70">{formatBRL(ticketMedio)}</span>
          </div>
          {pendentesExibidos > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] px-3.5 py-2 text-xs">
              <Clock className="h-3 w-3 text-amber-400" />
              <span className="font-semibold text-amber-300">{pendentesExibidos} pendente{pendentesExibidos > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Table / List ───────────────────────────────────── */}
      {loading ? (
        <>
          {/* mobile skeleton */}
          <div className="sm:hidden space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
          {/* desktop skeleton */}
          <div className="hidden sm:block rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/[0.07] hover:bg-transparent">
                    {["Descrição","Data","Categoria","Pagamento","Status","Valor",""].map((h, i) => (
                      <TableHead key={i} className="text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-white/[0.04]">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : loadError ? (
        <PageDataState mode="error" icon={AlertTriangle} title="Não foi possível carregar os gastos" description="Verifique sua conexão e tente novamente." onAction={fetchGastos} />
      ) : displayedGastos.length === 0 ? (
        <PageDataState mode="empty" icon={Receipt} title="Nenhum gasto encontrado" description="Ajuste os filtros ou cadastre um novo gasto." />
      ) : (
        <>
          {/* ── Mobile list ── */}
          <div className="sm:hidden space-y-2">
            {displayedGastos.map((g) => (
              <GastoMobileCard
                key={g.id}
                gasto={g}
                onEdit={() => setDetailGasto(g)}
                onDelete={() => setDeleteTarget(g)}
              />
            ))}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/[0.07] hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">Descrição</TableHead>
                    <TableHead className="text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">Data</TableHead>
                    <TableHead className="hidden md:table-cell text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">Categoria</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">Pagamento</TableHead>
                    <TableHead className="text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">Status</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-white/30 uppercase tracking-[0.08em]">Valor</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody className="ui-stagger-rows">
                  {displayedGastos.map((g) => {
                    const statusInfo = statusConfig[g.status] ?? { label: g.status, variant: "slate" as const };
                    return (
                      <TableRow key={g.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] cursor-pointer" onClick={() => setDetailGasto(g)}>
                        <TableCell className="max-w-[180px]">
                          <span className="block truncate font-medium text-white/90">{g.descricao}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-white/40">
                          {formatDate(g.data_gasto)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {g.categoria_nome ? (
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: g.categoria_cor ?? "#94a3b8" }} />
                              <span className="text-sm text-white/55">{g.categoria_nome}</span>
                            </div>
                          ) : (
                            <span className="text-white/25">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-sm text-white/50">
                              {getFormaIcon(g.forma_pagamento, "h-3 w-3")}
                              <span>{formaPagtoLabel(g.forma_pagamento, g.tipo_pagamento)}</span>
                            </div>
                            {g.cartao_apelido && (
                              <CartaoChip
                                apelido={g.cartao_apelido}
                                bandeira={g.cartao_bandeira}
                                cor={g.cartao_cor}
                              />
                            )}
                            {g.tipo_pagamento === "parcelado" && (
                              <span className="inline-flex w-fit items-center gap-px rounded-full border border-white/10 bg-white/[0.06] px-2 py-px text-[10px] text-white/50">
                                <span className="font-semibold text-white/70">{g.numero_parcela ?? 1}</span>
                                <span className="mx-px text-white/25">/</span>
                                <span>{g.quantidade_parcelas}</span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {getStatusIcon(g.status, "h-3 w-3")}
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-rose-400/90">
                          {formatBRL(Number(g.valor_total))}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-white/25 hover:text-white/80 hover:bg-white/[0.06]"
                              onClick={(e) => { e.stopPropagation(); setEditingGasto(g); setDialogOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-white/25 hover:text-rose-400 hover:bg-rose-500/10"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(g); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-white/35">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" disabled={page <= 1}
              className="h-8 border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
              onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" disabled={page >= totalPages}
              className="h-8 border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
              onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      <GastoDetailSheet
        gasto={detailGasto}
        onClose={() => setDetailGasto(null)}
        onEdit={(g) => { setDetailGasto(null); setEditingGasto(g); setDialogOpen(true); }}
        onDelete={(g) => { setDetailGasto(null); setDeleteTarget(g); }}
      />

      {/* Dialogs */}
      <GastoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchGastos(); fetchSummary(); }}
        gasto={editingGasto}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>&quot;{deleteTarget?.descricao}&quot;</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function GastoDetailSheet({
  gasto: g,
  onClose,
  onEdit,
  onDelete,
}: {
  gasto: Gasto | null;
  onClose: () => void;
  onEdit: (g: Gasto) => void;
  onDelete: (g: Gasto) => void;
}) {
  const statusInfo = g ? (statusConfig[g.status] ?? { label: g.status, variant: "slate" as const }) : null;
  const isCard = g ? (g.forma_pagamento === "cartao_credito" || g.forma_pagamento === "cartao_debito") : false;

  return (
    <Dialog open={!!g} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 flex flex-col gap-0 max-w-sm overflow-hidden max-h-[90vh]">
        {g && statusInfo && (
          <>
            {/* Header */}
            <div className="px-5 pt-6 pb-4 border-b border-white/[0.07]">
              <div className="flex items-start gap-3 pr-6">
                {g.categoria_cor && (
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: g.categoria_cor }} />
                )}
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold text-white leading-snug">
                    {g.descricao}
                  </DialogTitle>
                  <p className="mt-0.5 text-xs text-white/40">{formatDate(g.data_gasto)}</p>
                </div>
              </div>

              <p className="mt-4 text-4xl font-bold tabular-nums text-rose-400 leading-none">
                {formatBRL(Number(g.valor_total))}
              </p>

              <div className="mt-3">
                <Badge variant={statusInfo.variant} className="text-xs px-2.5 py-1">
                  {getStatusIcon(g.status, "h-3.5 w-3.5")}
                  {statusInfo.label}
                </Badge>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {isCard && g.cartao_apelido && (
                <Row label="Cartão">
                  <CartaoMiniDetail
                    apelido={g.cartao_apelido}
                    bandeira={g.cartao_bandeira}
                    cor={g.cartao_cor}
                    ultimos4={g.cartao_ultimos_4_digitos}
                  />
                </Row>
              )}

              <Row label="Forma de pagamento">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  {getFormaIcon(g.forma_pagamento, "h-4 w-4")}
                  <span>{formaPagtoLabel(g.forma_pagamento, g.tipo_pagamento)}</span>
                </div>
              </Row>

              {g.tipo_pagamento === "parcelado" && (
                <Row label="Parcelamento">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-3 py-1.5 text-sm text-amber-300">
                    <Zap className="h-3.5 w-3.5" />
                    Parcela <strong>{g.numero_parcela ?? 1}</strong> de <strong>{g.quantidade_parcelas}</strong>
                  </span>
                </Row>
              )}

              {g.categoria_nome && (
                <Row label="Categoria">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: g.categoria_cor ?? "#94a3b8" }} />
                    <span className="text-sm text-white/60">
                      {g.categoria_icone ? `${g.categoria_icone} ` : ""}{g.categoria_nome}
                    </span>
                  </div>
                </Row>
              )}

              {g.observacoes && (
                <Row label="Observações">
                  <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    {g.observacoes}
                  </p>
                </Row>
              )}

              {g.gasto_origem_id && (
                <div className="flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-2.5">
                  <Repeat className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-300/80">Gerado automaticamente por assinatura recorrente</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.03] px-5 py-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 flex-1"
                onClick={() => onDelete(g)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir
              </Button>
              <Button size="sm" className="flex-1" onClick={() => onEdit(g)}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Editar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GastoMobileCard({
  gasto: g,
  onEdit,
  onDelete,
}: {
  gasto: Gasto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const moved = useRef(false);
  const THRESHOLD = 72;

  const statusInfo = statusConfig[g.status] ?? { label: g.status, variant: "slate" as const };
  const revealRatio = Math.min(1, Math.abs(offsetX) / THRESHOLD);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    moved.current = false;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - startX.current;
    if (delta < 0) {
      moved.current = true;
      setOffsetX(Math.max(delta, -110));
    }
  }

  function onTouchEnd() {
    setDragging(false);
    if (offsetX < -THRESHOLD) {
      onDelete();
    }
    setOffsetX(0);
  }

  function handleClick() {
    if (moved.current) return;
    onEdit();
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* delete strip revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center gap-1.5 bg-rose-500"
        style={{ width: `${Math.abs(offsetX)}px`, opacity: revealRatio }}
      >
        <Trash2 className="h-4 w-4 shrink-0 text-white" />
        {Math.abs(offsetX) > 52 && (
          <span className="text-xs font-semibold text-white whitespace-nowrap">Excluir</span>
        )}
      </div>

      {/* swipeable card */}
      <div
        className="relative z-10 flex gap-3 rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3.5 backdrop-blur-xl active:bg-white/[0.07] select-none"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        {/* categoria color bar */}
        <div
          className="w-1 shrink-0 self-stretch rounded-full"
          style={{ backgroundColor: g.categoria_cor ?? "#94a3b8" }}
        />

        {/* main info */}
        <div className="min-w-0 flex-1">
          {/* Row 1: description + valor */}
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white/90">{g.descricao}</p>
            <span className="shrink-0 font-bold tabular-nums text-rose-400 text-sm leading-none">
              {formatBRL(Number(g.valor_total))}
            </span>
          </div>

          {/* Row 2: date + forma + parcelas */}
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-white/40">
            <span>{formatDate(g.data_gasto)}</span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1">
              {getFormaIcon(g.forma_pagamento, "h-3 w-3")}
              {formaPagtoLabel(g.forma_pagamento, g.tipo_pagamento)}
            </span>
            {g.tipo_pagamento === "parcelado" && g.quantidade_parcelas && (
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-px text-[10px]">
                {g.numero_parcela ?? 1}/{g.quantidade_parcelas}x
              </span>
            )}
          </div>

          {/* Row 3: cartão */}
          {g.cartao_apelido && (
            <div className="mt-1">
              <CartaoChip
                apelido={g.cartao_apelido}
                bandeira={g.cartao_bandeira}
                cor={g.cartao_cor}
              />
            </div>
          )}

          {/* Row 4: categoria */}
          {g.categoria_nome && (
            <div className="mt-1 flex items-center gap-1.5">
              {g.categoria_cor && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: g.categoria_cor }} />
              )}
              <span className="text-[10px] text-white/35">{g.categoria_nome}</span>
            </div>
          )}

          {/* Row 5: status */}
          <div className="mt-2">
            <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
              {getStatusIcon(g.status, "h-2.5 w-2.5")}
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
