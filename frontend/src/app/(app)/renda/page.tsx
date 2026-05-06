"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { RendaDialog } from "./RendaDialog";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
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

const TIPO_ICONS: Record<string, React.ReactNode> = {
  salario: <Briefcase className="h-3 w-3" />,
  freelance: <Zap className="h-3 w-3" />,
  investimento: <TrendingUp className="h-3 w-3" />,
  aluguel: <Home className="h-3 w-3" />,
  bonus: <Gift className="h-3 w-3" />,
  outro: <CircleDollarSign className="h-3 w-3" />,
};

const FREQUENCIA_LABELS: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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

  // Período
  const [periodoMode, setPeriodoMode] = useState<"mes" | "custom" | "todos">(
    "mes",
  );
  const [mesAtual, setMesAtual] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  // Sumário
  const [summary, setSummary] = useState<{
    total_gastos: number;
    total_renda: number;
    diferenca: number;
  } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRenda, setSelectedRenda] = useState<Renda | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const autoLancarCalled = useRef(false);

  // Auto-lança instâncias do mês atual para templates recorrentes (silencioso).
  // useRef evita dupla chamada causada pelo StrictMode do React em desenvolvimento.
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
  }, [
    page,
    filterTipo,
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
      // silencia erro
    } finally {
      setLoadingSummary(false);
    }
  }, [periodoMode, mesAtual, filterDataInicio, filterDataFim]);

  useEffect(() => {
    fetchRendas();
  }, [fetchRendas]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    setPage(1);
  }, [filterTipo, periodoMode, mesAtual, filterDataInicio, filterDataFim]);

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

  const totalExibido = displayedRendas.reduce(
    (acc, renda) => acc + Number(renda.valor || 0),
    0,
  );
  const recorrentesExibidas = displayedRendas.filter(
    (renda) => renda.recorrente,
  ).length;
  const mediaPorLancamento = displayedRendas.length
    ? totalExibido / displayedRendas.length
    : 0;

  return (
    <PageShell contentClassName="space-y-5">
      {/* Header */}
      <SectionHeader
        title="Renda"
        titleColor="text-blue-400"
        description={`${total} ${total === 1 ? "registro" : "registros"}`}
        actions={
          <Button
            variant="default"
            onClick={() => {
              setSelectedRenda(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Renda
          </Button>
        }
      />

      {/* Cards de sumário do período */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ui-stagger">
        {/* Total Gastos */}
        <Card className="rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
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
                  {formatCurrency(summary?.total_gastos ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Renda */}
        <Card className="rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
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
                  {formatCurrency(summary?.total_renda ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card
          className={
            (summary?.diferenca ?? 0) >= 0
              ? "rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5"
              : "rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5"
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
                  {formatCurrency(summary?.diferenca ?? 0)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar por descrição ou origem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        </div>

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-44">
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

        {/* Navegador de mês */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-sm overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-none border-r border-white/10 hover:bg-white/10 text-white/70"
              onClick={() => {
                setPeriodoMode("mes");
                setMesAtual(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                );
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() =>
                setPeriodoMode((prev) => (prev === "todos" ? "mes" : "todos"))
              }
              className="px-5 h-10 min-w-[200px] text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              aria-label="Alternar período entre mês atual e todos os meses"
            >
              {periodoMode === "todos" ? (
                <span className="text-sm font-medium text-white/50">
                  Todos os meses
                </span>
              ) : (
                <span className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-400/70">
                    {format(mesAtual, "yyyy")}
                  </span>
                  <span className="text-base font-bold capitalize text-blue-300">
                    {format(mesAtual, "MMMM", { locale: ptBR })}
                  </span>
                </span>
              )}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-none border-l border-white/10 hover:bg-white/10 text-white/70"
              onClick={() => {
                setPeriodoMode("mes");
                setMesAtual(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                );
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`h-9 text-xs border backdrop-blur ${
              periodoMode === "custom"
                ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
                : "bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90"
            }`}
            onClick={() =>
              setPeriodoMode((prev) => (prev === "custom" ? "mes" : "custom"))
            }
          >
            Período específico
          </Button>

          {periodoMode === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-36 h-9 text-sm"
                value={filterDataInicio}
                onChange={(e) => setFilterDataInicio(e.target.value)}
              />
              <span className="text-xs text-white/40 font-medium">até</span>
              <Input
                type="date"
                className="w-36 h-9 text-sm"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {!loading && !loadError && displayedRendas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ui-stagger">
          <Card className="rounded-lg border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-white/45 font-semibold">
                Exibição atual
              </p>
              <p className="mt-1 text-lg font-bold text-white tabular-nums">
                {displayedRendas.length}
              </p>
              <p className="text-xs text-white/55">de {total} registros</p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-blue-300/80 font-semibold">
                Valor total exibido
              </p>
              <p className="mt-1 text-lg font-bold text-blue-300 tabular-nums">
                {formatCurrency(totalExibido)}
              </p>
              <p className="text-xs text-white/55">
                Média por lançamento: {formatCurrency(mediaPorLancamento)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-indigo-300/80 font-semibold">
                Recorrentes
              </p>
              <p className="mt-1 text-lg font-bold text-indigo-200 tabular-nums">
                {recorrentesExibidas}
              </p>
              <p className="text-xs text-white/55">
                {recorrentesExibidas > 0
                  ? "Entradas previstas para próximos períodos."
                  : "Sem entradas recorrentes na visão atual."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.07] hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Descrição
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Origem
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Tipo
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Recorrência
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Mês ref.
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Recebimento
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Valor
                </TableHead>
                <TableHead className="w-28 text-center text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
        <div className="overflow-hidden rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/[0.07] hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Descrição
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Origem
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Tipo
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Recorrência
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Mês ref.
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Recebimento
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Valor
                </TableHead>
                <TableHead className="w-28 text-center text-xs font-semibold uppercase tracking-[0.08em] text-white/30">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="ui-stagger-rows">
              {displayedRendas.map((renda) => (
                <TableRow
                  key={renda.id}
                  className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                >
                  <TableCell className="font-medium text-white">
                    {renda.descricao}
                  </TableCell>
                  <TableCell className="text-white/50">
                    {renda.origem}
                  </TableCell>
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
                        {renda.frequencia_recorrencia
                          ? FREQUENCIA_LABELS[renda.frequencia_recorrencia]
                          : "Recorrente"}
                      </Badge>
                    ) : renda.renda_origem_id ? (
                      <Badge variant="blue">
                        <CalendarCheck className="h-3 w-3" />
                        Instância
                      </Badge>
                    ) : (
                      <span className="text-xs text-white/30">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white/50">
                    {formatMonth(renda.mes_referencia)}
                  </TableCell>
                  <TableCell className="text-white/50">
                    {formatDate(renda.data_recebimento)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-blue-300">
                    {formatCurrency(Number(renda.valor))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
                        aria-label={`Editar renda ${renda.descricao}`}
                        onClick={() => {
                          setSelectedRenda(renda);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
                        aria-label={`Excluir renda ${renda.descricao}`}
                        onClick={() => setDeleteId(renda.id)}
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog criar/editar */}
      <RendaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => {
          fetchRendas();
          fetchSummary();
        }}
        renda={selectedRenda}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir renda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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
