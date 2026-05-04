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
  Smartphone,
  ArrowLeftRight,
  MoreHorizontal,
  CalendarDays,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import { GastoDialog } from "../gastos/GastoDialog";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";

interface Assinatura {
  id: string;
  descricao: string;
  valor: number;
  forma_pagamento: string;
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
  cartao_debito: { label: "Débito", icon: CreditCard },
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
      const hoje = new Date().toISOString().split("T")[0];
      await api.post(`/assinaturas/${cancelTarget.id}/cancelar`, {
        data_cancelamento: hoje,
      });
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
    setEditDescricao(a.descricao);
    setEditValor(String(a.valor));
    setEditTarget(a);
  }

  async function handleEditar() {
    if (!editTarget) return;
    const valor = parseFloat(editValor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast.error("Valor inválido");
      return;
    }
    setSalvandoEdit(true);
    try {
      await api.put(`/assinaturas/${editTarget.id}`, {
        descricao: editDescricao.trim() || undefined,
        valor,
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
    <PageShell contentClassName="space-y-6">
      {/* Cabeçalho */}
      <SectionHeader
        title="Assinaturas"
        description="Cobranças recorrentes mensais"
        actions={
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {!loading && ativas.length > 0 && (
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 backdrop-blur px-4 py-2 text-right">
                <p className="text-xs text-violet-300/70 font-medium uppercase tracking-wider">
                  Total mensal
                </p>
                <p className="text-lg font-bold text-violet-300">
                  {fmt(totalMensal)}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
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
              className="gap-2 bg-violet-500/20 border border-violet-400/40 text-violet-300 hover:bg-violet-500/30 hover:text-violet-200 backdrop-blur"
            >
              <Plus className="h-4 w-4" />
              Nova assinatura
            </Button>
          </div>
        }
      />

      {!loading && !loadError && assinaturas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ui-stagger">
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 backdrop-blur-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-violet-300/80 font-semibold">
              Assinaturas ativas
            </p>
            <p className="mt-1 text-lg font-bold text-white tabular-nums">
              {ativas.length}
            </p>
            <p className="text-xs text-white/55">Cobranças em ciclo atual</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/[0.06] backdrop-blur-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
              Assinaturas inativas
            </p>
            <p className="mt-1 text-lg font-bold text-white tabular-nums">
              {inativas.length}
            </p>
            <p className="text-xs text-white/55">Histórico pausado/cancelado</p>
          </div>

          <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 backdrop-blur-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-blue-300/80 font-semibold">
              Custo anual estimado
            </p>
            <p className="mt-1 text-lg font-bold text-white tabular-nums">
              {fmt(totalAnual)}
            </p>
            <p className="text-xs text-white/55">
              Projeção com base nas ativas
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
                className={`relative rounded-xl border p-5 flex flex-col gap-3 transition-all backdrop-blur-xl ${
                  a.ativa
                    ? "border-violet-400/30 bg-violet-500/10 hover:border-violet-400/50 hover:bg-violet-500/15"
                    : "border-white/10 bg-white/[0.04] opacity-60"
                }`}
              >
                {/* Status badge */}
                <div className="absolute top-4 right-4">
                  {a.ativa ? (
                    <Badge
                      variant="outline"
                      className="text-violet-300 border-violet-400/40 bg-violet-500/10 text-[10px] gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Ativa
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-white/40 border-white/20 text-[10px] gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      Cancelada
                    </Badge>
                  )}
                </div>

                {/* Nome + valor */}
                <div className="pr-16">
                  <p className="font-semibold text-base leading-tight truncate text-white">
                    {a.descricao}
                  </p>
                  <p className="text-xl font-bold text-violet-300 mt-1">
                    {fmt(a.valor)}
                    <span className="text-xs text-white/40 font-normal ml-1">
                      /mês
                    </span>
                  </p>
                </div>

                {/* Detalhes */}
                <div className="flex flex-col gap-1.5 text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Todo dia{" "}
                      <strong className="text-white/80">
                        {a.dia_cobranca}
                      </strong>{" "}
                      — inicio em {fmtDate(a.data_inicio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{pgto.label}</span>
                  </div>
                  {a.categoria && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: a.categoria.cor }}
                      />
                      <span>{a.categoria.nome}</span>
                    </div>
                  )}
                  {a.data_cancelamento && (
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Cancelada em {fmtDate(a.data_cancelamento)}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-1 border-t border-white/10 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs flex-1 gap-1.5 text-violet-300 hover:text-violet-200 hover:bg-violet-500/15"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {a.ativa ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs flex-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5"
                      onClick={() => setCancelTarget(a)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1.5"
                      onClick={() => setReativarTarget(a)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reativar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog para criar nova assinatura (reutiliza GastoDialog) */}
      <GastoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={load}
        forceAssinatura
      />

      {/* Dialog de edição */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(v) => !v && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-violet-400" />
              Editar assinatura
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Altere a descrição e/ou o valor. Para assinaturas ativas, os
              lançamentos futuros pendentes serão atualizados automaticamente.
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
              Isso vai remover todos os lançamentos{" "}
              <strong>futuros pendentes</strong> de{" "}
              <strong>{cancelTarget?.descricao}</strong>. Os lançamentos já
              registrados e pagos serão mantidos no histórico.
              <br />
              <br />
              Essa ação não pode ser desfeita.
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
