"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { RendaDialog } from "./RendaDialog";

interface Renda {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  origem: string;
  mes_referencia: string;
  data_recebimento: string;
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

const TIPO_COLORS: Record<string, string> = {
  salario: "bg-blue-100 text-blue-800",
  freelance: "bg-violet-100 text-violet-800",
  investimento: "bg-green-100 text-green-800",
  aluguel: "bg-orange-100 text-orange-800",
  bonus: "bg-yellow-100 text-yellow-800",
  outro: "bg-gray-100 text-gray-700",
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

  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRenda, setSelectedRenda] = useState<Renda | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRendas = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (filterTipo && filterTipo !== "todos") params.tipo = filterTipo;
      if (search) params.search = search;

      const res = await api.get<ApiResponse>("/renda", { params });
      setRendas(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages ?? 1);
    } catch {
      toast.error("Erro ao carregar rendas");
    } finally {
      setLoading(false);
    }
  }, [page, filterTipo, search]);

  useEffect(() => {
    fetchRendas();
  }, [fetchRendas]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [filterTipo, search]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/renda/${deleteId}`);
      toast.success("Renda excluída");
      setDeleteId(null);
      fetchRendas();
    } catch {
      toast.error("Erro ao excluir renda");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(renda: Renda) {
    setSelectedRenda(renda);
    setDialogOpen(true);
  }

  function openNew() {
    setSelectedRenda(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Renda</h1>
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Renda
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por descrição ou origem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Descrição</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Mês ref.</TableHead>
              <TableHead>Recebimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-24 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rendas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Nenhuma renda encontrada</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rendas.map((renda) => (
                <TableRow key={renda.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {renda.descricao}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {renda.origem}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        TIPO_COLORS[renda.tipo] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {TIPO_LABELS[renda.tipo] ?? renda.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatMonth(renda.mes_referencia)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(renda.data_recebimento)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-700">
                    {formatCurrency(Number(renda.valor))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEdit(renda)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(renda.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
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

      {/* Dialog */}
      <RendaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchRendas}
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
