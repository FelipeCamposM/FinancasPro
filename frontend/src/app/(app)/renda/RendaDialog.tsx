"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Building2,
  CalendarDays,
  Calendar,
  Repeat,
  AlignLeft,
  Info,
  Plus,
  Pencil,
  Briefcase,
  Zap,
  TrendingUp,
  Home,
  Gift,
  CircleDollarSign,
} from "lucide-react";

const frequencias = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
] as const;

type FrequenciaValue = (typeof frequencias)[number]["value"];

const TIPOS = [
  {
    value: "salario",
    label: "Salário",
    icon: Briefcase,
    idle: "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20",
    active: "bg-blue-500/30 border-blue-400/60 text-blue-200",
  },
  {
    value: "freelance",
    label: "Freelance",
    icon: Zap,
    idle: "bg-violet-500/10 border-violet-400/30 text-violet-300 hover:bg-violet-500/20",
    active: "bg-violet-500/30 border-violet-400/60 text-violet-200",
  },
  {
    value: "investimento",
    label: "Investimento",
    icon: TrendingUp,
    idle: "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20",
    active: "bg-blue-500/30 border-blue-400/60 text-blue-200",
  },
  {
    value: "aluguel",
    label: "Aluguel",
    icon: Home,
    idle: "bg-orange-500/10 border-orange-400/30 text-orange-300 hover:bg-orange-500/20",
    active: "bg-orange-500/30 border-orange-400/60 text-orange-200",
  },
  {
    value: "bonus",
    label: "Bônus",
    icon: Gift,
    idle: "bg-yellow-500/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/20",
    active: "bg-yellow-500/30 border-yellow-400/60 text-yellow-200",
  },
  {
    value: "outro",
    label: "Outro",
    icon: CircleDollarSign,
    idle: "bg-white/[0.06] border-white/15 text-white/60 hover:bg-white/[0.10]",
    active: "bg-white/[0.15] border-white/30 text-white",
  },
] as const;

const formSchema = z
  .object({
    descricao: z.string().min(1, "Descrição obrigatória").max(255),
    valor: z.number().positive("Deve ser positivo"),
    tipo: z.enum([
      "salario",
      "freelance",
      "investimento",
      "aluguel",
      "bonus",
      "outro",
    ]),
    origem: z.string().min(1, "Origem obrigatória").max(100),
    mes_referencia: z.string().min(1, "Mês de referência obrigatório"),
    data_recebimento: z.string().min(1, "Data de recebimento obrigatória"),
    recorrente: z.boolean(),
    frequencia_recorrencia: z
      .enum([
        "diario",
        "semanal",
        "quinzenal",
        "mensal",
        "bimestral",
        "trimestral",
        "semestral",
        "anual",
      ])
      .optional(),
    data_fim_recorrencia: z.string().optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine((d) => (d.recorrente ? !!d.frequencia_recorrencia : true), {
    message: "Selecione a frequência da recorrência",
    path: ["frequencia_recorrencia"],
  });

type FormValues = z.infer<typeof formSchema>;

interface Renda {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  origem: string;
  mes_referencia: string;
  data_recebimento: string;
  recorrente?: boolean;
  frequencia_recorrencia?: string | null;
  data_fim_recorrencia?: string | null;
  observacoes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  renda?: Renda | null;
}

export function RendaDialog({ open, onClose, onSuccess, renda }: Props) {
  const isEdit = !!renda;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor: undefined,
      tipo: "salario",
      origem: "",
      mes_referencia: new Date().toISOString().slice(0, 7),
      data_recebimento: new Date().toISOString().split("T")[0],
      recorrente: false,
      frequencia_recorrencia: undefined,
      data_fim_recorrencia: "",
      observacoes: "",
    },
  });

  const recorrente = form.watch("recorrente");
  const tipoAtual = form.watch("tipo");
  const tipoInfo = TIPOS.find((t) => t.value === tipoAtual);

  useEffect(() => {
    if (open) {
      if (renda) {
        form.reset({
          descricao: renda.descricao,
          valor: Number(renda.valor),
          tipo: renda.tipo as FormValues["tipo"],
          origem: renda.origem,
          mes_referencia: renda.mes_referencia?.slice(0, 7) ?? "",
          data_recebimento: renda.data_recebimento?.slice(0, 10) ?? "",
          recorrente: renda.recorrente ?? false,
          frequencia_recorrencia:
            (renda.frequencia_recorrencia as FrequenciaValue) ?? undefined,
          data_fim_recorrencia: renda.data_fim_recorrencia?.slice(0, 10) ?? "",
          observacoes: renda.observacoes ?? "",
        });
      } else {
        form.reset({
          descricao: "",
          valor: undefined,
          tipo: "salario",
          origem: "",
          mes_referencia: new Date().toISOString().slice(0, 7),
          data_recebimento: new Date().toISOString().split("T")[0],
          recorrente: false,
          frequencia_recorrencia: undefined,
          data_fim_recorrencia: "",
          observacoes: "",
        });
      }
    }
  }, [open, renda, form]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      mes_referencia: values.mes_referencia + "-01",
      frequencia_recorrencia: values.recorrente
        ? values.frequencia_recorrencia
        : null,
      data_fim_recorrencia:
        values.recorrente && values.data_fim_recorrencia
          ? values.data_fim_recorrencia
          : null,
    };
    try {
      if (isEdit) {
        await api.put(`/renda/${renda!.id}`, payload);
        toast.success("Renda atualizada com sucesso");
      } else {
        await api.post("/renda", payload);
        toast.success("Renda cadastrada com sucesso");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar renda");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-base">
              <div className="rounded-xl bg-blue-500/20 p-2.5 shrink-0">
                {isEdit ? (
                  <Pencil className="h-5 w-5 text-blue-400" />
                ) : (
                  <Plus className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-white">
                  {isEdit ? "Editar Renda" : "Nova Renda"}
                </div>
                <div className="text-xs text-white/50 font-normal mt-0.5">
                  {isEdit
                    ? "Atualize os dados da sua renda"
                    : "Registre uma nova entrada financeira"}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Seletor de tipo visual em grade */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Tipo de renda
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {TIPOS.map((tipo) => {
                        const Icon = tipo.icon;
                        const isSelected = field.value === tipo.value;
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => field.onChange(tipo.value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected ? tipo.active : tipo.idle
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {tipo.label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50">
                      Descrição
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          tipoInfo?.value === "salario"
                            ? "Ex: Salário março"
                            : tipoInfo?.value === "freelance"
                              ? "Ex: Projeto XYZ"
                              : tipoInfo?.value === "investimento"
                                ? "Ex: Dividendos ITSA4"
                                : "Descrição da renda"
                        }
                        {...field}
                        className="mt-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor + Origem */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50">
                        Valor
                      </FormLabel>
                      <FormControl>
                        <div className="relative mt-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40 select-none">
                            R$
                          </span>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Origem
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Empresa, cliente..."
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mês ref + Data recebimento */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="mes_referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Mês referência
                      </FormLabel>
                      <FormControl>
                        <Input type="month" {...field} className="mt-1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_recebimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Recebimento
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="mt-1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Seção de recorrência */}
              <div
                className={`rounded-xl border p-4 space-y-3 transition-colors ${
                  recorrente
                    ? "border-indigo-400/40 bg-indigo-500/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <FormField
                  control={form.control}
                  name="recorrente"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-lg p-2 transition-colors ${
                              recorrente
                                ? "bg-indigo-500/20"
                                : "bg-white/[0.08]"
                            }`}
                          >
                            <Repeat
                              className={`h-4 w-4 transition-colors ${
                                recorrente
                                  ? "text-indigo-600"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <FormLabel
                              className={`text-sm font-semibold transition-colors ${
                                recorrente ? "text-indigo-300" : "text-white"
                              }`}
                            >
                              Renda recorrente
                            </FormLabel>
                            <p className="text-xs text-white/40 mt-0.5">
                              {recorrente
                                ? "Será lançada automaticamente todo mês"
                                : "Ative para rendas fixas como salário"}
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recorrente && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-400/20">
                    <FormField
                      control={form.control}
                      name="frequencia_recorrencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-indigo-300 font-semibold">
                            Frequência *
                          </FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1 border-indigo-400/30">
                                <SelectValue placeholder="Selecionar..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencias.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_fim_recorrencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-indigo-300 font-semibold flex items-center gap-1">
                            Fim da recorrência
                            <Info
                              className="h-3 w-3"
                              aria-label="Opcional — deixe em branco para sem data de término"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value ?? ""}
                              className="mt-1 border-indigo-400/30"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {!recorrente && (
                  <div className="flex items-start gap-2 rounded-lg bg-white/[0.05] px-3 py-2.5">
                    <Info className="h-3.5 w-3.5 text-white/40 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/40">
                      Renda pontual — ideal para freelances e recebimentos
                      esporádicos
                    </p>
                  </div>
                )}
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1">
                      <AlignLeft className="h-3 w-3" /> Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionais (opcional)..."
                        className="resize-none mt-1"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.04] flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="min-w-28 bg-blue-500/20 border border-blue-400/40 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEdit ? (
                  "Salvar alterações"
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
