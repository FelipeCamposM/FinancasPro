"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { GastoDialog } from "./GastoDialog";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";

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
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const formaPagtoLabel: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Crédito",
  cartao_debito: "Débito",
  pix: "Pix",
  transferencia: "Transferência",
  outro: "Outro",
};

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filtros
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterForma, setFilterForma] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Gasto | null>(null);

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filterStatus) params.set("status", filterStatus);
      if (filterForma) params.set("forma_pagamento", filterForma);

      const { data } = await api.get<PaginatedResponse>(`/gastos?${params}`);
      setGastos(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      toast.error("Erro ao carregar gastos");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterForma]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterForma]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/gastos/${deleteTarget.id}`);
      toast.success("Gasto excluído");
      fetchGastos();
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {total} registro(s) no total
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingGasto(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Gasto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-4 w-4" />
        </div>
        <Select
          value={filterStatus || "todos"}
          onValueChange={(v) => setFilterStatus(v === "todos" ? "" : v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterForma || "todos"}
          onValueChange={(v) => setFilterForma(v === "todos" ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos pagamentos</SelectItem>
            <SelectItem value="dinheiro">Dinheiro</SelectItem>
            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
            <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
            <SelectItem value="pix">Pix</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Listagem de gastos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-24 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : displayedGastos.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum gasto encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedGastos.map((g) => {
                    const statusInfo = statusConfig[g.status] ?? {
                      label: g.status,
                      variant: "outline" as const,
                    };
                    return (
                      <TableRow key={g.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {g.descricao}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(g.data_gasto)}
                        </TableCell>
                        <TableCell>
                          {g.categoria_nome ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: g.categoria_cor ?? "#94a3b8",
                                }}
                              />
                              <span className="text-sm">
                                {g.categoria_icone} {g.categoria_nome}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formaPagtoLabel[g.forma_pagamento] ??
                            g.forma_pagamento}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatBRL(Number(g.valor_total))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
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
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(g)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <GastoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchGastos}
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
