"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Wallet,
  XCircle,
  Pencil,
  RefreshCw,
  Repeat,
  AlignLeft,
  TrendingDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssinaturaDetail {
  id: string;
  descricao: string;
  valor: number;
  forma_pagamento: "cartao_credito" | "cartao_debito";
  cartao_id?: string;
  cartao_apelido?: string;
  cartao_bandeira?: string;
  cartao_cor?: string;
  categoria_id?: number;
  dia_cobranca: number;
  data_inicio: string;
  data_cancelamento?: string;
  ativa: boolean;
  observacoes?: string;
  categoria?: { nome: string; cor: string };
  total_lancamentos?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  assinatura: AssinaturaDetail | null;
  onEdit: (a: AssinaturaDetail) => void;
  onCancel: (a: AssinaturaDetail) => void;
  onReativar: (a: AssinaturaDetail) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(date?: string | null) {
  if (!date) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T12:00:00`)
    : new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("pt-BR");
}

function Row({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <div className="h-7 w-7 shrink-0 rounded-lg bg-violet-500/10 flex items-center justify-center mt-0.5">
        <Icon className="h-3.5 w-3.5 text-violet-400/70" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
          {label}
        </span>
        <span className={`text-sm font-medium text-white/85 ${valueClassName ?? ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssinaturaDetailDialog({
  open,
  onClose,
  assinatura,
  onEdit,
  onCancel,
  onReativar,
}: Props) {
  if (!assinatura) return null;

  const a = assinatura;
  const dataInicio = fmtDate(a.data_inicio);
  const dataCancelamento = fmtDate(a.data_cancelamento);
  const valorAnual = Number(a.valor) * 12;
  const formaPgtoLabel =
    a.forma_pagamento === "cartao_credito" ? "Cartão de Crédito" : "Cartão de Débito";
  const FormaPgtoIcon = a.forma_pagamento === "cartao_credito" ? CreditCard : Wallet;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header */}
        <div
          className={`flex items-start gap-3.5 px-5 py-4 border-b ${
            a.ativa
              ? "border-violet-400/[0.15] bg-gradient-to-br from-violet-950/60 via-violet-900/30 to-transparent"
              : "border-white/[0.07] bg-white/[0.025]"
          }`}
        >
          {/* Glow top line */}
          {a.ativa && (
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
          )}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
              a.ativa
                ? "bg-violet-500/20 ring-violet-400/30"
                : "bg-white/[0.06] ring-white/10"
            }`}
          >
            <Repeat
              className={`h-5 w-5 ${a.ativa ? "text-violet-300" : "text-white/40"}`}
            />
          </div>
          <DialogHeader className="space-y-1 flex-1 min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight text-white truncate pr-8">
              {a.descricao}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {a.ativa ? (
                <Badge variant="violet">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativa
                </Badge>
              ) : (
                <Badge variant="slate">
                  <XCircle className="h-3 w-3" />
                  Cancelada
                </Badge>
              )}
              {a.categoria && (
                <span className="flex items-center gap-1 text-[11px] text-white/40">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: a.categoria.cor }}
                  />
                  {a.categoria.nome}
                </span>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Valor destacado */}
        <div
          className={`px-5 py-4 border-b ${
            a.ativa
              ? "border-violet-400/[0.10] bg-violet-500/[0.04]"
              : "border-white/[0.05] bg-transparent"
          }`}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1">
                Valor mensal
              </p>
              <div className="flex items-baseline gap-1 leading-none">
                <span className="text-sm font-bold text-violet-300/50">R$</span>
                <span className="text-3xl font-bold tabular-nums text-violet-300">
                  {Number(a.valor).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xs text-violet-300/40">/mês</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25 mb-1">
                Estimativa anual
              </p>
              <div className="flex items-baseline gap-1 leading-none justify-end">
                <span className="text-xs font-bold text-violet-300/30">R$</span>
                <span className="text-base tabular-nums font-semibold text-violet-300/50">
                  {valorAnual.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="px-5 py-1 overflow-y-auto max-h-[40vh]">
          <Row
            icon={CalendarDays}
            label="Dia de cobrança"
            value={`Todo dia ${a.dia_cobranca} do mês`}
          />

          {dataInicio && (
            <Row
              icon={CalendarDays}
              label="Data de início"
              value={dataInicio}
            />
          )}

          {dataCancelamento && (
            <Row
              icon={XCircle}
              label="Cancelada em"
              value={dataCancelamento}
              valueClassName="text-rose-400/90"
            />
          )}

          <Row
            icon={FormaPgtoIcon}
            label="Forma de pagamento"
            value={formaPgtoLabel}
          />

          {a.cartao_apelido && (
            <Row
              icon={CreditCard}
              label="Cartão"
              value={
                <span className="flex items-center gap-2">
                  {a.cartao_cor && (
                    <span
                      className="h-3 w-3 rounded-sm shrink-0"
                      style={{ background: a.cartao_cor }}
                    />
                  )}
                  {a.cartao_apelido}
                  {a.cartao_bandeira && (
                    <span className="text-white/35 text-xs capitalize">
                      ({a.cartao_bandeira})
                    </span>
                  )}
                </span>
              }
            />
          )}

          {a.total_lancamentos !== undefined && (
            <Row
              icon={TrendingDown}
              label="Lançamentos gerados"
              value={`${a.total_lancamentos} cobrança${a.total_lancamentos !== 1 ? "s" : ""}`}
            />
          )}

          {a.observacoes && (
            <Row
              icon={AlignLeft}
              label="Observações"
              value={a.observacoes}
            />
          )}
        </div>

        {/* Footer — ações */}
        <div
          className={`flex items-center justify-between gap-2 px-5 py-3 border-t ${
            a.ativa
              ? "border-violet-400/[0.12] bg-violet-500/[0.04]"
              : "border-white/[0.07] bg-transparent"
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-3 text-violet-300/70 hover:text-violet-200 hover:bg-violet-500/20"
            onClick={() => {
              onClose();
              onEdit(a);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>

          <div className="flex gap-1.5">
            {a.ativa ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-3 text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10"
                onClick={() => {
                  onClose();
                  onCancel(a);
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-3 text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10"
                onClick={() => {
                  onClose();
                  onReativar(a);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reativar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
