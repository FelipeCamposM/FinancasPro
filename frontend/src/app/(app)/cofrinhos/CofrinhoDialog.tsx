"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlignLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Flag,
  Landmark,
  Loader2,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export type CofrinhoTipo = "acao" | "conta";

export interface Cofrinho {
  id: string;
  tipo: CofrinhoTipo;
  nome: string;
  saldo_atual: number;
  meta_valor: number | null;
  ticker: string | null;
  quantidade_cotas: number | null;
  valor_cota: number | null;
  instituicao: string | null;
  data_alvo: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface Movimentacao {
  id: string;
  tipo: "deposito" | "adicao_cotas" | "ajuste" | "retirada";
  valor: number | null;
  quantidade_cotas: number | null;
  valor_cota: number | null;
  observacoes: string | null;
  created_at: string;
}

const formSchema = z
  .object({
    tipo: z.enum(["acao", "conta"]),
    nome: z.string().min(1, "Nome obrigatório").max(120),
    saldo_atual: z.number().min(0, "Informe zero ou mais").optional(),
    meta_valor: z.number().positive("Meta deve ser positiva").optional(),
    ticker: z.string().max(12).optional(),
    quantidade_cotas: z.number().positive("Quantidade deve ser positiva").optional(),
    valor_cota: z.number().positive("Valor da cota deve ser positivo").optional(),
    instituicao: z.string().max(120).optional(),
    data_alvo: z.string().optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine((data) => data.tipo !== "acao" || !!data.ticker?.trim(), {
    message: "Ticker obrigatório",
    path: ["ticker"],
  })
  .refine((data) => data.tipo !== "acao" || !!data.quantidade_cotas, {
    message: "Quantidade obrigatória",
    path: ["quantidade_cotas"],
  })
  .refine((data) => data.tipo !== "acao" || !!data.valor_cota, {
    message: "Valor da cota obrigatório",
    path: ["valor_cota"],
  });

type FormValues = z.infer<typeof formSchema>;

const tipoConfig = {
  acao: {
    label: "Ação",
    icon: TrendingUp,
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
    desc: "Ticker, cotas e valor de mercado",
  },
  conta: {
    label: "Conta",
    icon: Landmark,
    color: "text-blue-300",
    bg: "bg-blue-500/15",
    desc: "Banco, carteira ou corretora",
  },
} as const;

const TIPO_LABEL: Record<Movimentacao["tipo"], string> = {
  deposito: "Depósito",
  adicao_cotas: "Adição de cotas",
  ajuste: "Ajuste",
  retirada: "Retirada",
};

interface Props {
  open: boolean;
  tipo: CofrinhoTipo;
  cofrinho?: Cofrinho | null;
  onClose: () => void;
  onSuccess: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
      {children}
    </p>
  );
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );
}

export function CofrinhoDialog({ open, tipo, cofrinho, onClose, onSuccess }: Props) {
  const isEdit = !!cofrinho;
  const currentTipo = cofrinho?.tipo ?? tipo;
  const config = tipoConfig[currentTipo];
  const Icon = config.icon;

  const [showObjetivo, setShowObjetivo] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: currentTipo,
      nome: "",
      saldo_atual: 0,
      meta_valor: undefined,
      ticker: "",
      quantidade_cotas: undefined,
      valor_cota: undefined,
      instituicao: "",
      data_alvo: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    setShowObjetivo(!!cofrinho?.meta_valor);

    form.reset({
      tipo: currentTipo,
      nome: cofrinho?.nome ?? "",
      saldo_atual: cofrinho?.tipo === "conta" ? Number(cofrinho?.saldo_atual ?? 0) : 0,
      meta_valor: cofrinho?.meta_valor ? Number(cofrinho.meta_valor) : undefined,
      ticker: cofrinho?.ticker ?? "",
      quantidade_cotas: cofrinho?.quantidade_cotas
        ? Number(cofrinho.quantidade_cotas)
        : undefined,
      valor_cota: cofrinho?.valor_cota ? Number(cofrinho.valor_cota) : undefined,
      instituicao: cofrinho?.instituicao ?? "",
      data_alvo: cofrinho?.data_alvo?.slice(0, 10) ?? "",
      observacoes: cofrinho?.observacoes ?? "",
    });
  }, [cofrinho, currentTipo, form, open]);

  useEffect(() => {
    if (!open || !isEdit || !cofrinho?.id) return;
    setLoadingMov(true);
    api
      .get<{ data: Movimentacao[] }>(`/cofrinhos/${cofrinho.id}/movimentacoes`)
      .then(({ data }) => setMovimentacoes(data.data))
      .catch(() => setMovimentacoes([]))
      .finally(() => setLoadingMov(false));
  }, [open, isEdit, cofrinho?.id]);

  const watchedQtd = form.watch("quantidade_cotas");
  const watchedVc = form.watch("valor_cota");
  const saldoCalculado =
    currentTipo === "acao"
      ? (Number(watchedQtd ?? 0) * Number(watchedVc ?? 0))
      : 0;

  async function onSubmit(values: FormValues) {
    const isAcao = values.tipo === "acao";
    const payload = {
      tipo: values.tipo,
      nome: values.nome.trim(),
      saldo_atual: isAcao ? undefined : (values.saldo_atual ?? 0),
      ticker: isAcao ? values.ticker?.trim().toUpperCase() : null,
      quantidade_cotas: isAcao ? values.quantidade_cotas : null,
      valor_cota: isAcao ? values.valor_cota : null,
      instituicao: !isAcao && values.instituicao?.trim() ? values.instituicao.trim() : null,
      meta_valor: showObjetivo ? (values.meta_valor ?? null) : null,
      data_alvo: showObjetivo && values.data_alvo ? values.data_alvo : null,
      observacoes: values.observacoes?.trim() || null,
    };

    try {
      if (isEdit) {
        await api.put(`/cofrinhos/${cofrinho!.id}`, payload);
        toast.success("Cofrinho atualizado");
      } else {
        await api.post("/cofrinhos", payload);
        toast.success("Cofrinho criado");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar cofrinho");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="flex items-center gap-3.5 border-b border-white/[0.08] px-5 py-4">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
            {isEdit ? (
              <Pencil className={`h-4 w-4 ${config.color}`} />
            ) : (
              <Plus className={`h-4 w-4 ${config.color}`} />
            )}
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold leading-none">
              {isEdit ? "Editar cofrinho" : `Nova ${config.label.toLowerCase()}`}
            </DialogTitle>
            <p className="mt-1 text-xs text-white/40">{config.desc}</p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="max-h-[calc(100dvh-14rem)] space-y-5 overflow-y-auto px-5 py-5 sm:max-h-[62vh]">

              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>
                      <span className="flex items-center gap-1">
                        <PiggyBank className="h-2.5 w-2.5" /> Nome
                      </span>
                    </SectionLabel>
                    <FormControl>
                      <Input
                        placeholder={currentTipo === "acao" ? "Ex: Banco do Brasil" : "Ex: Poupança Caixa"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campos de Ação */}
              {currentTipo === "acao" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="ticker"
                      render={({ field }) => (
                        <FormItem>
                          <SectionLabel>
                            <span className="flex items-center gap-1">
                              <Flag className="h-2.5 w-2.5" /> Ticker
                            </span>
                          </SectionLabel>
                          <FormControl>
                            <Input
                              placeholder="PETR4"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantidade_cotas"
                      render={({ field }) => (
                        <FormItem>
                          <SectionLabel>Cotas</SectionLabel>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="valor_cota"
                      render={({ field }) => (
                        <FormItem>
                          <SectionLabel>Valor da cota</SectionLabel>
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
                    <div className="rounded-xl border border-dashed border-emerald-400/20 bg-emerald-500/[0.06] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-1">
                        Total calculado
                      </p>
                      <p className="text-sm font-bold tabular-nums text-emerald-300">
                        {formatCurrency(saldoCalculado)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Campos de Conta */}
              {currentTipo === "conta" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="saldo_atual"
                    render={({ field }) => (
                      <FormItem>
                        <SectionLabel>Saldo atual</SectionLabel>
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
                  <FormField
                    control={form.control}
                    name="instituicao"
                    render={({ field }) => (
                      <FormItem>
                        <SectionLabel>
                          <span className="flex items-center gap-1">
                            <Landmark className="h-2.5 w-2.5" /> Instituição
                          </span>
                        </SectionLabel>
                        <FormControl>
                          <Input placeholder="Banco, corretora..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Seção Objetivo (colapsável) */}
              <div className="rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowObjetivo(!showObjetivo)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-white/60">
                    <Target className="h-3.5 w-3.5 text-amber-300/70" />
                    Objetivo (opcional)
                  </span>
                  {showObjetivo ? (
                    <ChevronUp className="h-3.5 w-3.5 text-white/35" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-white/35" />
                  )}
                </button>

                {showObjetivo && (
                  <div className="grid grid-cols-2 gap-3 border-t border-white/[0.08] px-4 pb-4 pt-3">
                    <FormField
                      control={form.control}
                      name="meta_valor"
                      render={({ field }) => (
                        <FormItem>
                          <SectionLabel>
                            <span className="flex items-center gap-1">
                              <Target className="h-2.5 w-2.5" /> Meta
                            </span>
                          </SectionLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/35">
                                R$
                              </span>
                              <CurrencyInput
                                value={field.value}
                                onChange={field.onChange}
                                className="pl-9 font-bold tabular-nums text-amber-300"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="data_alvo"
                      render={({ field }) => (
                        <FormItem>
                          <SectionLabel>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" /> Data alvo
                            </span>
                          </SectionLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="h-2.5 w-2.5" /> Observações
                      </span>
                    </SectionLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionais..."
                        rows={2}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Histórico (só em edição) */}
              {isEdit && (
                <div>
                  <SectionLabel>Histórico de movimentações</SectionLabel>
                  {loadingMov ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : movimentacoes.length === 0 ? (
                    <p className="rounded-lg bg-white/[0.03] px-3 py-3 text-xs text-white/35">
                      Nenhuma movimentação registrada ainda.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {movimentacoes.map((mov) => (
                        <div
                          key={mov.id}
                          className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-semibold text-white/70">
                              {TIPO_LABEL[mov.tipo]}
                            </span>
                            {mov.observacoes && (
                              <span className="ml-2 text-white/35 truncate">
                                {mov.observacoes}
                              </span>
                            )}
                            {mov.tipo === "adicao_cotas" && mov.quantidade_cotas && (
                              <span className="ml-2 text-emerald-300/60">
                                +{Number(mov.quantidade_cotas).toLocaleString("pt-BR")} cotas
                                {mov.valor_cota ? ` @ ${formatCurrency(mov.valor_cota)}` : ""}
                              </span>
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
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={form.formState.isSubmitting}
                className={`min-w-28 border ${
                  currentTipo === "acao"
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200"
                    : "border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
                }`}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEdit ? (
                  "Salvar"
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
