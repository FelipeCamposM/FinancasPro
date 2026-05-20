"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  Flag,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { getCachedQuotes } from "@/lib/stockApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Cofrinho } from "./CofrinhoDialog";

interface Movimentacao {
  id: string;
  tipo: "deposito" | "adicao_cotas" | "ajuste" | "retirada";
  valor: number | null;
  quantidade_cotas: number | null;
  valor_cota: number | null;
  observacoes: string | null;
  created_at: string;
}

const TIPO_LABEL: Record<Movimentacao["tipo"], string> = {
  deposito: "Depósito",
  adicao_cotas: "Adição de cotas",
  ajuste: "Ajuste",
  retirada: "Retirada",
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value + "T00:00:00").toLocaleDateString("pt-BR");
}

function MetaRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-white/85">{value}</span>
        {sub && <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface Props {
  cofrinho: Cofrinho | null;
  open: boolean;
  onClose: () => void;
  onDepositar: (c: Cofrinho) => void;
  onEditar: (c: Cofrinho) => void;
}

export function CofrinhoDetailDialog({ cofrinho, open, onClose, onDepositar, onEditar }: Props) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  useEffect(() => {
    if (!open || !cofrinho?.id) return;
    setLoadingMov(true);
    api
      .get<{ data: Movimentacao[] }>(`/cofrinhos/${cofrinho.id}/movimentacoes`)
      .then(({ data }) => setMovimentacoes(data.data))
      .catch(() => setMovimentacoes([]))
      .finally(() => setLoadingMov(false));
  }, [open, cofrinho?.id]);

  if (!cofrinho) return null;

  const isAcao = cofrinho.tipo === "acao";
  const Icon = isAcao ? TrendingUp : Landmark;
  const gradientCls = isAcao
    ? "bg-gradient-to-br from-emerald-700 to-teal-600"
    : "bg-gradient-to-br from-blue-700 to-sky-600";

  const quote = isAcao && cofrinho.ticker ? getCachedQuotes()[cofrinho.ticker] : null;
  const qtd = Number(cofrinho.quantidade_cotas ?? 0);
  const precoMedio = Number(cofrinho.preco_medio ?? cofrinho.valor_cota ?? 0);
  const valorMercado = quote ? qtd * quote.price : null;
  const valorCompra = Number(cofrinho.saldo_atual ?? 0);
  const pnlAbs = valorMercado !== null ? valorMercado - valorCompra : null;
  const pnlPct = pnlAbs !== null && valorCompra > 0 ? (pnlAbs / valorCompra) * 100 : null;
  const isProfit = pnlPct !== null && pnlPct >= 0;

  const progress = cofrinho.meta_valor
    ? Math.min(100, (Number(cofrinho.saldo_atual) / Number(cofrinho.meta_valor)) * 100)
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">

        {/* Gradient header */}
        <div className={`${gradientCls} px-6 py-5`}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <DialogDescription className="text-white/65 text-[11px] font-medium uppercase tracking-wider m-0 p-0">
                  {isAcao ? "Ação" : "Conta"}
                </DialogDescription>
                <DialogTitle className="text-2xl font-black text-white tracking-tight leading-none">
                  {cofrinho.nome}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {/* Info card */}
          <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/65 flex items-center gap-1.5">
                {isAcao ? (
                  <>
                    <Flag className="h-3 w-3 shrink-0" />
                    {cofrinho.ticker}
                    {quote && (
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {formatCurrency(quote.price)}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Landmark className="h-3 w-3 shrink-0" />
                    {cofrinho.instituicao || "Conta manual"}
                  </>
                )}
              </p>
              {isAcao && (
                <p className="mt-1 text-[11px] text-white/50">
                  {qtd.toLocaleString("pt-BR")} cotas
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              {isAcao && valorMercado !== null ? (
                <>
                  <p className="text-lg font-black text-white">{formatCurrency(valorMercado)}</p>
                  <p className="text-[10px] text-white/60">mercado</p>
                  <p className="text-[10px] text-white/40">compra: {formatCurrency(valorCompra)}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-black text-white">{formatCurrency(cofrinho.saldo_atual)}</p>
                  <p className="text-[10px] text-white/60">{isAcao ? "total" : "saldo atual"}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto">

          {/* P&L banner — só ações com cotação */}
          {isAcao && pnlPct !== null && (
            <div className={cn(
              "mx-5 mt-4 flex items-center justify-between rounded-xl border px-4 py-3",
              isProfit
                ? "border-emerald-400/20 bg-emerald-500/[0.08]"
                : "border-rose-400/20 bg-rose-500/[0.08]",
            )}>
              <div className="flex items-center gap-2">
                {isProfit
                  ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                  : <TrendingDown className="h-4 w-4 text-rose-400" />}
                <span className={cn("text-sm font-bold", isProfit ? "text-emerald-300" : "text-rose-300")}>
                  {isProfit ? "Lucro" : "Prejuízo"}
                </span>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-black tabular-nums", isProfit ? "text-emerald-300" : "text-rose-300")}>
                  {isProfit ? "+" : ""}{formatCurrency(pnlAbs)}
                </p>
                <p className={cn("text-[10px] font-bold tabular-nums", isProfit ? "text-emerald-400/70" : "text-rose-400/70")}>
                  {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                </p>
              </div>
            </div>
          )}

          {/* Métricas */}
          <div className="mx-5 mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4">
            {isAcao ? (
              <>
                {quote && (
                  <MetaRow
                    label="Cotação atual"
                    value={
                      <span className="text-emerald-300">{formatCurrency(quote.price)}</span>
                    }
                  />
                )}
                <MetaRow label="Preço médio" value={formatCurrency(precoMedio)} />
                <MetaRow
                  label="Quantidade"
                  value={`${qtd.toLocaleString("pt-BR")} cotas`}
                />
                <MetaRow label="Valor de compra" value={formatCurrency(valorCompra)} />
                {valorMercado !== null && (
                  <MetaRow
                    label="Valor de mercado"
                    value={<span className="text-emerald-300">{formatCurrency(valorMercado)}</span>}
                    sub={`${qtd.toLocaleString("pt-BR")} × ${formatCurrency(quote?.price)}`}
                  />
                )}
              </>
            ) : (
              <MetaRow label="Saldo atual" value={formatCurrency(cofrinho.saldo_atual)} />
            )}

            {cofrinho.meta_valor && (
              <>
                <MetaRow
                  label="Meta"
                  value={formatCurrency(cofrinho.meta_valor)}
                  sub={cofrinho.data_alvo ? `Prazo: ${formatDate(cofrinho.data_alvo)}` : undefined}
                />
                <div className="py-2.5">
                  <div className="flex items-center justify-between mb-1.5 text-[11px]">
                    <span className="text-white/35 font-semibold uppercase tracking-widest">Progresso</span>
                    <span className={cn("font-bold", progress! >= 100 ? "text-emerald-400" : "text-amber-300")}>
                      {Math.round(progress!)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={cn("h-full rounded-full transition-all", progress! >= 100 ? "bg-emerald-400" : "bg-amber-400")}
                      style={{ width: `${Math.round(progress!)}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {cofrinho.data_alvo && !cofrinho.meta_valor && (
              <MetaRow
                label="Data alvo"
                value={
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 text-white/40" />
                    {formatDate(cofrinho.data_alvo)}
                  </span>
                }
              />
            )}
          </div>

          {/* Observações */}
          {cofrinho.observacoes && (
            <div className="mx-5 mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Observações</p>
              <p className="text-xs text-white/55 leading-relaxed">{cofrinho.observacoes}</p>
            </div>
          )}

          {/* Histórico */}
          <div className="mx-5 mt-4 mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Histórico</p>
            {loadingMov ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-white/[0.06]" />
                ))}
              </div>
            ) : movimentacoes.length === 0 ? (
              <p className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-3 text-xs text-white/30">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              <div className="space-y-1.5">
                {movimentacoes.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-white/70">{TIPO_LABEL[mov.tipo]}</span>
                      {mov.tipo === "adicao_cotas" && mov.quantidade_cotas && (
                        <span className="ml-2 text-emerald-300/60">
                          +{Number(mov.quantidade_cotas).toLocaleString("pt-BR")} cotas
                          {mov.valor_cota ? ` @ ${formatCurrency(mov.valor_cota)}` : ""}
                        </span>
                      )}
                      {mov.observacoes && (
                        <span className="ml-2 text-white/30 truncate">{mov.observacoes}</span>
                      )}
                    </div>
                    <div className="ml-3 shrink-0 text-right">
                      {mov.valor != null && (
                        <p className="font-semibold tabular-nums text-emerald-300">
                          {formatCurrency(mov.valor)}
                        </p>
                      )}
                      <p className="text-white/30">
                        {format(new Date(mov.created_at), "dd/MM/yy HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { onClose(); onEditar(cofrinho); }}
              className="gap-1.5 text-white/60 hover:text-white/90"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              size="sm"
              onClick={() => { onClose(); onDepositar(cofrinho); }}
              className={cn(
                "gap-1.5 border",
                isAcao
                  ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                  : "border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {isAcao ? "Adicionar cotas" : "Depositar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
