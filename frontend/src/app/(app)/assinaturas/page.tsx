"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Repeat,
  Banknote,
  CreditCard,
  Wallet,
  Smartphone,
  ArrowLeftRight,
  MoreHorizontal,
  CalendarDays,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Pencil,
  AlertTriangle,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { AssinaturaDialog } from "./AssinaturaDialog";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

interface Assinatura {
  id: string;
  descricao: string;
  valor: number;
  forma_pagamento: "cartao_credito" | "cartao_debito";
  cartao_id?: string;
  categoria_id?: number;
  dia_cobranca: number;
  data_inicio: string;
  data_cancelamento?: string;
  ativa: boolean;
  observacoes?: string;
  categoria?: { nome: string; cor: string };
}

const FORMA_PGTO_LABEL: Record<
  string,
  { label: string; icon: typeof Banknote }
> = {
  dinheiro: { label: "Dinheiro", icon: Banknote },
  cartao_credito: { label: "Crédito", icon: CreditCard },
  cartao_debito: { label: "Débito", icon: Wallet },
  pix: { label: "Pix", icon: Smartphone },
  transferencia: { label: "Transf.", icon: ArrowLeftRight },
  outro: { label: "Outro", icon: MoreHorizontal },
};

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(date: string) {
  return new Date(date + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function AssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Assinatura | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [editTarget, setEditTarget] = useState<Assinatura | null>(null);
  const [editDescricao, setEditDescricao] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editDiaCobranca, setEditDiaCobranca] = useState("");
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [reativarTarget, setReativarTarget] = useState<Assinatura | null>(null);
  const [reativando, setReativando] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = mostrarInativas ? "/assinaturas?ativa=false" : "/assinaturas";
      const res = await api.get<{ data: Assinatura[] }>(url);
      setAssinaturas(res.data.data ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
  }, [mostrarInativas]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancelar() {
    if (!cancelTarget) return;
    setCancelando(true);
    try {
      await api.post(`/assinaturas/${cancelTarget.id}/cancelar`, {});
      toast.success("Assinatura cancelada — cobranças futuras removidas");
      setCancelTarget(null);
      load();
    } catch {
      toast.error("Erro ao cancelar assinatura");
    } finally {
      setCancelando(false);
    }
  }

  function openEdit(a: Assinatura) {
    setEditTarget(a);
  }

  async function handleEditar() {
    if (!editTarget) return;
    const valor = parseFloat(editValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast.error("Valor inválido");
      return;
    }
    const dia = parseInt(editDiaCobranca, 10);
    if (isNaN(dia) || dia < 1 || dia > 31) {
      toast.error("Dia de cobrança inválido (1–31)");
      return;
    }
    setSalvandoEdit(true);
    try {
      await api.put(`/assinaturas/${editTarget.id}`, {
        descricao: editDescricao.trim() || undefined,
        valor,
        dia_cobranca: dia,
      });
      toast.success("Assinatura atualizada");
      setEditTarget(null);
      load();
    } catch {
      toast.error("Erro ao atualizar assinatura");
    } finally {
      setSalvandoEdit(false);
    }
  }

  async function handleReativar() {
    if (!reativarTarget) return;
    setReativando(true);
    try {
      await api.post(`/assinaturas/${reativarTarget.id}/reativar`);
      toast.success("Assinatura reativada — próximos 24 meses lançados");
      setReativarTarget(null);
      load();
    } catch {
      toast.error("Erro ao reativar assinatura");
    } finally {
      setReativando(false);
    }
  }

  const ativas = assinaturas.filter((a) => a.ativa);
  const inativas = assinaturas.filter((a) => !a.ativa);
  const totalMensal = ativas.reduce((acc, a) => acc + Number(a.valor), 0);
  const totalAnual = totalMensal * 12;

  return (
    <PageShell contentClassName="space-y-5">
      {/* Cabeçalho */}
      <SectionHeader
        title="Assinaturas"
        titleColor="text-violet-400"
        description="Cobranças recorrentes mensais"
        actions={
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:flex-wrap sm:justify-end">
            {!loading && ativas.length > 0 && (
              <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-center backdrop-blur-xl sm:text-right">
                <p className="text-xs text-violet-300/70 font-medium uppercase tracking-wider">
                  Total mensal
                </p>
                <p className="text-lg font-bold text-violet-300">
                  {fmt(totalMensal)}
                </p>
              </div>
            )}

            <div className="flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 sm:border-0 sm:bg-transparent sm:px-0">
              <Switch
                id="inativas"
                checked={mostrarInativas}
                onCheckedChange={setMostrarInativas}
              />
              <Label
                htmlFor="inativas"
                className="text-sm cursor-pointer text-white/70"
              >
                Mostrar inativas
              </Label>
            </div>

            <Button
              onClick={() => setDialogOpen(true)}
              variant="default"
              className="w-full rounded-xl border border-violet-300/30 bg-gradient-to-br from-violet-500/90 via-violet-500/75 to-violet-700/90 text-white shadow-lg shadow-violet-950/25 ring-1 ring-white/[0.10] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200/50 hover:from-violet-400/95 hover:via-violet-500/85 hover:to-violet-600/95 hover:shadow-violet-500/20 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova assinatura
            </Button>
          </div>
        }
      />

      {!loading && !loadError && assinaturas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ui-stagger">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-violet-300/80 font-semibold">
                Assinaturas ativas
              </p>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {ativas.length}
            </p>
            <p className="text-xs text-violet-300/50 mt-0.5">Cobranças em ciclo atual</p>
          </div>

          <div className="rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                <XCircle className="h-3.5 w-3.5 text-white/40" />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                Inativas
              </p>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {inativas.length}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Histórico pausado/cancelado</p>
          </div>

          <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.05] p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <TrendingDown className="h-3.5 w-3.5 text-violet-300" />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-violet-300/70 font-semibold">
                Custo anual estimado
              </p>
            </div>
            <p className="text-2xl font-bold text-violet-300 tabular-nums">
              {fmt(totalAnual)}
            </p>
            <p className="text-xs text-violet-300/40 mt-0.5">
              {fmt(totalMensal)}/mês com base nas ativas
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ui-stagger">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <PageDataState
          mode="error"
          icon={AlertTriangle}
          title="Não foi possível carregar as assinaturas"
          description="Tente novamente para buscar as cobranças recorrentes."
          onAction={load}
        />
      ) : assinaturas.length === 0 ? (
        <PageDataState
          mode="empty"
          icon={Repeat}
          title="Nenhuma assinatura encontrada"
          description={
            mostrarInativas
              ? "Não existem assinaturas inativas para o filtro atual."
              : "Cadastre uma nova assinatura para acompanhar cobranças recorrentes."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ui-stagger">
          {assinaturas.map((a) => {
            const pgto = FORMA_PGTO_LABEL[a.forma_pagamento] ?? {
              label: a.forma_pagamento,
              icon: MoreHorizontal,
            };
            const Icon = pgto.icon;

            return (
              <div
                key={a.id}
                className={`relative rounded-2xl border flex flex-col gap-0 transition-all backdrop-blur-xl overflow-hidden ${
                  a.ativa
                    ? "border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-violet-900/20 to-transparent hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-0.5"
                    : "border-white/[0.07] bg-white/[0.025] opacity-55 grayscale-[30%]"
                }`}
              >
                {/* Top glow bar */}
                {a.ativa && (
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
                )}

                {/* Body */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {/* Status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base leading-tight truncate text-white">
                        {a.descricao}
                      </p>
                      {a.categoria && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: a.categoria.cor }}
                          />
                          <span className="text-[11px] text-white/40">
                            {a.categoria.nome}
                          </span>
                        </div>
                      )}
                    </div>
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
                  </div>

                  {/* Valor destacado */}
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1 leading-none">
                      <span className="text-sm font-bold text-violet-300/50 select-none">R$</span>
                      <span className="text-3xl font-bold tabular-nums text-violet-300">
                        {Number(a.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-violet-300/40 font-medium">/mês</span>
                    </div>
                    <div className="flex items-baseline gap-1 leading-none">
                      <span className="text-[10px] font-semibold text-violet-300/30 select-none">R$</span>
                      <span className="text-xs tabular-nums text-violet-300/30 font-medium">
                        {(Number(a.valor) * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-violet-300/25">/ano estimado</span>
                    </div>
                  </div>

                  {/* Detalhes */}
                  <div className="flex flex-col gap-1.5 text-xs text-white/45">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                      <span>
                        Cobra todo dia{" "}
                        <span className="font-bold text-violet-300/80">
                          {a.dia_cobranca}
                        </span>
                        {" "}— desde {fmtDate(a.data_inicio)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                      <span>{pgto.label}</span>
                    </div>
                    {a.data_cancelamento && (
                      <div className="flex items-center gap-1.5 text-rose-400/80">
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Cancelada em {fmtDate(a.data_cancelamento)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do card */}
                <div className="border-t border-violet-400/[0.12] bg-violet-500/[0.05] px-5 py-2.5 flex items-center justify-end gap-0.5">
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 px-2.5 text-violet-300/70 hover:text-violet-200 hover:bg-violet-500/20"
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                    {a.ativa ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2.5 text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10"
                        onClick={() => setCancelTarget(a)}
                      >
                        <XCircle className="h-3 w-3" />
                        Cancelar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2.5 text-blue-400/70 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={() => setReativarTarget(a)}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog para criar nova assinatura */}
      <AssinaturaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={load}
      />

      <AssinaturaDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          load();
        }}
        initialData={editTarget}
      />

      {/* Dialog de edição */}
      <Dialog
        open={false}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-violet-400" />
              Editar assinatura
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Se o dia de cobrança for alterado, os lançamentos pendentes serão
              removidos e recriados com a nova data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Input
                id="edit-descricao"
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                placeholder="Nome da assinatura"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-valor">Valor mensal (R$)</Label>
              <Input
                id="edit-valor"
                type="number"
                min="0.01"
                step="0.01"
                value={editValor}
                onChange={(e) => setEditValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-dia">Dia de cobrança</Label>
              <Input
                id="edit-dia"
                type="number"
                min="1"
                max="31"
                step="1"
                value={editDiaCobranca}
                onChange={(e) => setEditDiaCobranca(e.target.value)}
                placeholder="1–31"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={salvandoEdit}
            >
              Cancelar
            </Button>
            <Button
              className="bg-violet-500/20 border border-violet-400/40 text-violet-300 hover:bg-violet-500/30 hover:text-violet-200"
              onClick={handleEditar}
              disabled={salvandoEdit}
            >
              {salvandoEdit && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert de confirmação de reativação */}
      <AlertDialog
        open={!!reativarTarget}
        onOpenChange={(v) => !v && setReativarTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              Reativar assinatura
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai reativar <strong>{reativarTarget?.descricao}</strong> e
              gerar os próximos <strong>24 meses</strong> de cobranças pendentes
              a partir do mês atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reativando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReativar}
              disabled={reativando}
              className="bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30 gap-2"
            >
              {reativando ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Confirmar reativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert de confirmação de cancelamento */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-400" />
              Cancelar assinatura
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cancela a assinatura{" "}
              <strong>{cancelTarget?.descricao}</strong> e remove as cobranças
              futuras. Se o dia de cobrança do mês atual já passou, esse mês
              ainda será cobrado. Lançamentos pagos são mantidos no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={cancelando}
              className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30 gap-2"
            >
              {cancelando ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
