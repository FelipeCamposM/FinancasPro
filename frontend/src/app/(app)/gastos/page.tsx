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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GastoDialog } from "./GastoDialog";
import { ImportGastosDialog } from "./ImportGastosDialog";
import { fetchPreferencias, usePreferencias } from "@/lib/preferencias";
import { useMesSugerido, mesRefParaDate } from "@/lib/mes-sugerido";
import { FaturaDetailDialog } from "./FaturaDetailDialog";
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
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Layers,
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

interface CartaoFatura {
  id: string;
  apelido: string;
  tipo: string;
  cor: string;
  bandeira: string;
  ultimos_4_digitos: string;
  dia_fechamento?: number;
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
    // Append time to avoid UTC-to-local offset shifting the date one day back
    const normalized = date.includes("T") ? date : `${date}T12:00:00`;
    return format(new Date(normalized), "dd/MM/yyyy", { locale: ptBR });
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

const MONTH_LABELS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function FaturaMonthPicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(value.getFullYear());

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setPickerYear(value.getFullYear()); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-md px-2 py-0.5 text-sm font-semibold capitalize text-blue-300 transition-colors hover:bg-blue-500/10"
        >
          {format(value, "MMMM yyyy", { locale: ptBR })}
        </button>
      </PopoverTrigger>
      <PopoverContent className="ui-popover w-56 p-3 ui-glass-surface-strong border-white/[0.14]" align="start">
        {/* Year nav */}
        <div className="mb-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPickerYear((y) => y - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-white">{pickerYear}</span>
          <button
            type="button"
            onClick={() => setPickerYear((y) => y + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS_SHORT.map((label, i) => {
            const isSelected = value.getFullYear() === pickerYear && value.getMonth() === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => { onChange(new Date(pickerYear, i, 1)); setOpen(false); }}
                className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-blue-500/30 text-blue-300 ring-1 ring-blue-400/40"
                    : "text-white/55 hover:bg-white/10 hover:text-white/90"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type SortField =
  | "data"
  | "descricao"
  | "categoria"
  | "status"
  | "pagamento"
  | "valor";

const SORT_LABELS: Record<SortField, string> = {
  data: "Data",
  descricao: "Descrição",
  categoria: "Categoria",
  status: "Status",
  pagamento: "Pagamento",
  valor: "Valor",
};

function SortableHead({
  campo,
  sortBy,
  sortOrder,
  onSort,
  className = "",
  align = "left",
}: {
  campo: SortField;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  onSort: (c: SortField) => void;
  className?: string;
  align?: "left" | "right";
}) {
  const ativo = sortBy === campo;
  return (
    <TableHead className={`text-xs font-semibold uppercase tracking-[0.08em] ${ativo ? "text-white/70" : "text-white/30"} ${align === "right" ? "text-right" : ""} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(campo)}
        aria-label={`Ordenar por ${SORT_LABELS[campo]}`}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.08em] transition-colors hover:text-white ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {SORT_LABELS[campo]}
        {ativo ? (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function GastosPageInner() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const prefs = usePreferencias();
  const [importOpen, setImportOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>("data");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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

  // Cartões de crédito para fatura picker
  const [creditCartoes, setCreditCartoes] = useState<CartaoFatura[]>([]);
  const cartoesFetched = useRef(false);

  // Month/year picker para navegador de mês
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  // Fatura
  const [faturaPickerOpen, setFaturaPickerOpen] = useState(false);
  const [faturaNavMes, setFaturaNavMes] = useState<Date>(() => new Date());
  const [faturaCartaoId, setFaturaCartaoId] = useState<string | null>(null);
  const [faturaCartaoApelido, setFaturaCartaoApelido] = useState<string>("");
  const [faturaMes, setFaturaMes] = useState<string>("");

  // Filtros
  const [search, setSearch] = useState("");
  // Busca vai ao backend (todas as páginas) — atrasada para não disparar por tecla
  const [searchQuery, setSearchQuery] = useState("");
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
  // Ordenação e período padrão configurados pelo usuário
  const padroesAplicados = useRef(false);
  useEffect(() => {
    if (padroesAplicados.current) return;
    padroesAplicados.current = true;
    fetchPreferencias().then((prefs) => {
      setSortBy(prefs.ordenacao_gastos.campo);
      setSortOrder(prefs.ordenacao_gastos.direcao);
      if (prefs.periodo_padrao === "todos") setPeriodoMode("todos");
    });
  }, []);

  // Enquanto a fatura do mês anterior não fecha, a página abre nele
  useMesSugerido((mesRef) => {
    setPeriodoMode("mes");
    setMesAtual(mesRefParaDate(mesRef));
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

  useEffect(() => {
    if (cartoesFetched.current) return;
    cartoesFetched.current = true;
    api
      .get<{ data: CartaoFatura[] }>("/cartoes?limit=50")
      .then(({ data }) => {
        const credit = (data.data ?? []).filter(
          (c) => c.tipo === "credito" || c.tipo === "credito_debito",
        );
        setCreditCartoes(credit);
      })
      .catch(() => {});
  }, []);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(prefs.itens_por_pagina),
        sort: sortBy,
        order: sortOrder,
      });
      if (searchQuery) params.set("search", searchQuery);
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
    prefs.itens_por_pagina,
    sortBy,
    sortOrder,
    searchQuery,
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
    searchQuery,
    filterStatus,
    filterForma,
    filterCategoria,
    filterTipoPagto,
    periodoMode,
    mesAtual,
    filterDataInicio,
    filterDataFim,
  ]);

  // Debounce da busca: só consulta o backend depois que o usuário para de digitar
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

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

  /** Alterna direção quando é o mesmo campo; troca de campo começa em desc. */
  function ordenarPor(campo: SortField) {
    if (campo === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(campo);
      setSortOrder("desc");
    }
    setPage(1);
  }

  // Busca é feita no backend (todas as páginas), não localmente
  const displayedGastos = gastos;

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
  const ticketMedio = displayedGastos.length
    ? totalExibido / displayedGastos.length
    : 0;

  return (
    <PageShell contentClassName="space-y-5">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        {/* top rose accent line */}
        <div className="h-px w-full bg-gradient-to-r from-rose-500/60 via-rose-400/20 to-transparent" />
        <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          {/* Left: title block */}
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:justify-start sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-400/30">
              <TrendingDown className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0">
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {/* Month navigator */}
            <div className="flex w-full items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] sm:w-auto">
              <button
                className="flex h-9 w-9 items-center justify-center border-r border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
                aria-label="Mês anterior"
                onClick={() => { setPeriodoMode("mes"); setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <Popover
                open={monthPickerOpen}
                onOpenChange={(v) => {
                  setMonthPickerOpen(v);
                  if (v) setPickerYear(mesAtual.getFullYear());
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 min-w-0 flex-1 items-center justify-center px-3 transition-colors hover:bg-white/[0.04] focus-visible:outline-none sm:min-w-[140px]"
                  >
                    {periodoMode === "todos" ? (
                      <span className="text-xs text-white/35">Todos os meses</span>
                    ) : (
                      <span className="text-sm font-semibold capitalize text-white/80">
                        {format(mesAtual, "MMM yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="ui-popover w-56 p-3 ui-glass-surface-strong border-white/[0.14]"
                  align="center"
                >
                  {/* Year nav */}
                  <div className="mb-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-bold text-white">{pickerYear}</span>
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-1">
                    {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((label, i) => {
                      const isSelected = periodoMode === "mes" && mesAtual.getFullYear() === pickerYear && mesAtual.getMonth() === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setMesAtual(new Date(pickerYear, i, 1));
                            setPeriodoMode("mes");
                            setMonthPickerOpen(false);
                          }}
                          className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-rose-500/30 text-rose-300 ring-1 ring-rose-400/40"
                              : "text-white/55 hover:bg-white/10 hover:text-white/90"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Todos */}
                  <div className="mt-2 border-t border-white/[0.07] pt-2">
                    <button
                      type="button"
                      onClick={() => { setPeriodoMode("todos"); setMonthPickerOpen(false); }}
                      className={`w-full rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        periodoMode === "todos"
                          ? "bg-white/10 text-white/80"
                          : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                      }`}
                    >
                      Todos os meses
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <button
                className="flex h-9 w-9 items-center justify-center border-l border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
                aria-label="Próximo mês"
                onClick={() => { setPeriodoMode("mes"); setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Ações: empilhadas no mobile; no desktop o `contents` dissolve o
                wrapper e os botões voltam a ser filhos diretos do flex */}
            <div className="flex w-full flex-col gap-2 sm:contents">
              {creditCartoes.length > 0 && (
                <Button
                  onClick={() => setFaturaPickerOpen(true)}
                  className="h-10 w-full rounded-xl border border-blue-300/30 bg-gradient-to-br from-blue-500/90 via-blue-500/75 to-blue-700/90 px-4 text-white shadow-lg shadow-blue-950/25 ring-1 ring-white/[0.10] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200/50 hover:from-blue-400/95 hover:via-blue-500/85 hover:to-blue-600/95 hover:shadow-blue-500/20 sm:w-auto"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Fatura do Mês
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="h-10 w-full rounded-xl border-white/15 bg-white/[0.05] px-4 text-white/80 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.1] hover:text-white sm:w-auto"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <Button
                onClick={() => { setEditingGasto(null); setDialogOpen(true); }}
                className="h-10 w-full rounded-xl border border-rose-300/30 bg-gradient-to-br from-rose-500/90 via-rose-500/75 to-rose-700/90 px-4 text-white shadow-lg shadow-rose-950/25 ring-1 ring-white/[0.10] transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-200/50 hover:from-rose-400/95 hover:via-rose-500/85 hover:to-rose-600/95 hover:shadow-rose-500/20 sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Gasto
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 ui-stagger">
        {/* Total Gastos */}
        <div className="group relative overflow-hidden rounded-xl border border-rose-300/25 bg-gradient-to-br from-rose-500/[0.24] via-white/[0.075] to-rose-950/35 p-4 shadow-lg shadow-rose-950/20 ring-1 ring-white/[0.08] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-rose-300/45 hover:bg-rose-500/[0.18] hover:shadow-rose-500/15">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-200/80 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-rose-300/[0.16] blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-100/75">Total Gastos</p>
              {loadingSummary ? (
                <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
              ) : (
                <>
                  <p className="mt-1.5 font-display text-3xl leading-none tabular-nums text-rose-100 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    {formatBRL(summary?.total_gastos ?? 0)}
                  </p>
                  {summary && summary.total_renda > 0 && (
                    <p className="mt-2 inline-flex rounded-full border border-rose-200/20 bg-rose-950/25 px-2 py-0.5 text-[11px] font-medium text-rose-100/75">
                      {((summary.total_gastos / summary.total_renda) * 100).toFixed(0)}% da renda
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="shrink-0 rounded-xl border border-rose-200/25 bg-rose-300/15 p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <TrendingDown className="h-5 w-5 text-rose-100" />
            </div>
          </div>
        </div>

        {/* Total Renda */}
        <div className="group relative overflow-hidden rounded-xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/[0.22] via-white/[0.075] to-emerald-950/35 p-4 shadow-lg shadow-emerald-950/20 ring-1 ring-white/[0.08] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-300/45 hover:bg-emerald-500/[0.18] hover:shadow-emerald-500/15">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/80 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-300/[0.14] blur-2xl transition-transform duration-500 group-hover:scale-125" />
          <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100/75">Total Renda</p>
              {loadingSummary ? (
                <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
              ) : (
                <>
                  <p className="mt-1.5 font-display text-3xl leading-none tabular-nums text-emerald-100 drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    {formatBRL(summary?.total_renda ?? 0)}
                  </p>
                  {summary && (
                    <p className="mt-2 inline-flex rounded-full border border-emerald-200/20 bg-emerald-950/25 px-2 py-0.5 text-[11px] font-medium text-emerald-100/75">
                      {summary.diferenca >= 0
                        ? `${formatBRL(summary.diferenca)} disponível`
                        : `${formatBRL(Math.abs(summary.diferenca))} a descoberto`}
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="shrink-0 rounded-xl border border-emerald-200/25 bg-emerald-300/15 p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <TrendingUp className="h-5 w-5 text-emerald-100" />
            </div>
          </div>
        </div>

        {/* Saldo */}
        {(() => {
          const positivo = (summary?.diferenca ?? 0) >= 0;
          const pct =
            summary && summary.total_renda > 0
              ? ((Math.abs(summary.diferenca) / summary.total_renda) * 100).toFixed(0)
              : null;
          return (
            <div
              className={`group relative overflow-hidden rounded-xl border p-4 shadow-lg ring-1 ring-white/[0.08] backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 ${
                positivo
                  ? "border-blue-300/25 bg-gradient-to-br from-blue-500/[0.22] via-white/[0.075] to-blue-950/35 shadow-blue-950/20 hover:border-blue-300/45 hover:bg-blue-500/[0.18] hover:shadow-blue-500/15"
                  : "border-amber-300/25 bg-gradient-to-br from-amber-500/[0.22] via-white/[0.075] to-amber-950/35 shadow-amber-950/20 hover:border-amber-300/45 hover:bg-amber-500/[0.18] hover:shadow-amber-500/15"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${positivo ? "via-blue-200/80" : "via-amber-200/80"} to-transparent`}
              />
              <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125 ${positivo ? "bg-blue-300/[0.14]" : "bg-amber-300/[0.16]"}`} />
              <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[0.12em] ${positivo ? "text-blue-100/75" : "text-amber-100/75"}`}
                  >
                    Saldo do Período
                  </p>
                  {loadingSummary ? (
                    <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
                  ) : (
                    <>
                      <p
                        className={`mt-1.5 font-display text-3xl leading-none tabular-nums drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5 ${positivo ? "text-blue-100" : "text-amber-100"}`}
                      >
                        {formatBRL(summary?.diferenca ?? 0)}
                      </p>
                      {pct && (
                        <p
                          className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${positivo ? "border-blue-200/20 bg-blue-950/25 text-blue-100/75" : "border-amber-200/20 bg-amber-950/25 text-amber-100/75"}`}
                        >
                          {pct}% {positivo ? "poupado" : "a descoberto"}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div
                  className={`shrink-0 rounded-xl border p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${positivo ? "border-blue-200/25 bg-blue-300/15" : "border-amber-200/25 bg-amber-300/15"}`}
                >
                  <Wallet
                    className={`h-5 w-5 ${positivo ? "text-blue-100" : "text-amber-100"}`}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        {/* Row 1: search + period */}
        <div className="flex items-center gap-2 border-b border-white/[0.07] p-3">
          {/* Busca: superfície de vidro que acende ao focar */}
          <div className="group relative flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-rose-500/0 via-rose-500/20 to-blue-500/0 opacity-0 blur-[6px] transition-opacity duration-300 group-focus-within:opacity-100"
            />
            <div className="relative flex h-11 items-center gap-2.5 rounded-2xl border border-white/[0.10] bg-[hsl(222_47%_10%/0.65)] px-3.5 shadow-[0_10px_26px_-16px_rgba(2,6,23,0.9)] backdrop-blur-xl transition-colors duration-200 group-focus-within:border-rose-300/35 group-hover:border-white/20">
              <Search className="h-4 w-4 shrink-0 text-white/35 transition-colors group-focus-within:text-rose-300" />
              <input
                type="search"
                inputMode="search"
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar gastos por descrição"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-0 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setPeriodoMode((prev) => prev === "custom" ? "mes" : "custom")}
            aria-pressed={periodoMode === "custom"}
            className={`flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 text-xs font-semibold backdrop-blur-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
              periodoMode === "custom"
                ? "border-rose-300/40 bg-rose-500/15 text-rose-200 shadow-[0_10px_26px_-16px_rgba(244,63,94,0.8)]"
                : "border-white/[0.10] bg-[hsl(222_47%_10%/0.65)] text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            <CalendarRange className="h-4 w-4" />
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

        {/* Row 2: filtros — quebram de linha em vez de esconder em scroll */}
        <div className="flex flex-wrap items-center gap-2 p-3">
          <span className="flex items-center gap-1.5 pr-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/25">
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Filtros
          </span>

          {/* Categoria */}
          <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
            <PopoverTrigger asChild>
              <button className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium backdrop-blur-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${filterCategoria ? "border-rose-300/40 bg-rose-500/15 text-rose-200 shadow-[0_10px_24px_-16px_rgba(244,63,94,0.9)]" : "border-white/[0.10] bg-[hsl(222_47%_10%/0.6)] text-white/55 hover:border-white/20 hover:text-white/85"}`}>
                <Tag className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                {filterCategoria ? (categorias.find(c => String(c.id) === filterCategoria)?.nome ?? "Categoria") : "Categoria"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="select-bounce-content w-52 p-0" align="start">
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
              <button className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium backdrop-blur-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${filterTipoPagto ? "border-rose-300/40 bg-rose-500/15 text-rose-200 shadow-[0_10px_24px_-16px_rgba(244,63,94,0.9)]" : "border-white/[0.10] bg-[hsl(222_47%_10%/0.6)] text-white/55 hover:border-white/20 hover:text-white/85"}`}>
                <Layers className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                {filterTipoPagto === "a_vista" ? "À vista" : filterTipoPagto === "parcelado" ? "A prazo" : "Modalidade"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="select-bounce-content w-44 p-0" align="start">
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
              <button className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium backdrop-blur-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${filterForma ? "border-rose-300/40 bg-rose-500/15 text-rose-200 shadow-[0_10px_24px_-16px_rgba(244,63,94,0.9)]" : "border-white/[0.10] bg-[hsl(222_47%_10%/0.6)] text-white/55 hover:border-white/20 hover:text-white/85"}`}>
                <Wallet className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                {filterForma ? (formaLabels[filterForma] ?? filterForma) : "Pagamento"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="select-bounce-content w-48 p-0" align="start">
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
              <button className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium backdrop-blur-xl transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${filterStatus ? "border-rose-300/40 bg-rose-500/15 text-rose-200 shadow-[0_10px_24px_-16px_rgba(244,63,94,0.9)]" : "border-white/[0.10] bg-[hsl(222_47%_10%/0.6)] text-white/55 hover:border-white/20 hover:text-white/85"}`}>
                <CircleCheck className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                {filterStatus ? (statusConfig[filterStatus]?.label ?? filterStatus) : "Status"}
                <ChevronsUpDown className="h-3 w-3 opacity-40" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="select-bounce-content w-40 p-0" align="start">
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
              <span key={chip.key} className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-0.5 text-xs text-rose-300/80">
                {chip.label}
                <button onClick={chip.onRemove} className="ml-0.5 text-rose-300/40 hover:text-rose-400">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Mini stats strip ──────────────────────────────────
          Mobile: Exibindo e Total lado a lado (ticket médio fica só no desktop).
          Cada card acende na própria cor — ver .ui-stat-neon no globals.css. */}
      {!loading && !loadError && displayedGastos.length > 0 && (
        <div className="ui-stagger grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {[
            {
              rotulo: "Exibindo",
              valor: String(displayedGastos.length),
              apoio: `de ${total}`,
              Icon: Receipt,
              cor: "#7dd3fc",
              texto: "text-sky-200",
              anel: "border-sky-300/25 bg-sky-500/[0.12]",
              soDesktop: false,
            },
            {
              rotulo: "Total",
              valor: formatBRL(totalExibido),
              apoio: null,
              Icon: TrendingDown,
              cor: "#fda4af",
              texto: "text-rose-200",
              anel: "border-rose-300/25 bg-rose-500/[0.12]",
              soDesktop: false,
            },
            {
              rotulo: "Ticket médio",
              valor: formatBRL(ticketMedio),
              apoio: null,
              Icon: Wallet,
              cor: "#c4b5fd",
              texto: "text-violet-200",
              anel: "border-violet-300/25 bg-violet-500/[0.12]",
              soDesktop: true,
            },
          ].map(({ rotulo, valor, apoio, Icon, cor, texto, anel, soDesktop }) => (
            <div
              key={rotulo}
              style={{ "--cor-stat": cor } as React.CSSProperties}
              className={`ui-stat-neon flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.09] bg-[hsl(222_47%_10%/0.65)] px-3.5 py-3 backdrop-blur-xl sm:px-4 ${
                soDesktop ? "hidden sm:flex" : "flex"
              }`}
            >
              <div
                className={`ui-stat-icone flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${anel}`}
              >
                <Icon className={`h-4 w-4 ${texto}`} aria-hidden="true" />
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                  {rotulo}
                </p>
                <p className="mt-0.5 flex items-baseline gap-1.5">
                  <span
                    className={`truncate text-[17px] font-bold leading-none tabular-nums ${texto}`}
                    style={{ textShadow: `0 0 14px ${cor}55` }}
                  >
                    {valor}
                  </span>
                  {apoio && (
                    <span className="shrink-0 text-[11px] tabular-nums text-white/25">
                      {apoio}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table / List ───────────────────────────────────── */}
      {loading ? (
        <>
          {/* mobile skeleton */}
          <div className="sm:hidden space-y-3.5">
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
          {/* ── Ordenação (mobile — no desktop fica nos cabeçalhos) ── */}
          <div className="mb-3 flex items-center gap-2 sm:hidden">
            <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-white/[0.10] bg-[hsl(222_47%_10%/0.7)] px-3 shadow-[0_10px_26px_-14px_rgba(2,6,23,0.9)] backdrop-blur-xl">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-white/30" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
                Ordenar
              </span>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v as SortField);
                  setPage(1);
                }}
              >
                <SelectTrigger
                  aria-label="Campo de ordenação"
                  className="ml-auto h-8 w-auto gap-1.5 border-0 bg-transparent px-1 text-sm font-semibold text-white/85 shadow-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white/25"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="select-bounce-content">
                  {(Object.keys(SORT_LABELS) as SortField[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {SORT_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                setPage(1);
              }}
              aria-label={
                sortOrder === "asc"
                  ? "Ordem crescente, tocar para inverter"
                  : "Ordem decrescente, tocar para inverter"
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-[hsl(222_47%_10%/0.7)] text-white/60 shadow-[0_10px_26px_-14px_rgba(2,6,23,0.9)] backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* ── Mobile list ── */}
          <div className="sm:hidden space-y-3.5">
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
                    <SortableHead campo="descricao" sortBy={sortBy} sortOrder={sortOrder} onSort={ordenarPor} />
                    <SortableHead campo="data" sortBy={sortBy} sortOrder={sortOrder} onSort={ordenarPor} />
                    <SortableHead campo="categoria" sortBy={sortBy} sortOrder={sortOrder} onSort={ordenarPor} className="hidden md:table-cell" />
                    <SortableHead campo="pagamento" sortBy={sortBy} sortOrder={sortOrder} onSort={ordenarPor} className="hidden sm:table-cell" />
                    <SortableHead campo="status" sortBy={sortBy} sortOrder={sortOrder} onSort={ordenarPor} />
                    <SortableHead campo="valor" sortBy={sortBy} sortOrder={sortOrder} onSort={ordenarPor} align="right" />
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
                          <Badge variant={statusInfo.variant} className="text-xs px-3 py-1">
                            {getStatusIcon(g.status, "h-3.5 w-3.5")}
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
      <ImportGastosDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => { fetchGastos(); fetchSummary(); }}
      />

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

      {/* Cartão picker → fatura do mês */}
      <Dialog
        open={faturaPickerOpen}
        onOpenChange={(v) => {
          setFaturaPickerOpen(v);
          if (v) setFaturaNavMes(new Date());
        }}
      >
        <DialogContent className="max-w-[380px] p-0 overflow-hidden gap-0">
          <div className="relative overflow-hidden border-b border-white/[0.09]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-blue-500/[0.08] blur-2xl" />
            <div className="relative flex items-center gap-4 px-6 py-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20">
                <Receipt className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold leading-none text-white">
                  Fatura do Mês
                </DialogTitle>
                {/* Month navigator inline */}
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFaturaNavMes((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <FaturaMonthPicker
                    value={faturaNavMes}
                    onChange={(d) => setFaturaNavMes(d)}
                  />
                  <button
                    type="button"
                    onClick={() => setFaturaNavMes((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 px-5 py-4">
            {creditCartoes.map((c) => {
              const bg = c.cor ?? "#334155";
              const textColor = getContrastColor(bg);
              const isLight = textColor === "#1a1a1a";
              const logo = BANDEIRA_LOGOS[c.bandeira?.toLowerCase() ?? ""];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setFaturaMes(format(faturaNavMes, "yyyy-MM"));
                    setFaturaCartaoId(c.id);
                    setFaturaCartaoApelido(c.apelido);
                    setFaturaPickerOpen(false);
                  }}
                  style={{ background: bg, color: textColor }}
                  className="relative h-[76px] w-36 shrink-0 rounded-xl p-3 text-left transition-all duration-150 active:scale-95 border-2 border-transparent opacity-80 hover:opacity-100 hover:shadow-lg hover:shadow-black/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold truncate max-w-[80px]" style={{ color: textColor, opacity: 0.85 }}>{c.apelido}</p>
                    {logo
                      ? <img src={logo} alt={c.bandeira} className="h-5 w-auto max-w-[32px] object-contain shrink-0" style={isLight ? {} : { filter: "brightness(0) invert(1)" }} />
                      : <div className={`h-4 w-6 rounded shrink-0 ${isLight ? "bg-black/20" : "bg-white/30"}`} />}
                  </div>
                  <p className="mt-auto pt-2 font-mono text-xs tracking-widest" style={{ color: textColor, opacity: 0.75 }}>•••• {c.ultimos_4_digitos}</p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {faturaCartaoId && faturaMes && (
        <FaturaDetailDialog
          cartaoId={faturaCartaoId}
          cartaoApelido={faturaCartaoApelido}
          mes={faturaMes}
          open={!!faturaCartaoId}
          onOpenChange={(v) => { if (!v) setFaturaCartaoId(null); }}
          onPaid={fetchGastos}
        />
      )}
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
            <div className="relative px-5 pt-6 pb-4 border-b border-white/[0.07] overflow-hidden">
              <div
                className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent ${
                  g.status === "pendente"
                    ? "via-amber-400/50"
                    : g.status === "pago"
                      ? "via-blue-400/50"
                      : "via-rose-400/50"
                }`}
              />
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
  const startY = useRef(0);
  const dirLocked = useRef<"h" | "v" | null>(null);
  const moved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cardWidth = containerRef.current?.getBoundingClientRect().width ?? 320;
  const THRESHOLD = cardWidth * 0.48;
  const swipeAmt = Math.abs(offsetX);
  const deleteActive = swipeAmt > THRESHOLD;
  const revealRatio = Math.min(1, swipeAmt / 90);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    moved.current = false;
    dirLocked.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;

    if (!dirLocked.current && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      dirLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
    }
    if (dirLocked.current !== "h" || deltaX >= 0) return;

    moved.current = true;
    if (!dragging) setDragging(true);
    const w = containerRef.current?.getBoundingClientRect().width ?? 320;
    setOffsetX(Math.max(deltaX, -w));
  }

  function onTouchEnd() {
    setDragging(false);
    dirLocked.current = null;
    const w = containerRef.current?.getBoundingClientRect().width ?? 320;
    if (offsetX < -(w * 0.48)) onDelete();
    setOffsetX(0);
  }

  function handleClick() {
    if (moved.current) return;
    onEdit();
  }

  const corCategoria = g.categoria_cor ?? "#94a3b8";
  const pendente = g.status === "pendente";

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[22px] bg-[hsl(222,47%,9%)]"
      style={{ touchAction: "pan-y" }}
    >
      {/* Delete background — fades in as card slides. Opacity tied to swipeAmt = seamless. */}
      <div
        className={`absolute inset-0 flex items-center justify-end pr-5 transition-colors duration-150 ${deleteActive ? "bg-rose-600" : "bg-rose-500"}`}
        style={{ opacity: revealRatio }}
      >
        <div className="flex items-center gap-1.5 text-white">
          <Trash2 className="h-4 w-4 shrink-0" />
          {swipeAmt > 72 && (
            <span className="text-xs font-semibold whitespace-nowrap">
              {deleteActive ? "Solte para excluir" : "Excluir"}
            </span>
          )}
        </div>
      </div>

      {/* Swipeable card — glass on top of dark container base */}
      <div
        className="relative z-10 select-none rounded-[22px] border border-white/[0.10] bg-[hsl(222_47%_10%/0.72)] p-[18px] shadow-[0_18px_40px_-18px_rgba(2,6,23,0.9)] active:brightness-110"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
          backdropFilter: "blur(14px)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        {/* Iluminação interna discreta no topo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="flex gap-3.5">
          {/* Barra da categoria com luz percorrendo (ver .ui-barra-neon) */}
          <div
            className="ui-barra-neon w-[5px] shrink-0 self-stretch rounded-full"
            style={{ "--cor-neon": corCategoria } as React.CSSProperties}
          />

          {/* Ícone da categoria */}
          <div
            className="ui-emoji-3d-hover flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: `${corCategoria}55`,
              background: `radial-gradient(circle at 50% 30%, ${corCategoria}22, hsl(222 47% 7% / 0.9))`,
            }}
          >
            {g.categoria_icone ? (
              <span className="ui-emoji-3d text-[26px]" aria-hidden="true">
                {g.categoria_icone}
              </span>
            ) : (
              <Tag className="h-5 w-5" style={{ color: corCategoria }} aria-hidden="true" />
            )}
          </div>

          {/* Informações + valor */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
              <p className="min-w-0 flex-1 text-[17px] font-semibold leading-snug text-white [overflow-wrap:anywhere]">
                {g.descricao}
              </p>
              {/* Valor: cópia borrada atrás fazendo o halo, gradiente na frente */}
              <span className="relative shrink-0 whitespace-nowrap leading-none">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 select-none text-[20px] font-bold leading-none tabular-nums text-rose-500/45 blur-[7px]"
                >
                  {formatBRL(Number(g.valor_total))}
                </span>
                <span className="relative bg-gradient-to-b from-rose-200 via-rose-400 to-rose-500 bg-clip-text text-[20px] font-bold leading-none tabular-nums text-transparent">
                  {formatBRL(Number(g.valor_total))}
                </span>
              </span>
            </div>

            {/* Data · forma de pagamento */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/45">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden="true" />
                {formatDate(g.data_gasto)}
              </span>
              <span className="text-white/20" aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                {getFormaIcon(g.forma_pagamento, "h-3.5 w-3.5 shrink-0 text-white/35")}
                {formaPagtoLabel(g.forma_pagamento, g.tipo_pagamento)}
              </span>
              {g.tipo_pagamento === "parcelado" && g.quantidade_parcelas && (
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-px text-[11px]">
                  {g.numero_parcela ?? 1}/{g.quantidade_parcelas}x
                </span>
              )}
            </div>

            {/* Cartão, categoria e status — mesma família de chips discretos */}
            {(g.cartao_apelido || g.categoria_nome || pendente) && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {g.cartao_apelido && (
                  <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/[0.04] px-2 py-1 text-[12px] text-white/60">
                    <CreditCard
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: g.cartao_cor ?? "#94a3b8" }}
                      aria-hidden="true"
                    />
                    <span className="max-w-[10rem] truncate">{g.cartao_apelido}</span>
                  </span>
                )}
                {g.categoria_nome && (
                  <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-white/[0.04] px-2 py-1 text-[12px] text-white/60">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: corCategoria }}
                      aria-hidden="true"
                    />
                    <span className="max-w-[10rem] truncate">{g.categoria_nome}</span>
                  </span>
                )}
                {pendente && (
                  <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-amber-400/25 bg-amber-500/[0.07] px-2 py-1 text-[12px] text-amber-200/80">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400/80" aria-hidden="true" />
                    Pendente
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
