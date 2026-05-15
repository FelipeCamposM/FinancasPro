"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarDays,
  Receipt,
} from "lucide-react";

interface FaturaItem {
  tipo: "gasto" | "parcela";
  gasto_id: string;
  parcela_id?: number;
  descricao: string;
  valor: number;
  data: string;
  categoria_nome?: string;
  categoria_cor?: string;
  status: "pendente" | "pago" | "cancelado";
}

interface FaturaDetail {
  mes: string;
  cartao: { id: string; apelido: string; dia_fechamento: number };
  periodo: { inicio: string; fim: string };
  total: number;
  pendente: number;
  itens: FaturaItem[];
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesLabel(mes: string) {
  const d = new Date(mes + "-02T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pago") return <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />;
  if (status === "cancelado") return <XCircle className="h-3.5 w-3.5 text-rose-400" />;
  return <Clock className="h-3.5 w-3.5 text-amber-400" />;
}

export interface FaturaDetailDialogProps {
  cartaoId: string;
  cartaoApelido?: string;
  mes: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPaid?: () => void;
}

export function FaturaDetailDialog({
  cartaoId,
  cartaoApelido,
  mes,
  open,
  onOpenChange,
  onPaid,
}: FaturaDetailDialogProps) {
  const [data, setData] = useState<FaturaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!open || !cartaoId || !mes) return;
    setData(null);
    setLoading(true);
    api
      .get<FaturaDetail>(`/cartoes/${cartaoId}/faturas/${mes}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error("Erro ao carregar fatura"))
      .finally(() => setLoading(false));
  }, [open, cartaoId, mes]);

  async function handlePagar() {
    setPaying(true);
    try {
      const r = await api.post<{ atualizados: number }>(
        `/cartoes/${cartaoId}/faturas/${mes}/pagar`,
      );
      const n = r.data.atualizados;
      toast.success(
        n > 0
          ? `${n} item${n > 1 ? "s" : ""} marcado${n > 1 ? "s" : ""} como pago`
          : "Nenhum item pendente",
      );
      onOpenChange(false);
      onPaid?.();
    } catch {
      toast.error("Erro ao pagar fatura");
    } finally {
      setPaying(false);
    }
  }

  // Group items by date
  const grouped = (data?.itens ?? []).reduce<Record<string, FaturaItem[]>>(
    (acc, item) => {
      const key = String(item.data).slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );
  const sortedDays = Object.keys(grouped).sort();

  const periodoStr = data
    ? `${formatDate(data.periodo.inicio)} → ${formatDate(data.periodo.fim)}`
    : "";

  const label = data?.cartao.apelido ?? cartaoApelido ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[624px] p-0 overflow-hidden gap-0">

        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/[0.09]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-blue-500/[0.08] blur-2xl" />
          <div className="relative flex items-start gap-4 px-6 py-5 pr-14">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 ring-1 ring-blue-400/20 shadow-lg shadow-blue-500/10">
              <Receipt className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold leading-none text-white capitalize">
                Fatura {mesLabel(mes)}
              </DialogTitle>
              <p className="mt-1.5 text-sm text-white/40">
                {label}{periodoStr ? ` · ${periodoStr}` : ""}
              </p>
              {data && data.total > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-blue-400/25 bg-blue-500/10 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-blue-300">
                    <span className="text-blue-400/50 font-normal text-xs">Total</span>
                    {formatBRL(data.total)}
                  </span>
                  {data.pendente > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-amber-300">
                      <Clock className="h-3.5 w-3.5 text-amber-400/60" />
                      <span className="text-amber-400/50 font-normal text-xs">Pendente</span>
                      {formatBRL(data.pendente)}
                    </span>
                  )}
                  {data.pendente === 0 && (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/[0.06] px-3.5 py-1.5 text-sm font-semibold text-blue-400/70">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Paga
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[462px] overflow-y-auto px-5 py-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-white/30" />
            </div>
          )}

          {!loading && data && data.itens.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CreditCard className="h-8 w-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">Nenhum item nesta fatura</p>
            </div>
          )}

          {!loading && sortedDays.map((day) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-3 w-3 text-white/25" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  {formatDate(day)}
                </p>
              </div>
              <div className="space-y-1.5">
                {grouped[day].map((item, idx) => (
                  <div
                    key={`${item.gasto_id}-${item.parcela_id ?? idx}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
                  >
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: item.categoria_cor ?? "#64748b" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-white/85">{item.descricao}</p>
                      {item.categoria_nome && (
                        <p className="text-[10px] text-white/35">{item.categoria_nome}</p>
                      )}
                    </div>
                    <StatusIcon status={item.status} />
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-white/80">
                      {formatBRL(item.valor)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer — só exibe quando há itens pendentes */}
        {data && data.itens.length > 0 && data.pendente > 0 && (
          <div className="flex items-center justify-end border-t border-white/[0.08] bg-white/[0.03] px-5 py-3">
            <Button
              onClick={handlePagar}
              disabled={paying}
              className="h-9 border border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
            >
              {paying ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Pagar Fatura
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
