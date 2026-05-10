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
    active: "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
  },
  {
    value: "freelance",
    label: "Freelance",
    icon: Zap,
    idle: "bg-violet-500/10 border-violet-400/30 text-violet-300 hover:bg-violet-500/20",
    active: "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25",
  },
  {
    value: "investimento",
    label: "Investimento",
    icon: TrendingUp,
    idle: "bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20",
    active: "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25",
  },
  {
    value: "aluguel",
    label: "Aluguel",
    icon: Home,
    idle: "bg-orange-500/10 border-orange-400/30 text-orange-300 hover:bg-orange-500/20",
    active: "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/25",
  },
  {
    value: "bonus",
    label: "Bônus",
    icon: Gift,
    idle: "bg-yellow-500/10 border-yellow-400/30 text-yellow-300 hover:bg-yellow-500/20",
    active: "bg-yellow-500 border-yellow-400 text-white shadow-lg shadow-yellow-500/25",
  },
  {
    value: "outro",
    label: "Outro",
    icon: CircleDollarSign,
    idle: "bg-white/[0.06] border-white/15 text-white/60 hover:bg-white/[0.10]",
    active: "bg-white/20 border-white/30 text-white shadow-lg shadow-black/20",
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-2">
      {children}
    </p>
  );
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

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-white/[0.08]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            {isEdit ? (
              <Pencil className="h-4 w-4 text-emerald-400" />
            ) : (
              <Plus className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold leading-none">
              {isEdit ? "Editar renda" : "Nova renda"}
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">
              {isEdit
                ? "Atualize os dados da entrada financeira"
                : "Registre uma nova entrada financeira"}
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* ── Scrollable body ──────────────────────────────── */}
            <div className="px-5 py-5 space-y-5 overflow-y-auto max-h-[calc(100dvh-14rem)] sm:max-h-[62vh]">

              {/* Tipo */}
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Tipo de renda</SectionLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {TIPOS.map((tipo) => {
                        const Icon = tipo.icon;
                        const isSelected = field.value === tipo.value;
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => field.onChange(tipo.value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all duration-150 active:scale-95 cursor-pointer ${
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

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Descrição</SectionLabel>
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
                      <SectionLabel>Valor</SectionLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/35 select-none">
                            R$
                          </span>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            className="pl-9 h-12 text-lg font-bold tabular-nums text-emerald-300 placeholder:text-white/20"
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
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-2.5 w-2.5" /> Origem
                        </span>
                      </SectionLabel>
                      <FormControl>
                        <Input
                          placeholder="Empresa, cliente..."
                          {...field}
                          className="h-12"
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
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-2.5 w-2.5" /> Mês referência
                        </span>
                      </SectionLabel>
                      <FormControl>
                        <Input type="month" {...field} />
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
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> Recebimento
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

              {/* Recorrência */}
              <div
                className={`rounded-xl border-2 p-4 transition-colors ${
                  recorrente
                    ? "border-indigo-400/40 bg-indigo-500/[0.08]"
                    : "border-dashed border-white/10 bg-white/[0.03]"
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
                              recorrente ? "bg-indigo-500/20" : "bg-white/[0.06]"
                            }`}
                          >
                            <Repeat
                              className={`h-4 w-4 transition-colors ${
                                recorrente ? "text-indigo-300" : "text-white/40"
                              }`}
                            />
                          </div>
                          <div>
                            <FormLabel
                              className={`text-sm font-semibold transition-colors ${
                                recorrente ? "text-indigo-300" : "text-white/70"
                              }`}
                            >
                              Renda recorrente
                            </FormLabel>
                            <p className="text-xs text-white/35 mt-0.5">
                              {recorrente
                                ? "Será lançada automaticamente"
                                : "Ative para rendas fixas como salário"}
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-indigo-500"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recorrente && (
                  <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-indigo-400/20">
                    <FormField
                      control={form.control}
                      name="frequencia_recorrencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-indigo-300/80 font-semibold">
                            Frequência *
                          </FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="mt-1.5 border-indigo-400/30">
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
                          <FormLabel className="text-xs text-indigo-300/80 font-semibold flex items-center gap-1">
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
                              className="mt-1.5 border-indigo-400/30"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {!recorrente && (
                  <div className="flex items-start gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 mt-3">
                    <Info className="h-3.5 w-3.5 text-white/35 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/35">
                      Renda pontual — ideal para freelances e recebimentos esporádicos
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
                    <SectionLabel>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="h-2.5 w-2.5" /> Observações
                      </span>
                    </SectionLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionais (opcional)..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Footer ───────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
              <p className="text-xs text-white/30 hidden sm:block">
                {recorrente ? "Renda recorrente" : "Entrada pontual"}
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={form.formState.isSubmitting}
                  className="min-w-28 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEdit ? (
                    "Salvar alterações"
                  ) : (
                    "Cadastrar renda"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
