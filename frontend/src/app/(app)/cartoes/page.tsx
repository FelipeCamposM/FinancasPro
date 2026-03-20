"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Plus, CreditCard, Pencil, Trash2, Wifi } from "lucide-react";
import { CartaoDialog, type Cartao } from "./CartaoDialog";

const BANDEIRA_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  hipercard: "Hipercard",
  discover: "Discover",
  outro: "Outro",
};

const TIPO_LABELS: Record<string, string> = {
  credito: "Crédito",
  debito: "Débito",
  credito_debito: "Créd/Déb",
};

function formatCurrency(value?: number) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 140 ? "#1a1a1a" : "#ffffff";
}

function CreditCardVisual({ cartao }: { cartao: Cartao }) {
  const textColor = getContrastColor(cartao.cor);
  const isLight = textColor === "#1a1a1a";

  return (
    <div
      className="relative h-44 w-full rounded-2xl p-5 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
      style={{ background: cartao.cor, color: textColor }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium uppercase tracking-widest opacity-70"
            style={{ color: textColor }}
          >
            {cartao.banco}
          </p>
          <p
            className="mt-0.5 text-sm font-semibold"
            style={{ color: textColor }}
          >
            {cartao.apelido}
          </p>
        </div>
        <Wifi
          className="h-5 w-5 rotate-90 opacity-60"
          style={{ color: textColor }}
        />
      </div>

      {/* Chip / número */}
      <div className="mt-4 flex items-center gap-3">
        <div
          className={`h-8 w-10 rounded-md ${isLight ? "bg-black/15" : "bg-white/25"}`}
        />
        <p
          className="font-mono text-lg tracking-widest"
          style={{ color: textColor }}
        >
          •••• •••• •••• {cartao.ultimos_4_digitos}
        </p>
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-widest opacity-60"
            style={{ color: textColor }}
          >
            Titular
          </p>
          <p
            className="text-sm font-semibold uppercase"
            style={{ color: textColor }}
          >
            {cartao.nome_no_cartao}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-xs uppercase tracking-widest opacity-60"
            style={{ color: textColor }}
          >
            {BANDEIRA_LABELS[cartao.bandeira] ?? cartao.bandeira}
          </p>
          <p className="text-sm font-semibold" style={{ color: textColor }}>
            {TIPO_LABELS[cartao.tipo] ?? cartao.tipo}
          </p>
        </div>
      </div>

      {/* Inactive overlay */}
      {!cartao.ativo && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
          <Badge
            variant="outline"
            className="border-white/60 text-white text-xs"
          >
            Inativo
          </Badge>
        </div>
      )}
    </div>
  );
}

export default function CartoesPage() {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCartao, setSelectedCartao] = useState<Cartao | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCartoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Cartao[] } | Cartao[]>("/cartoes");
      // suporta tanto { data: [] } quanto array direto
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as { data: Cartao[] }).data;
      setCartoes(list ?? []);
    } catch {
      toast.error("Erro ao carregar cartões");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/cartoes/${deleteId}`);
      toast.success("Cartão excluído");
      setDeleteId(null);
      fetchCartoes();
    } catch {
      toast.error("Erro ao excluir cartão");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(cartao: Cartao) {
    setSelectedCartao(cartao);
    setDialogOpen(true);
  }

  function openNew() {
    setSelectedCartao(null);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cartões</h1>
            <p className="text-sm text-muted-foreground">
              {cartoes.length} {cartoes.length === 1 ? "cartão" : "cartões"}
            </p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : cartoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <CreditCard className="h-10 w-10 opacity-25" />
          <p className="text-sm">Nenhum cartão cadastrado</p>
          <Button variant="outline" onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar cartão
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cartoes.map((cartao) => (
            <div key={cartao.id} className="flex flex-col gap-3">
              <CreditCardVisual cartao={cartao} />

              {/* Info row */}
              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col gap-0.5">
                  {cartao.limite && (
                    <p className="text-sm text-muted-foreground">
                      Limite:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(cartao.limite)}
                      </span>
                    </p>
                  )}
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {cartao.dia_fechamento && (
                      <span>Fecha dia {cartao.dia_fechamento}</span>
                    )}
                    {cartao.dia_vencimento && (
                      <span>• Vence dia {cartao.dia_vencimento}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => openEdit(cartao)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(cartao.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <CartaoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchCartoes}
        cartao={selectedCartao}
      />

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
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
