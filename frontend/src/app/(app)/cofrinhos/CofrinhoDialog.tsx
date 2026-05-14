"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlignLeft,
  Banknote,
  Calendar,
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
import { Textarea } from "@/components/ui/textarea";

export type CofrinhoTipo = "acao" | "conta" | "objetivo";

export interface Cofrinho {
  id: string;
  tipo: CofrinhoTipo;
  nome: string;
  saldo_atual: number;
  meta_valor: number | null;
  ticker: string | null;
  quantidade_cotas: number | null;
  instituicao: string | null;
  data_alvo: string | null;
  observacoes: string | null;
  ativo: boolean;
}

const formSchema = z
  .object({
    tipo: z.enum(["acao", "conta", "objetivo"]),
    nome: z.string().min(1, "Nome obrigat\u00f3rio").max(120),
    saldo_atual: z.number().min(0, "Informe zero ou mais"),
    meta_valor: z.number().positive("Meta deve ser positiva").optional(),
    ticker: z.string().max(12).optional(),
    quantidade_cotas: z.number().positive("Quantidade deve ser positiva").optional(),
    instituicao: z.string().max(120).optional(),
    data_alvo: z.string().optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine((data) => data.tipo !== "acao" || !!data.ticker?.trim(), {
    message: "Ticker obrigat\u00f3rio",
    path: ["ticker"],
  })
  .refine((data) => data.tipo !== "acao" || !!data.quantidade_cotas, {
    message: "Quantidade obrigat\u00f3ria",
    path: ["quantidade_cotas"],
  })
  .refine((data) => data.tipo !== "objetivo" || !!data.meta_valor, {
    message: "Meta obrigat\u00f3ria",
    path: ["meta_valor"],
  });

type FormValues = z.infer<typeof formSchema>;

const tipoConfig = {
  acao: {
    label: "A\u00e7\u00e3o",
    icon: TrendingUp,
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
  },
  conta: {
    label: "Conta",
    icon: Landmark,
    color: "text-blue-300",
    bg: "bg-blue-500/15",
  },
  objetivo: {
    label: "Objetivo",
    icon: Target,
    color: "text-amber-300",
    bg: "bg-amber-500/15",
  },
} as const;

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

export function CofrinhoDialog({
  open,
  tipo,
  cofrinho,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!cofrinho;
  const currentTipo = cofrinho?.tipo ?? tipo;
  const config = tipoConfig[currentTipo];
  const Icon = config.icon;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: currentTipo,
      nome: "",
      saldo_atual: 0,
      meta_valor: undefined,
      ticker: "",
      quantidade_cotas: undefined,
      instituicao: "",
      data_alvo: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      tipo: currentTipo,
      nome: cofrinho?.nome ?? "",
      saldo_atual: Number(cofrinho?.saldo_atual ?? 0),
      meta_valor: cofrinho?.meta_valor ? Number(cofrinho.meta_valor) : undefined,
      ticker: cofrinho?.ticker ?? "",
      quantidade_cotas: cofrinho?.quantidade_cotas
        ? Number(cofrinho.quantidade_cotas)
        : undefined,
      instituicao: cofrinho?.instituicao ?? "",
      data_alvo: cofrinho?.data_alvo?.slice(0, 10) ?? "",
      observacoes: cofrinho?.observacoes ?? "",
    });
  }, [cofrinho, currentTipo, form, open]);

  async function onSubmit(values: FormValues) {
    const payload = {
      tipo: values.tipo,
      nome: values.nome.trim(),
      saldo_atual: values.saldo_atual ?? 0,
      meta_valor: values.tipo === "objetivo" ? values.meta_valor : null,
      ticker: values.tipo === "acao" ? values.ticker?.trim().toUpperCase() : null,
      quantidade_cotas:
        values.tipo === "acao" ? values.quantidade_cotas : null,
      instituicao:
        values.tipo === "conta" && values.instituicao?.trim()
          ? values.instituicao.trim()
          : null,
      data_alvo:
        values.tipo === "objetivo" && values.data_alvo ? values.data_alvo : null,
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
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
          >
            {isEdit ? (
              <Pencil className={`h-4 w-4 ${config.color}`} />
            ) : (
              <Plus className={`h-4 w-4 ${config.color}`} />
            )}
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold leading-none">
              {isEdit ? "Editar cofrinho" : `Novo ${config.label.toLowerCase()}`}
            </DialogTitle>
            <p className="mt-1 text-xs text-white/40">
              Planeje manualmente onde sua grana fica guardada
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="max-h-[calc(100dvh-14rem)] space-y-5 overflow-y-auto px-5 py-5 sm:max-h-[62vh]">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-2 ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${config.color}`}>
                      {config.label}
                    </p>
                    <p className="text-xs text-white/35">
                      {currentTipo === "acao"
                        ? "Ticker, cotas e valor manual"
                        : currentTipo === "conta"
                          ? "Banco, carteira ou corretora"
                          : "Meta com progresso manual"}
                    </p>
                  </div>
                </div>
              </div>

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
                        placeholder={
                          currentTipo === "objetivo"
                            ? "Ex: Viagem"
                            : currentTipo === "acao"
                              ? "Ex: Banco do Brasil"
                            : "Ex: Poupan\u00e7a Caixa"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentTipo === "acao" && (
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
                            onChange={(event) =>
                              field.onChange(event.target.value.toUpperCase())
                            }
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
                            onChange={(event) =>
                              field.onChange(
                                event.target.value
                                  ? Number(event.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentTipo === "conta" && (
                <FormField
                  control={form.control}
                  name="instituicao"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <Landmark className="h-2.5 w-2.5" />{" "}
                          {"Institui\u00e7\u00e3o"}
                        </span>
                      </SectionLabel>
                      <FormControl>
                        <Input placeholder="Banco, corretora..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="saldo_atual"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <Banknote className="h-2.5 w-2.5" /> Guardado
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
                            className="pl-9 font-bold tabular-nums text-emerald-300"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentTipo === "objetivo" && (
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
                )}

                {currentTipo !== "objetivo" && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-xs text-white/35">
                    {
                      "Valor informado manualmente. Sem cota\u00e7\u00e3o autom\u00e1tica nesta vers\u00e3o."
                    }
                  </div>
                )}
              </div>

              {currentTipo === "objetivo" && (
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
              )}

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="h-2.5 w-2.5" />{" "}
                        {"Observa\u00e7\u00f5es"}
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
