"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
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
  CreditCard,
  Pencil,
  Trash2,
  Wifi,
  AlertTriangle,
  CircleCheck,
  CircleX,
  Wallet,
} from "lucide-react";
import { CartaoDialog, type Cartao } from "./CartaoDialog";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

const BANDEIRA_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  hipercard: "Hipercard",
  alelo: "Alelo",
  paypal: "PayPal",
  discover: "Discover",
  outro: "Outro",
};

const BANDEIRA_LOGOS: Record<string, string> = {
  visa: "/brand_cardlogos/visa.svg",
  mastercard: "/brand_cardlogos/mastercard.svg",
  elo: "/brand_cardlogos/elo.svg",
  amex: "/brand_cardlogos/amex.svg",
  hipercard: "/brand_cardlogos/hipercard.svg",
  alelo: "/brand_cardlogos/alelo.svg",
  paypal: "/brand_cardlogos/paypal.svg",
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
        {BANDEIRA_LOGOS[cartao.bandeira] ? (
          <img
            src={BANDEIRA_LOGOS[cartao.bandeira]}
            alt={BANDEIRA_LABELS[cartao.bandeira] ?? cartao.bandeira}
            className="h-8 w-auto max-w-[64px] object-contain drop-shadow-sm shrink-0"
            style={
              isLight
                ? { filter: "none" }
                : { filter: "brightness(0) invert(1)" }
            }
          />
        ) : (
          <div
            className={`h-8 w-10 rounded-md shrink-0 ${
              isLight ? "bg-black/15" : "bg-white/25"
            }`}
          />
        )}
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
            {TIPO_LABELS[cartao.tipo] ?? cartao.tipo}
          </p>
          <p className="text-sm font-semibold" style={{ color: textColor }}>
            {BANDEIRA_LABELS[cartao.bandeira] ?? cartao.bandeira}
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
  const [loadError, setLoadError] = useState(false);

  const fetchCartoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Cartao[] } | Cartao[]>("/cartoes");
      // suporta tanto { data: [] } quanto array direto
      const list = Array.isArray(res.data)
        ? res.data
        : (res.data as { data: Cartao[] }).data;
      setCartoes(list ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
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

  const ativos = cartoes.filter((cartao) => cartao.ativo).length;
  const inativos = cartoes.length - ativos;
  const limiteTotal = cartoes.reduce(
    (acc, cartao) => acc + Number(cartao.limite || 0),
    0,
  );

  return (
    <PageShell contentClassName="space-y-5">
      {/* Header */}
      <SectionHeader
        title="Cartões"
        titleColor="text-blue-300"
        description={`${cartoes.length} ${cartoes.length === 1 ? "cartão" : "cartões"}`}
        actions={
          <Button
            onClick={openNew}
            variant="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cartão
          </Button>
        }
      />

      {!loading && !loadError && cartoes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ui-stagger">
          <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-blue-300">
              <CircleCheck className="h-4 w-4" />
              <p className="text-[11px] uppercase tracking-wider font-semibold">
                Ativos
              </p>
            </div>
            <p className="mt-1 text-lg font-bold text-white tabular-nums">
              {ativos}
            </p>
            <p className="text-xs text-white/55">
              Cartões disponíveis para uso
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-white/70">
              <CircleX className="h-4 w-4" />
              <p className="text-[11px] uppercase tracking-wider font-semibold">
                Inativos
              </p>
            </div>
            <p className="mt-1 text-lg font-bold text-white tabular-nums">
              {inativos}
            </p>
            <p className="text-xs text-white/55">Cartões fora de operação</p>
          </div>

          <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-violet-300">
              <Wallet className="h-4 w-4" />
              <p className="text-[11px] uppercase tracking-wider font-semibold">
                Limite consolidado
              </p>
            </div>
            <p className="mt-1 text-lg font-bold text-white tabular-nums">
              {formatCurrency(limiteTotal)}
            </p>
            <p className="text-xs text-white/55">Soma dos limites informados</p>
          </div>
        </div>
      )}

      {/* Card Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ui-stagger">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar os cartões"
          description="Houve um problema ao buscar os cartões cadastrados."
          onAction={fetchCartoes}
        />
      ) : cartoes.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Adicione um cartão para começar a organizar suas formas de pagamento."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ui-stagger">
          {cartoes.map((cartao) => (
            <div
              key={cartao.id}
              className="flex flex-col gap-4 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <CreditCardVisual cartao={cartao} />

              {/* Info row */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  {cartao.limite && (
                    <p className="text-sm text-white/50">
                      Limite:{" "}
                      <span className="font-semibold text-white">
                        {formatCurrency(cartao.limite)}
                      </span>
                    </p>
                  )}
                  <div className="flex gap-2 text-xs text-white/40">
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
                    className="h-8 w-8 text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
                    onClick={() => openEdit(cartao)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-rose-400 hover:bg-rose-500/10"
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
