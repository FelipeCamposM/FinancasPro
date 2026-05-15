"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Landmark, Loader2, Plus, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Cofrinho } from "./CofrinhoDialog";

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
      {children}
    </p>
  );
}

const contaSchema = z.object({
  valor: z.number().positive("Valor deve ser positivo"),
  observacoes: z.string().max(1000).optional(),
});

const acaoSchema = z.object({
  quantidade_cotas: z.number().positive("Quantidade deve ser positiva"),
  valor_cota: z.number().positive("Valor da cota deve ser positivo"),
  observacoes: z.string().max(1000).optional(),
});

type ContaValues = z.infer<typeof contaSchema>;
type AcaoValues = z.infer<typeof acaoSchema>;

interface Props {
  cofrinho: Cofrinho | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function DepositarContaForm({
  cofrinho,
  onClose,
  onSuccess,
}: {
  cofrinho: Cofrinho;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<ContaValues>({
    resolver: zodResolver(contaSchema),
    defaultValues: { valor: undefined, observacoes: "" },
  });

  const watchedValor = form.watch("valor");
  const novoSaldo = Number(cofrinho.saldo_atual ?? 0) + Number(watchedValor ?? 0);

  async function onSubmit(values: ContaValues) {
    try {
      await api.post(`/cofrinhos/${cofrinho.id}/depositar`, values);
      toast.success("Depósito registrado");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao registrar depósito");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-5 px-5 py-5">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <SectionLabel>Valor do depósito</SectionLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/35">
                      R$
                    </span>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      className="pl-9 font-bold tabular-nums text-blue-300"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedValor && watchedValor > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3 text-sm">
              <span className="tabular-nums text-white/50">
                {formatCurrency(cofrinho.saldo_atual)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
              <span className="font-semibold tabular-nums text-blue-300">
                {formatCurrency(novoSaldo)}
              </span>
            </div>
          )}

          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <SectionLabel>Observações (opcional)</SectionLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: salário de maio..."
                    rows={2}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
            className="min-w-28 border border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Depositar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DepositarAcaoForm({
  cofrinho,
  onClose,
  onSuccess,
}: {
  cofrinho: Cofrinho;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<AcaoValues>({
    resolver: zodResolver(acaoSchema),
    defaultValues: {
      quantidade_cotas: undefined,
      valor_cota: cofrinho.valor_cota ? Number(cofrinho.valor_cota) : undefined,
      observacoes: "",
    },
  });

  useEffect(() => {
    form.reset({
      quantidade_cotas: undefined,
      valor_cota: cofrinho.valor_cota ? Number(cofrinho.valor_cota) : undefined,
      observacoes: "",
    });
  }, [cofrinho, form]);

  const watchedQtd = form.watch("quantidade_cotas");
  const watchedVc = form.watch("valor_cota");
  const qtdAtual = Number(cofrinho.quantidade_cotas ?? 0);
  const novaQtd = qtdAtual + Number(watchedQtd ?? 0);
  const novoSaldo = novaQtd * Number(watchedVc ?? 0);

  async function onSubmit(values: AcaoValues) {
    try {
      await api.post(`/cofrinhos/${cofrinho.id}/depositar`, values);
      toast.success("Cotas adicionadas");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao adicionar cotas");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="quantidade_cotas"
              render={({ field }) => (
                <FormItem>
                  <SectionLabel>Qtd de cotas a adicionar</SectionLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="10"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valor_cota"
              render={({ field }) => (
                <FormItem>
                  <SectionLabel>Valor atual da cota</SectionLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/35">
                        R$
                      </span>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        className="pl-9 font-bold tabular-nums text-emerald-300"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {watchedQtd && watchedQtd > 0 && watchedVc && watchedVc > 0 && (
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.06] px-4 py-3 text-sm space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">Cotas</span>
                <span className="tabular-nums text-white/50">
                  {qtdAtual.toLocaleString("pt-BR")}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-white/30" />
                <span className="font-semibold tabular-nums text-emerald-300">
                  {novaQtd.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">Total</span>
                <span className="font-semibold tabular-nums text-emerald-300">
                  {formatCurrency(novoSaldo)}
                </span>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <SectionLabel>Observações (opcional)</SectionLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: compra programada de março..."
                    rows={2}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={form.formState.isSubmitting}
            className="min-w-28 border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Adicionar cotas"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function DepositarDialog({ cofrinho, open, onClose, onSuccess }: Props) {
  if (!cofrinho) return null;

  const isAcao = cofrinho.tipo === "acao";
  const Icon = isAcao ? TrendingUp : Landmark;
  const color = isAcao ? "text-emerald-300" : "text-blue-300";
  const bg = isAcao ? "bg-emerald-500/15" : "bg-blue-500/15";

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex items-center gap-3.5 border-b border-white/[0.08] px-5 py-4">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
            <Plus className={`h-4 w-4 ${color}`} />
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold leading-none">
              {isAcao ? "Adicionar cotas" : "Depositar"} — {cofrinho.nome}
            </DialogTitle>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/40">
              <Icon className="h-3 w-3" />
              {isAcao ? cofrinho.ticker : cofrinho.instituicao || "Conta manual"}
            </p>
          </DialogHeader>
        </div>

        {isAcao ? (
          <DepositarAcaoForm cofrinho={cofrinho} onClose={onClose} onSuccess={onSuccess} />
        ) : (
          <DepositarContaForm cofrinho={cofrinho} onClose={onClose} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}
