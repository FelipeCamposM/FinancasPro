"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, getToken } from "@/lib/api";
import { fetchPreferencias } from "@/lib/preferencias";

export interface FaturaPendente {
  cartao_id: string;
  apelido: string;
  cor: string;
  ultimos_4_digitos: string;
  mes: string;
  total: number;
  pendente: number;
  fechamento: string;
  vencimento: string;
  dias_para_vencer: number;
  vencida: boolean;
  /** false = fatura ainda aberta, mostrada por antecedência */
  fechada: boolean;
  dias_ate_fechar: number;
}

export interface FaturasStatus {
  mes_sugerido: string;
  aguardando_fechamento: boolean;
  pendentes: FaturaPendente[];
}

/** Busca o status das faturas — usado aqui e pela página de gastos. */
export async function fetchFaturasStatus(): Promise<FaturasStatus | null> {
  try {
    const { data } = await api.get<{ data: FaturasStatus }>("/cartoes/faturas-status");
    return data.data;
  } catch {
    return null;
  }
}

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatData = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

const formatMes = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
};

function prazo(f: FaturaPendente): string {
  const data = formatData(f.vencimento);
  if (!f.fechada) {
    const d = f.dias_ate_fechar;
    const quando =
      d <= 0 ? "hoje" : `em ${d} ${d === 1 ? "dia" : "dias"}`;
    return `Fecha ${quando} · vence em ${data}`;
  }
  if (f.vencida) {
    const dias = Math.abs(f.dias_para_vencer);
    return `Venceu há ${dias} ${dias === 1 ? "dia" : "dias"} · ${data}`;
  }
  if (f.dias_para_vencer === 0) return `Vence hoje · ${data}`;
  return `Faltam ${f.dias_para_vencer} ${f.dias_para_vencer === 1 ? "dia" : "dias"} para vencer · ${data}`;
}

export function FaturaPendenteDialog() {
  const [pendentes, setPendentes] = useState<FaturaPendente[]>([]);
  const [open, setOpen] = useState(false);
  const [pagando, setPagando] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    Promise.all([fetchPreferencias(), fetchFaturasStatus()]).then(
      ([prefs, status]) => {
        if (!prefs.alerta_fatura_ativo) return;
        if (!status?.pendentes.length) return;
        setPendentes(status.pendentes);
        setOpen(true);
      },
    );
  }, []);

  async function marcarPaga(f: FaturaPendente) {
    setPagando(f.cartao_id);
    try {
      await api.post(`/cartoes/${f.cartao_id}/faturas/${f.mes}/pagar`);
      toast.success(`Fatura de ${formatMes(f.mes)} — ${f.apelido} marcada como paga`);
      const restantes = pendentes.filter(
        (p) => !(p.cartao_id === f.cartao_id && p.mes === f.mes),
      );
      setPendentes(restantes);
      if (!restantes.length) setOpen(false);
    } catch {
      toast.error("Erro ao marcar fatura como paga");
    } finally {
      setPagando(null);
    }
  }

  if (!pendentes.length) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby="fatura-pendente-descricao"
        className="max-w-[760px] gap-0 overflow-hidden rounded-[22px] border-white/[0.10] p-0 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.85)] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:p-1.5"
      >
        {/* ── Cabeçalho ──────────────────────────────────────────── */}
        <div className="flex items-start gap-4 border-b border-white/[0.08] px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/[0.12] ring-1 ring-amber-400/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <DialogHeader className="space-y-0 text-left">
              <DialogTitle className="text-[15px] font-bold uppercase leading-tight tracking-[0.06em] text-white sm:text-base">
                {pendentes.length === 1
                  ? pendentes[0].fechada
                    ? "Fatura fechada sem pagamento"
                    : "Fatura prestes a fechar"
                  : `${pendentes.length} faturas em aberto`}
              </DialogTitle>
              <p
                id="fatura-pendente-descricao"
                className="mt-2 text-[13px] leading-relaxed text-white/45"
              >
                {pendentes.length === 1 ? "Essa fatura já foi paga" : "Essas faturas já foram pagas"}
                ? Se sim, marque abaixo para atualizar os gastos.
              </p>
            </DialogHeader>
          </div>
        </div>

        {/* ── Cards das faturas ──────────────────────────────────── */}
        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {pendentes.map((f) => (
            <div
              key={`${f.cartao_id}-${f.mes}`}
              className="rounded-[18px] border border-white/[0.09] bg-white/[0.045] p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: f.cor }}
                      aria-hidden="true"
                    />
                    <p className="truncate text-[15px] font-semibold text-white">
                      {f.apelido}
                    </p>
                    <span className="shrink-0 text-[13px] tabular-nums text-white/35">
                      •••• {f.ultimos_4_digitos}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-white/40">
                    <span className="capitalize">Fatura {formatMes(f.mes)}</span> ·{" "}
                    {f.fechada ? "Fechou" : "Fecha"} em {formatData(f.fechamento)}
                  </p>
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-[12px] font-medium ${
                      f.vencida ? "text-rose-400" : f.fechada ? "text-amber-300" : "text-sky-300"
                    }`}
                  >
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {prazo(f)}
                  </p>
                </div>
                <p className="shrink-0 text-right text-2xl font-bold tabular-nums leading-none text-white">
                  {formatBRL(f.pendente)}
                </p>
              </div>

              {f.fechada && (
              <Button
                onClick={() => marcarPaga(f)}
                disabled={pagando === f.cartao_id}
                aria-label={`Marcar fatura de ${f.apelido} como paga`}
                className="mt-4 h-[52px] w-full rounded-[14px] border border-emerald-400/30 bg-gradient-to-b from-emerald-600/35 to-emerald-700/30 text-[14px] font-semibold text-emerald-50 transition-colors hover:from-emerald-500/45 hover:to-emerald-600/40 focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:opacity-50"
              >
                {pagando === f.cartao_id ? (
                  <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-[18px] w-[18px]" aria-hidden="true" />
                )}
                Já paguei essa fatura
              </Button>
              )}
            </div>
          ))}
        </div>

        {/* ── Ação secundária ────────────────────────────────────── */}
        <div className="flex justify-end border-t border-white/[0.08] px-5 py-4 sm:px-7">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="group h-10 gap-1 rounded-xl px-3 text-[13px] font-medium text-white/45 transition-colors hover:bg-transparent hover:text-white/80 focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Ainda não paguei
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
