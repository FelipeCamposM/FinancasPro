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
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Receipt,
  Loader2,
  CheckCircle2,
  Clock,
  Building2,
  Hash,
  CalendarDays,
  BadgeDollarSign,
  Search,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { useRef } from "react";
import { CartaoDialog, type Cartao } from "./CartaoDialog";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { FaturaDetailDialog } from "../gastos/FaturaDetailDialog";

interface FaturaResumo {
  mes: string;
  total: number;
  pendente: number;
  itens_count: number;
}

function mesLabel(mes: string) {
  const d = new Date(mes + "-02T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function FaturaListDialog({
  cartao,
  open,
  onOpenChange,
}: {
  cartao: Cartao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [faturas, setFaturas] = useState<FaturaResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailMes, setDetailMes] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [anoFiltro, setAnoFiltro] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  function reload() {
    if (!cartao) return;
    api
      .get<{ data: FaturaResumo[] }>(`/cartoes/${cartao.id}/faturas`)
      .then((r) => setFaturas(r.data.data ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    if (!open || !cartao) return;
    setFaturas([]);
    setSearch("");
    setAnoFiltro(null);
    setLoading(true);
    api
      .get<{ data: FaturaResumo[] }>(`/cartoes/${cartao.id}/faturas`)
      .then((r) => setFaturas(r.data.data ?? []))
      .catch(() => toast.error("Erro ao carregar faturas"))
      .finally(() => setLoading(false));
  }, [open, cartao]);

  // Available years
  const anos = Array.from(new Set(faturas.map((f) => f.mes.slice(0, 4)))).sort().reverse();

  // Filtered list
  const filtered = faturas.filter((f) => {
    const label = mesLabel(f.mes).toLowerCase();
    const matchSearch = !search || label.includes(search.toLowerCase()) || f.mes.includes(search);
    const matchAno = !anoFiltro || f.mes.startsWith(anoFiltro);
    return matchSearch && matchAno;
  });

  // Summary stats
  const totalGeral = faturas.reduce((s, f) => s + f.total, 0);
  const totalPendente = faturas.reduce((s, f) => s + f.pendente, 0);
  const faturasPagas = faturas.filter((f) => f.pendente === 0).length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">

          {/* Header */}
          <div className="relative overflow-hidden border-b border-white/[0.08]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-blue-500/[0.07] blur-2xl" />
            <div className="pointer-events-none absolute right-0 top-0 h-20 w-40 rounded-full bg-violet-500/[0.05] blur-2xl" />

            <div className="relative px-5 pt-5 pb-4 pr-14">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20 shadow-lg shadow-blue-500/10">
                  <Receipt className="h-4.5 w-4.5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold leading-none text-white">
                    Faturas
                  </DialogTitle>
                  <p className="mt-1 text-xs text-white/40">{cartao?.apelido}</p>
                </div>
              </div>

              {/* Stats pills */}
              {!loading && faturas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs tabular-nums text-white/60">
                    <TrendingDown className="h-3 w-3 text-white/30" />
                    {formatBRL(totalGeral)} total
                  </span>
                  {totalPendente > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-2.5 py-1 text-xs tabular-nums text-amber-300/80">
                      <Clock className="h-3 w-3 text-amber-400/60" />
                      {formatBRL(totalPendente)} pendente
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/15 bg-blue-500/[0.06] px-2.5 py-1 text-xs text-blue-400/70">
                    <CheckCircle2 className="h-3 w-3" />
                    {faturasPagas} paga{faturasPagas !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="px-4 pt-3 pb-2 space-y-2 border-b border-white/[0.05]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar mês..."
                className="h-8 w-full rounded-lg border border-white/[0.07] bg-white/[0.03] pl-8 pr-3 text-sm text-white placeholder:text-white/25 focus:border-white/15 focus:bg-white/[0.05] focus:outline-none transition-colors"
              />
            </div>

            {/* Year tabs */}
            {anos.length > 1 && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setAnoFiltro(null)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    !anoFiltro
                      ? "bg-white/10 text-white border border-white/15"
                      : "text-white/40 hover:text-white/60 border border-transparent"
                  }`}
                >
                  Todos
                </button>
                {anos.map((ano) => (
                  <button
                    key={ano}
                    onClick={() => setAnoFiltro(anoFiltro === ano ? null : ano)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      anoFiltro === ano
                        ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                        : "text-white/40 hover:text-white/60 border border-transparent"
                    }`}
                  >
                    {ano}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto px-4 py-3 space-y-1.5">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-white/25" />
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-7 w-7 text-white/15 mb-2" />
                <p className="text-sm text-white/30">
                  {faturas.length === 0 ? "Nenhuma fatura encontrada" : "Nenhum resultado"}
                </p>
              </div>
            )}

            {!loading && filtered.map((f) => {
              const isPaga = f.pendente === 0;
              return (
                <button
                  key={f.mes}
                  onClick={() => setDetailMes(f.mes)}
                  className="group w-full flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition-all hover:bg-white/[0.05] hover:border-white/10 active:scale-[0.99]"
                >
                  {/* Status bar */}
                  <div
                    className={`h-9 w-[3px] shrink-0 rounded-full transition-opacity ${
                      isPaga ? "bg-blue-400/50" : "bg-amber-400/60"
                    }`}
                  />

                  {/* Month + count */}
                  <div className="flex-1 min-w-0">
                    <p className="capitalize text-sm font-semibold text-white/85 leading-none">
                      {mesLabel(f.mes)}
                    </p>
                    <p className="mt-1 text-[10px] text-white/35">
                      {f.itens_count} {f.itens_count === 1 ? "item" : "itens"}
                    </p>
                  </div>

                  {/* Values */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums text-white/80 leading-none">
                      {formatBRL(f.total)}
                    </p>
                    <div className="mt-1">
                      {isPaga ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-400/70">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          paga
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400/80">
                          <Clock className="h-2.5 w-2.5" />
                          {formatBRL(f.pendente)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/15 transition-colors group-hover:text-white/30" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {cartao && detailMes && (
        <FaturaDetailDialog
          cartaoId={cartao.id}
          cartaoApelido={cartao.apelido}
          mes={detailMes}
          open={!!detailMes}
          onOpenChange={(v) => { if (!v) setDetailMes(null); }}
          onPaid={() => {
            setDetailMes(null);
            reload();
          }}
        />
      )}
    </>
  );
}

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
      className="relative h-48 w-full rounded-2xl p-5 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
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
      <div className="mt-3 flex items-center gap-3">
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
      <div className="mt-3 flex items-end justify-between">
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

function CartaoInfoDialog({
  cartao,
  open,
  onOpenChange,
  onEdit,
  onFaturas,
  onDelete,
}: {
  cartao: Cartao | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: () => void;
  onFaturas: () => void;
  onDelete: () => void;
}) {
  if (!cartao) return null;

  const isCredito = cartao.tipo === "credito" || cartao.tipo === "credito_debito";

  function InfoRow({
    icon: Icon,
    label,
    value,
    tone = "blue",
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    tone?: "blue" | "violet" | "emerald" | "amber" | "slate";
  }) {
    const tones = {
      blue: "border-blue-400/15 bg-blue-500/[0.07] text-blue-300",
      violet: "border-violet-400/15 bg-violet-500/[0.07] text-violet-300",
      emerald: "border-emerald-400/15 bg-emerald-500/[0.07] text-emerald-300",
      amber: "border-amber-400/15 bg-amber-500/[0.07] text-amber-300",
      slate: "border-white/[0.08] bg-white/[0.04] text-white/55",
    };

    return (
      <div className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-3 ${tones[tone]}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/35">{label}</p>
          <p className="truncate text-sm font-semibold text-white/85">{value}</p>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[82vh] max-h-[720px] max-w-[440px] flex-col overflow-hidden p-0 gap-0">
        {/* Card visual */}
        <div className="space-y-4 border-b border-white/[0.07] p-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-semibold text-white">
              Detalhes do cartão
            </DialogTitle>
            {cartao.ativo ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <CircleCheck className="h-3.5 w-3.5" /> Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/45">
                <CircleX className="h-3.5 w-3.5" /> Inativo
              </span>
            )}
          </div>
          <CreditCardVisual cartao={cartao} />
        </div>

        {/* Info grid */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={Building2} label="Banco" value={cartao.banco} tone="blue" />
            <InfoRow icon={CreditCard} label="Bandeira" value={BANDEIRA_LABELS[cartao.bandeira] ?? cartao.bandeira} tone="violet" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={Wallet} label="Tipo" value={TIPO_LABELS[cartao.tipo] ?? cartao.tipo} tone="emerald" />
            <InfoRow icon={Hash} label="Número" value={`•••• ${cartao.ultimos_4_digitos}`} tone="slate" />
          </div>

          {(cartao.limite || cartao.dia_fechamento || cartao.dia_vencimento) && (
            <div className={`grid gap-2 ${cartao.limite && (cartao.dia_fechamento || cartao.dia_vencimento) ? "grid-cols-1 sm:grid-cols-3" : cartao.limite ? "grid-cols-1" : "grid-cols-2"}`}>
              {cartao.limite && (
                <InfoRow icon={BadgeDollarSign} label="Limite" value={formatCurrency(cartao.limite)} tone="amber" />
              )}
              {cartao.dia_fechamento && (
                <InfoRow icon={CalendarDays} label="Fechamento" value={`Dia ${cartao.dia_fechamento}`} tone="blue" />
              )}
              {cartao.dia_vencimento && (
                <InfoRow icon={CalendarDays} label="Vencimento" value={`Dia ${cartao.dia_vencimento}`} tone="violet" />
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 border-t border-white/[0.07] bg-white/[0.03] px-4 py-4">
          <Button
            size="sm"
            className="h-10 flex-1 border border-rose-400/35 bg-rose-500/15 px-4 text-rose-300 shadow-sm shadow-rose-950/20 hover:border-rose-400/50 hover:bg-rose-500/25 hover:text-rose-200 sm:flex-none"
            onClick={() => { onOpenChange(false); onDelete(); }}
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            Excluir
          </Button>
          {isCredito && (
            <Button
              size="sm"
              className="h-10 flex-1 border border-blue-400/35 bg-blue-500/15 px-4 text-blue-300 shadow-sm shadow-blue-950/20 hover:border-blue-400/50 hover:bg-blue-500/25 hover:text-blue-200 sm:flex-none"
              onClick={() => { onOpenChange(false); onFaturas(); }}
            >
              <Receipt className="mr-1.5 h-4 w-4" />
              Faturas
            </Button>
          )}
          <Button
            size="sm"
            className="h-10 flex-1 border border-violet-400/35 bg-violet-500/15 px-4 text-violet-300 shadow-sm shadow-violet-950/20 hover:border-violet-400/50 hover:bg-violet-500/25 hover:text-violet-200 sm:flex-none"
            onClick={() => { onOpenChange(false); onEdit(); }}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [faturaCartao, setFaturaCartao] = useState<Cartao | null>(null);
  const [detailCartao, setDetailCartao] = useState<Cartao | null>(null);

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
            className="w-full rounded-xl border border-blue-300/30 bg-gradient-to-br from-blue-500/90 via-blue-500/75 to-blue-700/90 text-white shadow-lg shadow-blue-950/25 ring-1 ring-white/[0.10] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200/50 hover:from-blue-400/95 hover:via-blue-500/85 hover:to-blue-600/95 hover:shadow-blue-500/20 sm:w-auto"
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
            <Skeleton key={i} className="h-48 rounded-2xl" />
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
              onClick={() => setDetailCartao(cartao)}
              className="flex flex-col gap-4 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4 backdrop-blur-xl ring-1 ring-white/5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
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

                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {(cartao.tipo === "credito" || cartao.tipo === "credito_debito") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
                      title="Ver faturas"
                      onClick={() => setFaturaCartao(cartao)}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                    </Button>
                  )}
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

      {/* Detail */}
      <CartaoInfoDialog
        cartao={detailCartao}
        open={!!detailCartao}
        onOpenChange={(v) => { if (!v) setDetailCartao(null); }}
        onEdit={() => { openEdit(detailCartao!); }}
        onFaturas={() => setFaturaCartao(detailCartao)}
        onDelete={() => setDeleteId(detailCartao!.id)}
      />

      {/* Dialog */}
      <CartaoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchCartoes}
        cartao={selectedCartao}
      />

      {/* Fatura List */}
      <FaturaListDialog
        cartao={faturaCartao}
        open={!!faturaCartao}
        onOpenChange={(v) => { if (!v) setFaturaCartao(null); }}
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
