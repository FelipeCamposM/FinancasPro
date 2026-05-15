"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Zap,
  Home,
  Gift,
  CircleDollarSign,
  Repeat,
  Wallet,
  CalendarCheck,
  AlertTriangle,
  Percent,
  ArrowUpRight,
  X,
  CalendarRange,
  FilterX,
} from "lucide-react";
import { RendaDialog } from "./RendaDialog";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";

interface Renda {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  origem: string;
  mes_referencia: string;
  data_recebimento: string;
  recorrente?: boolean;
  frequencia_recorrencia?: string | null;
  renda_origem_id?: string | null;
  lancada_neste_mes?: boolean;
  observacoes?: string;
}

interface ApiResponse {
  data: Renda[];
  total: number;
  page: number;
  totalPages: number;
}

const TIPO_LABELS: Record<string, string> = {
  salario: "Salário",
  freelance: "Freelance",
  investimento: "Investimento",
  aluguel: "Aluguel",
  bonus: "Bônus",
  outro: "Outro",
};

const TIPO_VARIANTS: Record<string, "blue" | "violet" | "green" | "amber" | "slate"> = {
  salario:      "blue",
  freelance:    "violet",
  investimento: "green",
  aluguel:      "amber",
  bonus:        "amber",
  outro:        "slate",
};

const TIPO_COLORS: Record<string, string> = {
  salario:      "#3b82f6",
  freelance:    "#8b5cf6",
  investimento: "#22c55e",
  aluguel:      "#f59e0b",
  bonus:        "#f59e0b",
  outro:        "#94a3b8",
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  salario:      <Briefcase className="h-3 w-3" />,
  freelance:    <Zap className="h-3 w-3" />,
  investimento: <TrendingUp className="h-3 w-3" />,
  aluguel:      <Home className="h-3 w-3" />,
  bonus:        <Gift className="h-3 w-3" />,
  outro:        <CircleDollarSign className="h-3 w-3" />,
};

const FREQUENCIA_LABELS: Record<string, string> = {
  diario:     "Diário",
  semanal:    "Semanal",
  quinzenal:  "Quinzenal",
  mensal:     "Mensal",
  bimestral:  "Bimestral",
  trimestral: "Trimestral",
  semestral:  "Semestral",
  anual:      "Anual",
};

const LIMIT = 15;

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatMonth(dateStr: string) {
  if (!dateStr) return "-";
  const [year, month] = dateStr.split("-");
  return `${month}/${year}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateInput(value: string) {
  if (!value) return "Selecionar";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DateFilterPicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ui-control flex h-10 w-full items-center gap-2 px-3 text-left"
        >
          <CalendarRange className="h-3.5 w-3.5 shrink-0 text-white/40" />
          <span className={`truncate text-sm ${value ? "text-white/90" : "text-white/35"}`}>
            {value ? formatDateInput(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="ui-popover w-auto border-white/[0.14] p-0 ui-glass-surface-strong"
        align="start"
      >
        <Calendar
          mode="single"
          className="bg-transparent"
          selected={value ? new Date(`${value}T12:00:00`) : undefined}
          onSelect={(date) => {
            if (date) onChange(toDateInputValue(date));
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function RendaPage() {
  const [rendas, setRendas] = useState<Renda[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  const [periodoMode, setPeriodoMode] = useState<"mes" | "custom" | "todos">("mes");
  const [mesAtual, setMesAtual] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const [summary, setSummary] = useState<{
    total_gastos: number;
    total_renda: number;
    diferenca: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRenda, setSelectedRenda] = useState<Renda | null>(null);
  const [detailRenda, setDetailRenda] = useState<Renda | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const autoLancarCalled = useRef(false);

  useEffect(() => {
    if (autoLancarCalled.current) return;
    autoLancarCalled.current = true;
    const mes = new Date().toISOString().slice(0, 7);
    api.post("/renda/auto-lancar-mes", { mes }).catch(() => {});
  }, []);

  const fetchRendas = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (filterTipo && filterTipo !== "todos") params.tipo = filterTipo;
      if (periodoMode === "mes") {
        params.mes = format(mesAtual, "yyyy-MM");
      } else if (periodoMode === "custom") {
        if (filterDataInicio) params.data_inicio = filterDataInicio;
        if (filterDataFim) params.data_fim = filterDataFim;
      }
      const res = await api.get<ApiResponse>("/renda", { params });
      setRendas(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages ?? 1);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar rendas");
    } finally {
      setLoading(false);
    }
  }, [page, filterTipo, periodoMode, mesAtual, filterDataInicio, filterDataFim]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params = new URLSearchParams();
      if (periodoMode === "mes") params.set("mes", format(mesAtual, "yyyy-MM"));
      else if (periodoMode === "custom") {
        if (filterDataInicio) params.set("data_inicio", filterDataInicio);
        if (filterDataFim) params.set("data_fim", filterDataFim);
      }
      const { data } = await api.get(`/dashboard/period-summary?${params}`);
      setSummary(data);
    } catch {
      // silencia
    } finally {
      setLoadingSummary(false);
    }
  }, [periodoMode, mesAtual, filterDataInicio, filterDataFim]);

  useEffect(() => { fetchRendas(); }, [fetchRendas]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { setPage(1); }, [filterTipo, periodoMode, mesAtual, filterDataInicio, filterDataFim]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/renda/${deleteId}`);
      toast.success("Renda excluída");
      setDeleteId(null);
      fetchRendas();
      fetchSummary();
    } catch {
      toast.error("Erro ao excluir renda");
    } finally {
      setDeleting(false);
    }
  }

  const displayedRendas = search
    ? rendas.filter(
        (r) =>
          r.descricao.toLowerCase().includes(search.toLowerCase()) ||
          r.origem.toLowerCase().includes(search.toLowerCase()),
      )
    : rendas;

  const totalExibido = displayedRendas.reduce((acc, r) => acc + Number(r.valor || 0), 0);
  const recorrentesExibidas = displayedRendas.filter((r) => r.recorrente).length;
  const mediaPorLancamento = displayedRendas.length ? totalExibido / displayedRendas.length : 0;
  const valorRecorrente = displayedRendas.filter((r) => r.recorrente).reduce((s, r) => s + Number(r.valor), 0);
  const maiorEntrada = displayedRendas.length ? Math.max(...displayedRendas.map((r) => Number(r.valor))) : 0;
  const taxaComprometimento =
    summary?.total_renda && summary.total_renda > 0
      ? (summary.total_gastos / summary.total_renda) * 100
      : 0;

  const hasActiveFilters = !!(
    search ||
    filterTipo !== "todos" ||
    periodoMode === "custom" ||
    filterDataInicio ||
    filterDataFim
  );

  return (
    <PageShell contentClassName="space-y-5">

      {/* ── Hero Header ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-emerald-500/60 via-emerald-400/20 to-transparent" />
        <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:justify-start sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-4xl leading-none tracking-wide text-white sm:text-5xl">
                RENDA
              </h1>
              <p className="mt-0.5 text-[12px] text-white/40">
                {total} {total === 1 ? "registro" : "registros"}
                {periodoMode === "mes" && (
                  <span className="ml-1.5 capitalize text-emerald-400/70">
                    · {format(mesAtual, "MMMM yyyy", { locale: ptBR })}
                  </span>
                )}
                {periodoMode === "todos" && (
                  <span className="ml-1.5 text-white/30">· todos os períodos</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="flex w-full items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] sm:w-auto">
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
              <button
                className="flex h-9 w-9 items-center justify-center border-l border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
                aria-label="Próximo mês"
                onClick={() => { setPeriodoMode("mes"); setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={() => { setSelectedRenda(null); setDialogOpen(true); }}
              className="h-10 w-full rounded-xl border border-emerald-300/30 bg-gradient-to-br from-emerald-500/90 via-emerald-500/75 to-emerald-700/90 px-4 text-white shadow-lg shadow-emerald-950/25 ring-1 ring-white/[0.10] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200/50 hover:from-emerald-400/95 hover:via-emerald-500/85 hover:to-emerald-600/95 hover:shadow-emerald-500/20 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Renda
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
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
                    {formatCurrency(summary?.total_gastos ?? 0)}
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
                    {formatCurrency(summary?.total_renda ?? 0)}
                  </p>
                  {summary && (
                    <p className="mt-2 inline-flex rounded-full border border-emerald-200/20 bg-emerald-950/25 px-2 py-0.5 text-[11px] font-medium text-emerald-100/75">
                      {summary.diferenca >= 0
                        ? `${formatCurrency(summary.diferenca)} disponível`
                        : `${formatCurrency(Math.abs(summary.diferenca))} a descoberto`}
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
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${positivo ? "via-blue-200/80" : "via-amber-200/80"} to-transparent`} />
              <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125 ${positivo ? "bg-blue-300/[0.14]" : "bg-amber-300/[0.16]"}`} />
              <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${positivo ? "text-blue-100/75" : "text-amber-100/75"}`}>
                    Saldo do Período
                  </p>
                  {loadingSummary ? (
                    <Skeleton className="mt-2 h-8 w-32 bg-white/10" />
                  ) : (
                    <>
                      <p className={`mt-1.5 font-display text-3xl leading-none tabular-nums drop-shadow-sm transition-transform duration-300 group-hover:translate-x-0.5 ${positivo ? "text-blue-100" : "text-amber-100"}`}>
                        {formatCurrency(summary?.diferenca ?? 0)}
                      </p>
                      {pct && (
                        <p className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${positivo ? "border-blue-200/20 bg-blue-950/25 text-blue-100/75" : "border-amber-200/20 bg-amber-950/25 text-amber-100/75"}`}>
                          {pct}% {positivo ? "poupado" : "a descoberto"}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className={`shrink-0 rounded-xl border p-2.5 shadow-inner shadow-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${positivo ? "border-blue-200/25 bg-blue-300/15" : "border-amber-200/25 bg-amber-300/15"}`}>
                  <Wallet className={`h-5 w-5 ${positivo ? "text-blue-100" : "text-amber-100"}`} />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <div className="relative w-full flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Buscar por descrição ou origem..."
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
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="h-10 w-full shrink-0 sm:h-9 sm:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="salario">Salário</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="investimento">Investimento</SelectItem>
              <SelectItem value="aluguel">Aluguel</SelectItem>
              <SelectItem value="bonus">Bônus</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setPeriodoMode((prev) => prev === "custom" ? "mes" : "custom")}
            className={`flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all sm:h-9 sm:w-auto ${
              periodoMode === "custom"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                : "border-white/10 bg-white/[0.04] text-white/45 hover:text-white/70"
            }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            <span>Período</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilterTipo("todos");
                setFilterDataInicio("");
                setFilterDataFim("");
                setPeriodoMode("mes");
              }}
              className="flex h-9 w-full shrink-0 items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/35 transition-colors hover:text-emerald-400 sm:w-auto"
            >
              <FilterX className="h-3 w-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
        {periodoMode === "custom" && (
          <div className="grid grid-cols-1 gap-2 border-t border-white/[0.07] px-3 py-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <DateFilterPicker
              placeholder="Data inicial"
              value={filterDataInicio}
              onChange={setFilterDataInicio}
            />
            <span className="hidden text-xs text-white/30 sm:block">→</span>
            <DateFilterPicker
              placeholder="Data final"
              value={filterDataFim}
              onChange={setFilterDataFim}
            />
          </div>
        )}
      </div>

      {/* ── Mini stats strip ── */}
      {!loading && !loadError && displayedRendas.length > 0 && (
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ui-stagger">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 text-xs">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Exibindo</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-base font-bold tabular-nums text-white">{displayedRendas.length}</span>
              <span className="text-white/30">de {total}</span>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3.5 py-3 text-xs">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300/55">Total</span>
            <span className="mt-1 block truncate text-base font-bold tabular-nums text-emerald-300">{formatCurrency(totalExibido)}</span>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3 text-xs">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Ticket médio</span>
            <span className="mt-1 block truncate text-base font-bold tabular-nums text-white/75">{formatCurrency(mediaPorLancamento)}</span>
          </div>
          {!loadingSummary && taxaComprometimento > 0 && (
            <div className={`rounded-xl border px-3.5 py-3 text-xs ${
              taxaComprometimento < 70
                ? "border-emerald-400/20 bg-emerald-500/[0.06]"
                : taxaComprometimento < 90
                ? "border-amber-400/20 bg-amber-500/[0.06]"
                : "border-rose-400/20 bg-rose-500/[0.06]"
            }`}>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                <Percent className={`h-3 w-3 ${taxaComprometimento < 70 ? "text-emerald-400" : taxaComprometimento < 90 ? "text-amber-400" : "text-rose-400"}`} />
                Comprometido
              </span>
              <span className={`mt-1 block text-base font-bold tabular-nums ${taxaComprometimento < 70 ? "text-emerald-300" : taxaComprometimento < 90 ? "text-amber-300" : "text-rose-300"}`}>
                {taxaComprometimento.toFixed(1)}%
              </span>
            </div>
          )}
          {recorrentesExibidas > 0 && (
            <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.06] px-3.5 py-3 text-xs">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/55">
                <Repeat className="h-3 w-3 text-violet-400" />
                Recorrentes
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-base font-bold tabular-nums text-violet-300">{recorrentesExibidas}</span>
                <span className="truncate text-white/35">{formatCurrency(valorRecorrente)}</span>
              </div>
            </div>
          )}
          {maiorEntrada > 0 && (
            <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.06] px-3.5 py-3 text-xs">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300/55">
                <ArrowUpRight className="h-3 w-3 text-sky-400" />
                Maior
              </span>
              <span className="mt-1 block truncate text-base font-bold tabular-nums text-sky-300">{formatCurrency(maiorEntrada)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Table / List ── */}
      {loading ? (
        <>
          <div className="sm:hidden space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
          <div className="hidden sm:block overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.07] hover:bg-transparent">
                  {["Descrição","Origem","Tipo","Recorrência","Mês ref.","Recebimento","Valor",""].map((h, i) => (
                    <TableHead key={i} className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar as rendas"
          description="Ocorreu um erro ao carregar a listagem."
          onAction={fetchRendas}
        />
      ) : displayedRendas.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={Wallet}
          title="Nenhuma renda encontrada"
          description="Ajuste os filtros ou cadastre uma nova renda para continuar."
        />
      ) : (
        <>
          {/* Mobile list */}
          <div className="sm:hidden space-y-2">
            {displayedRendas.map((renda) => (
              <RendaMobileCard
                key={renda.id}
                renda={renda}
                onEdit={() => setDetailRenda(renda)}
                onDelete={() => setDeleteId(renda.id)}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/[0.07] hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Descrição</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Origem</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Recorrência</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Mês ref.</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Recebimento</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Valor</TableHead>
                  <TableHead className="w-28 text-center text-xs font-semibold uppercase tracking-[0.08em] text-white/30">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="ui-stagger-rows">
                {displayedRendas.map((renda) => (
                  <TableRow
                    key={renda.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] cursor-pointer"
                    onClick={() => setDetailRenda(renda)}
                  >
                    <TableCell className="font-medium text-white">{renda.descricao}</TableCell>
                    <TableCell className="text-white/50">{renda.origem}</TableCell>
                    <TableCell>
                      <Badge variant={TIPO_VARIANTS[renda.tipo] ?? "slate"}>
                        {TIPO_ICONS[renda.tipo]}
                        {TIPO_LABELS[renda.tipo] ?? renda.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {renda.recorrente ? (
                        <Badge variant="violet">
                          <Repeat className="h-3 w-3" />
                          {renda.frequencia_recorrencia ? FREQUENCIA_LABELS[renda.frequencia_recorrencia] : "Recorrente"}
                        </Badge>
                      ) : renda.renda_origem_id ? (
                        <Badge variant="green">
                          <CalendarCheck className="h-3 w-3" />
                          Instância
                        </Badge>
                      ) : (
                        <span className="text-xs text-white/30">–</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white/50">{formatMonth(renda.mes_referencia)}</TableCell>
                    <TableCell className="text-white/50">{formatDate(renda.data_recebimento)}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-300">
                      {formatCurrency(Number(renda.valor))}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={(e) => { e.stopPropagation(); setSelectedRenda(renda); setDialogOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(renda.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-white/35">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-1.5">
            <Button
              variant="ghost" size="sm" disabled={page <= 1}
              className="h-8 border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm" disabled={page >= totalPages}
              className="h-8 border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail sheet */}
      <RendaDetailSheet
        renda={detailRenda}
        onClose={() => setDetailRenda(null)}
        onEdit={(r) => { setDetailRenda(null); setSelectedRenda(r); setDialogOpen(true); }}
        onDelete={(r) => { setDetailRenda(null); setDeleteId(r.id); }}
      />

      <RendaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchRendas(); fetchSummary(); }}
        renda={selectedRenda}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir renda?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
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

function RendaMobileCard({
  renda,
  onEdit,
  onDelete,
}: {
  renda: Renda;
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

  const tipoColor = TIPO_COLORS[renda.tipo] ?? "#94a3b8";

  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden bg-[hsl(222,47%,9%)]" style={{ touchAction: "pan-y" }}>
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

      <div
        className="relative z-10 flex gap-3 border border-white/[0.09] bg-white/[0.06] px-4 py-3.5 select-none active:brightness-110"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 0.22s cubic-bezier(0.22,1,0.36,1)",
          backdropFilter: "blur(12px)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleClick}
      >
        <div className="w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: tipoColor }} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white/90">{renda.descricao}</p>
            <span className="shrink-0 font-bold tabular-nums text-emerald-400 text-sm leading-none">
              {formatCurrency(Number(renda.valor))}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-white/40">
            <span>{renda.origem}</span>
            <span className="text-white/20">·</span>
            <span>{formatDate(renda.data_recebimento)}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={TIPO_VARIANTS[renda.tipo] ?? "slate"} className="text-[11px] px-2 py-0.5">
              {TIPO_ICONS[renda.tipo]}
              {TIPO_LABELS[renda.tipo] ?? renda.tipo}
            </Badge>
            {renda.recorrente && (
              <Badge variant="violet" className="text-[11px] px-2 py-0.5">
                <Repeat className="h-3 w-3" />
                {renda.frequencia_recorrencia ? FREQUENCIA_LABELS[renda.frequencia_recorrencia] : "Recorrente"}
              </Badge>
            )}
            {renda.renda_origem_id && !renda.recorrente && (
              <Badge variant="green" className="text-[11px] px-2 py-0.5">
                <CalendarCheck className="h-3 w-3" />
                Instância
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RendaDetailSheet({
  renda: r,
  onClose,
  onEdit,
  onDelete,
}: {
  renda: Renda | null;
  onClose: () => void;
  onEdit: (r: Renda) => void;
  onDelete: (r: Renda) => void;
}) {
  return (
    <Dialog open={!!r} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 flex flex-col gap-0 max-w-sm overflow-hidden max-h-[90vh]">
        {r && (
          <>
            <div className="relative px-5 pt-6 pb-4 border-b border-white/[0.07] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
              <div className="flex items-start gap-3 pr-6">
                <div
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TIPO_COLORS[r.tipo] ?? "#94a3b8" }}
                />
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold text-white leading-snug">{r.descricao}</DialogTitle>
                  <p className="mt-0.5 text-xs text-white/40">{r.origem}</p>
                </div>
              </div>
              <p className="mt-4 text-4xl font-bold tabular-nums text-emerald-400 leading-none">
                {formatCurrency(Number(r.valor))}
              </p>
              <div className="mt-3">
                <Badge variant={TIPO_VARIANTS[r.tipo] ?? "slate"} className="text-xs px-2.5 py-1">
                  {TIPO_ICONS[r.tipo]}
                  {TIPO_LABELS[r.tipo] ?? r.tipo}
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1.5">Recebimento</p>
                <p className="text-sm text-white/60">{formatDate(r.data_recebimento)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1.5">Mês de referência</p>
                <p className="text-sm text-white/60">{formatMonth(r.mes_referencia)}</p>
              </div>
              {r.recorrente && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1.5">Recorrência</p>
                  <Badge variant="violet" className="text-xs px-2.5 py-1">
                    <Repeat className="h-3.5 w-3.5" />
                    {r.frequencia_recorrencia ? FREQUENCIA_LABELS[r.frequencia_recorrencia] : "Recorrente"}
                  </Badge>
                </div>
              )}
              {r.renda_origem_id && (
                <div className="flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-2.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-300/80">Instância gerada automaticamente por renda recorrente</p>
                </div>
              )}
              {r.observacoes && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1.5">Observações</p>
                  <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    {r.observacoes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-white/[0.07] bg-white/[0.03] px-5 py-4">
              <Button
                variant="ghost" size="sm"
                className="text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 flex-1"
                onClick={() => onDelete(r)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir
              </Button>
              <Button size="sm" className="flex-1" onClick={() => onEdit(r)}>
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
