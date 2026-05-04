"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  Plus,
  Pencil,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowLeftRight,
  MoreHorizontal,
  CalendarDays,
  AlignLeft,
  Layers,
  Info,
  Utensils,
  Car,
  HeartPulse,
  BookOpen,
  Gamepad2,
  Home,
  Shirt,
  Laptop,
  PawPrint,
  Plane,
  Sparkles,
  ShoppingCart,
  Pill,
  Package,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Repeat,
} from "lucide-react";

const formSchema = z
  .object({
    descricao: z.string().min(1, "Descrição obrigatória").max(255),
    // valor_total: usado somente em "a_vista"
    valor_total: z.number().positive("Deve ser positivo").optional(),
    // valor_parcela: definido pelo usuário no modo "parcelado"
    valor_parcela: z.number().positive("Deve ser positivo").optional(),
    data_gasto: z.string().min(1, "Data obrigatória"),
    categoria_id: z.string().optional(),
    cartao_id: z.string().optional(),
    forma_pagamento: z.enum([
      "dinheiro",
      "cartao_credito",
      "cartao_debito",
      "pix",
      "transferencia",
      "outro",
    ]),
    tipo_pagamento: z.enum(["a_vista", "parcelado"]),
    quantidade_parcelas: z.number().int().min(1).max(72),
    status: z.enum(["pendente", "pago", "cancelado"]),
    observacoes: z.string().max(1000).optional(),
    // Campo usado apenas quando isAssinatura=true
    dia_cobranca: z.number().int().min(1).max(28),
  })
  .refine(
    (d) =>
      d.tipo_pagamento === "a_vista"
        ? d.valor_total != null && d.valor_total > 0
        : true,
    { message: "Informe o valor do gasto", path: ["valor_total"] },
  )
  .refine(
    (d) =>
      d.tipo_pagamento === "parcelado"
        ? d.valor_parcela != null && d.valor_parcela > 0
        : true,
    { message: "Informe o valor de cada parcela", path: ["valor_parcela"] },
  )
  .refine(
    (d) => {
      if (
        d.forma_pagamento === "cartao_credito" ||
        d.forma_pagamento === "cartao_debito"
      ) {
        return !!d.cartao_id;
      }
      return true;
    },
    { message: "Selecione um cartão", path: ["cartao_id"] },
  )
  .refine(
    (d) =>
      d.tipo_pagamento === "parcelado" ? d.quantidade_parcelas > 1 : true,
    {
      message: "Informe o número de parcelas (mín. 2)",
      path: ["quantidade_parcelas"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

interface Gasto {
  id: string;
  descricao: string;
  valor_total: number;
  data_gasto: string;
  categoria_id?: number;
  cartao_id?: string;
  forma_pagamento: string;
  status: string;
  observacoes?: string;
  tipo_pagamento?: string;
  quantidade_parcelas?: number;
}

interface Categoria {
  id: number;
  nome: string;
  cor: string;
  icone?: string;
}

interface Cartao {
  id: string;
  apelido: string;
  bandeira: string;
  cor: string;
  ultimos_4_digitos: string;
  ativo: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto?: Gasto | null;
  /** Quando true, o dialog sempre opera no modo assinatura (toggle oculto, parcelado oculto) */
  forceAssinatura?: boolean;
}

const FORMAS_PGTO = [
  {
    value: "dinheiro",
    label: "Dinheiro",
    icon: Banknote,
    idle: "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20",
    active: "bg-blue-600 border-blue-600 text-white",
  },
  {
    value: "cartao_credito",
    label: "Crédito",
    icon: CreditCard,
    idle: "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20",
    active: "bg-blue-600 border-blue-600 text-white",
  },
  {
    value: "cartao_debito",
    label: "Débito",
    icon: CreditCard,
    idle: "bg-indigo-500/10 border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/20",
    active: "bg-indigo-600 border-indigo-600 text-white",
  },
  {
    value: "pix",
    label: "Pix",
    icon: Smartphone,
    idle: "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20",
    active: "bg-cyan-600 border-cyan-600 text-white",
  },
  {
    value: "transferencia",
    label: "Transf.",
    icon: ArrowLeftRight,
    idle: "bg-violet-500/10 border-violet-400/30 text-violet-300 hover:bg-violet-500/20",
    active: "bg-violet-600 border-violet-600 text-white",
  },
  {
    value: "outro",
    label: "Outro",
    icon: MoreHorizontal,
    idle: "bg-white/[0.06] border-white/20 text-white/60 hover:bg-white/[0.10]",
    active: "bg-gray-600 border-gray-600 text-white",
  },
] as const;

function getCategoryIcon(nome: string) {
  const icons: Record<string, JSX.Element> = {
    Alimentação: <Utensils className="h-3.5 w-3.5" />,
    Transporte: <Car className="h-3.5 w-3.5" />,
    Saúde: <HeartPulse className="h-3.5 w-3.5" />,
    Educação: <BookOpen className="h-3.5 w-3.5" />,
    Lazer: <Gamepad2 className="h-3.5 w-3.5" />,
    Moradia: <Home className="h-3.5 w-3.5" />,
    Vestuário: <Shirt className="h-3.5 w-3.5" />,
    Tecnologia: <Laptop className="h-3.5 w-3.5" />,
    Assinaturas: <Smartphone className="h-3.5 w-3.5" />,
    Pets: <PawPrint className="h-3.5 w-3.5" />,
    Viagem: <Plane className="h-3.5 w-3.5" />,
    "Beleza & Estética": <Sparkles className="h-3.5 w-3.5" />,
    Mercado: <ShoppingCart className="h-3.5 w-3.5" />,
    Farmácia: <Pill className="h-3.5 w-3.5" />,
    "Outros Gastos": <Package className="h-3.5 w-3.5" />,
  };
  return icons[nome] ?? <Tag className="h-3.5 w-3.5" />;
}

export function GastoDialog({
  open,
  onClose,
  onSuccess,
  gasto,
  forceAssinatura = false,
}: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [isAssinatura, setIsAssinatura] = useState(forceAssinatura);
  const isEdit = !!gasto;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor_total: undefined,
      valor_parcela: undefined,
      data_gasto: new Date().toISOString().split("T")[0],
      categoria_id: undefined,
      cartao_id: undefined,
      forma_pagamento: "dinheiro",
      tipo_pagamento: "a_vista",
      quantidade_parcelas: 1,
      status: "pendente",
      observacoes: "",
      dia_cobranca: 1,
    },
  });

  const formaPgto = form.watch("forma_pagamento");
  const tipoPgto = form.watch("tipo_pagamento");
  const qtdParcelas = form.watch("quantidade_parcelas");
  const valorParcela = form.watch("valor_parcela");

  // Total calculado quando parcelado (valor_parcela × qtd)
  const totalCalculado =
    tipoPgto === "parcelado" && valorParcela && qtdParcelas > 1
      ? valorParcela * qtdParcelas
      : null;

  // Assinatura e parcelado são mutuamente exclusivos
  function toggleAssinatura(checked: boolean) {
    setIsAssinatura(checked);
    if (checked) {
      form.setValue("tipo_pagamento", "a_vista");
      form.setValue("quantidade_parcelas", 1);
      form.setValue("valor_parcela", undefined);
    }
  }

  useEffect(() => {
    Promise.all([
      api
        .get<{ data: Categoria[] }>("/categorias?limit=100")
        .catch(() => ({ data: { data: [] as Categoria[] } })),
      api
        .get<{ data: Cartao[] }>("/cartoes?limit=100")
        .catch(() => ({ data: { data: [] as Cartao[] } })),
    ]).then(([catRes, cartRes]) => {
      setCategorias(catRes.data.data ?? []);
      setCartoes((cartRes.data.data ?? []).filter((c) => c.ativo));
    });
  }, []);

  // Reset cartao_id quando forma muda para não-cartão
  useEffect(() => {
    if (formaPgto !== "cartao_credito" && formaPgto !== "cartao_debito") {
      form.setValue("cartao_id", undefined);
    }
  }, [formaPgto, form]);

  // Sincronizar quantidade_parcelas ao alternar tipo_pagamento
  useEffect(() => {
    if (tipoPgto === "a_vista") {
      form.setValue("quantidade_parcelas", 1);
      form.setValue("valor_parcela", undefined);
    } else {
      const current = form.getValues("quantidade_parcelas");
      if (!current || current < 2) form.setValue("quantidade_parcelas", 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoPgto]);

  useEffect(() => {
    if (open) {
      setIsAssinatura(forceAssinatura);
      if (gasto) {
        form.reset({
          descricao: gasto.descricao,
          valor_total: Number(gasto.valor_total),
          valor_parcela: undefined,
          data_gasto: gasto.data_gasto.slice(0, 10),
          categoria_id: gasto.categoria_id
            ? String(gasto.categoria_id)
            : undefined,
          cartao_id: gasto.cartao_id ?? undefined,
          forma_pagamento:
            gasto.forma_pagamento as FormValues["forma_pagamento"],
          tipo_pagamento:
            (gasto.tipo_pagamento as FormValues["tipo_pagamento"]) ?? "a_vista",
          quantidade_parcelas: gasto.quantidade_parcelas ?? 1,
          status: gasto.status as FormValues["status"],
          observacoes: gasto.observacoes ?? "",
          dia_cobranca: 1,
        });
      } else {
        form.reset({
          descricao: "",
          valor_total: undefined,
          valor_parcela: undefined,
          data_gasto: new Date().toISOString().split("T")[0],
          categoria_id: undefined,
          cartao_id: undefined,
          forma_pagamento: "dinheiro",
          tipo_pagamento: "a_vista",
          quantidade_parcelas: 1,
          status: "pendente",
          observacoes: "",
          dia_cobranca: 1,
        });
      }
    }
  }, [open, gasto, form]);

  async function onSubmit(values: FormValues) {
    const isParcelado = values.tipo_pagamento === "parcelado";

    try {
      // ── Caminho: Assinatura ──────────────────────────────────
      if (isAssinatura && !isEdit) {
        if (!values.valor_total || values.valor_total <= 0) {
          form.setError("valor_total", { message: "Informe o valor mensal" });
          return;
        }
        await api.post("/assinaturas", {
          descricao: values.descricao,
          valor: values.valor_total,
          categoria_id: values.categoria_id
            ? Number(values.categoria_id)
            : undefined,
          cartao_id: values.cartao_id || undefined,
          forma_pagamento: values.forma_pagamento,
          dia_cobranca: values.dia_cobranca,
          data_inicio: values.data_gasto,
          observacoes: values.observacoes || undefined,
        });
        toast.success("Assinatura cadastrada — próximos 24 meses lançados");
        onSuccess();
        onClose();
        return;
      }

      // ── Caminho: Gasto normal / Edição ──────────────────────
      const valorTotalFinal = isParcelado
        ? (values.valor_parcela ?? 0)
        : (values.valor_total ?? 0);

      const payload = {
        descricao: values.descricao,
        valor_total: valorTotalFinal,
        valor_parcela: isParcelado ? values.valor_parcela : undefined,
        data_gasto: values.data_gasto,
        categoria_id: values.categoria_id
          ? Number(values.categoria_id)
          : undefined,
        cartao_id: values.cartao_id || undefined,
        forma_pagamento: values.forma_pagamento,
        tipo_pagamento: values.tipo_pagamento,
        quantidade_parcelas: values.quantidade_parcelas,
        status: values.status,
        observacoes: values.observacoes || undefined,
      };

      if (isEdit) {
        await api.put(`/gastos/${gasto!.id}`, payload);
        toast.success("Gasto atualizado com sucesso");
      } else {
        await api.post("/gastos", payload);
        toast.success(
          isParcelado
            ? `Gasto parcelado em ${values.quantidade_parcelas}× cadastrado`
            : "Gasto cadastrado com sucesso",
        );
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar gasto");
    }
  }

  const isCard =
    formaPgto === "cartao_credito" || formaPgto === "cartao_debito";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
        {/* Header com gradiente */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-base">
              <div className="rounded-xl bg-rose-500/20 p-2.5 shrink-0">
                {isEdit ? (
                  <Pencil className="h-5 w-5 text-rose-400" />
                ) : isAssinatura ? (
                  <Repeat className="h-5 w-5 text-rose-400" />
                ) : (
                  <Plus className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">
                  {isEdit
                    ? "Editar Gasto"
                    : isAssinatura
                      ? "Nova Assinatura"
                      : "Novo Gasto"}
                </div>
                <div className="text-xs text-muted-foreground font-normal mt-0.5">
                  {isEdit
                    ? "Atualize os dados da despesa"
                    : isAssinatura
                      ? "Cobrança recorrente mensal automática"
                      : "Registre uma nova despesa"}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Forma de pagamento — grid visual */}
              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Forma de pagamento
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {FORMAS_PGTO.map((f) => {
                        const Icon = f.icon;
                        const isSelected = field.value === f.value;
                        return (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => field.onChange(f.value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all cursor-pointer ${
                              isSelected ? f.active : f.idle
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seletor de cartão — só quando forma for cartão */}
              {isCard && (
                <FormField
                  control={form.control}
                  name="cartao_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Cartão
                      </FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecione um cartão..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cartoes.length === 0 ? (
                            <SelectItem value="_none" disabled>
                              Nenhum cartão cadastrado
                            </SelectItem>
                          ) : (
                            cartoes.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.apelido} •••• {c.ultimos_4_digitos}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Separator />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Supermercado, Netflix, Aluguel..."
                        {...field}
                        className="mt-1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Toggle Assinatura (apenas no modo criar e sem forceAssinatura) ─── */}
              {!isEdit && !forceAssinatura && (
                <div
                  className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${
                    isAssinatura
                      ? "border-violet-400/40 bg-violet-500/10"
                      : "border-dashed border-white/15 bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`rounded-lg p-2 transition-colors ${
                          isAssinatura ? "bg-violet-500/20" : "bg-white/[0.08]"
                        }`}
                      >
                        <Repeat
                          className={`h-4 w-4 transition-colors ${
                            isAssinatura
                              ? "text-violet-300"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isAssinatura ? "text-violet-300" : "text-foreground"
                          }`}
                        >
                          É uma assinatura?
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isAssinatura
                            ? "Cobranças mensais geradas automaticamente"
                            : "Repete todo mês? Ative aqui"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isAssinatura}
                      onCheckedChange={toggleAssinatura}
                      className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-violet-200"
                    />
                  </div>

                  {isAssinatura && (
                    <div className="pt-2 border-t border-violet-400/20 space-y-3">
                      {/* Dia de cobrança */}
                      <FormField
                        control={form.control}
                        name="dia_cobranca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-violet-300 font-semibold">
                              Dia de cobrança (todo mês)
                            </FormLabel>
                            <Select
                              value={String(field.value)}
                              onValueChange={(v) => field.onChange(parseInt(v))}
                            >
                              <FormControl>
                                <SelectTrigger className="mt-1 border-violet-200">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from(
                                  { length: 28 },
                                  (_, i) => i + 1,
                                ).map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    Dia {d}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-start gap-2 rounded-lg bg-white/[0.05] px-3 py-2.5">
                        <Info className="h-3.5 w-3.5 text-violet-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Serão criados lançamentos para os próximos 24 meses.
                          Você pode cancelar a qualquer momento na página de
                          Assinaturas.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Parcelamento — ocultado quando assinatura ativa */}
              {!isAssinatura && (
                <div
                  className={`rounded-xl border-2 p-4 space-y-3 transition-colors ${
                    tipoPgto === "parcelado"
                      ? "border-orange-400/40 bg-orange-500/10"
                      : "border-dashed border-white/15 bg-white/[0.04]"
                  }`}
                >
                  <FormField
                    control={form.control}
                    name="tipo_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`rounded-lg p-2 transition-colors ${
                                tipoPgto === "parcelado"
                                  ? "bg-orange-500/20"
                                  : "bg-white/[0.08]"
                              }`}
                            >
                              <Layers
                                className={`h-4 w-4 transition-colors ${
                                  tipoPgto === "parcelado"
                                    ? "text-orange-300"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                            <div>
                              <FormLabel
                                className={`text-sm font-semibold transition-colors ${
                                  tipoPgto === "parcelado"
                                    ? "text-orange-300"
                                    : "text-foreground"
                                }`}
                              >
                                Pagamento parcelado
                              </FormLabel>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tipoPgto === "parcelado"
                                  ? "As cobranças serão lançadas automaticamente"
                                  : "Ative para parcelar este gasto"}
                              </p>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "parcelado"}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked ? "parcelado" : "a_vista",
                                )
                              }
                              className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-orange-200"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {tipoPgto === "parcelado" && (
                    <div className="pt-2 border-t border-orange-400/20 space-y-3">
                      {/* Valor de cada parcela */}
                      <FormField
                        control={form.control}
                        name="valor_parcela"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-orange-300 font-semibold">
                              Valor de cada parcela *
                            </FormLabel>
                            <FormControl>
                              <div className="relative mt-1">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-orange-300 select-none">
                                  R$
                                </span>
                                <CurrencyInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="pl-10 border-orange-400/40 focus-visible:ring-orange-400"
                                />
                              </div>
                            </FormControl>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Inclua eventuais juros cobrados na plataforma de
                              compra
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Número de parcelas — Select 2-12 */}
                      <FormField
                        control={form.control}
                        name="quantidade_parcelas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-orange-300 font-semibold">
                              Número de parcelas *
                            </FormLabel>
                            <Select
                              value={String(field.value)}
                              onValueChange={(v) => field.onChange(parseInt(v))}
                            >
                              <FormControl>
                                <SelectTrigger className="mt-1 border-orange-200">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from(
                                  { length: 11 },
                                  (_, i) => i + 2,
                                ).map((n) => (
                                  <SelectItem key={n} value={String(n)}>
                                    {n}× parcelas
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {totalCalculado != null && (
                        <div className="rounded-lg bg-white/[0.06] border border-orange-400/20 px-3 py-2.5">
                          <p className="text-[10px] text-orange-300 font-semibold uppercase tracking-wider">
                            Total c/ parcelamento
                          </p>
                          <p className="text-base font-bold text-orange-300 tabular-nums">
                            {totalCalculado.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-2 rounded-lg bg-white/[0.05] px-3 py-2.5">
                        <Info className="h-3.5 w-3.5 text-orange-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          As {qtdParcelas} cobranças de{" "}
                          {(valorParcela ?? 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}{" "}
                          serão lançadas automaticamente a partir do mês
                          seguinte à data do gasto
                        </p>
                      </div>
                    </div>
                  )}

                  {tipoPgto === "a_vista" && (
                    <div className="flex items-start gap-2 rounded-lg bg-white/[0.05] px-3 py-2.5">
                      <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Gasto registrado integralmente — sem parcelas futuras
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Valor (à vista) + Data */}
              {tipoPgto === "a_vista" ? (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="valor_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {isAssinatura ? "Valor mensal" : "Valor"}
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
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
                    name="data_gasto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />{" "}
                          {isAssinatura ? "Data de início" : "Data"}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="mt-1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="data_gasto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Data do gasto
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="mt-1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Categoria + Status */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Categoria
                      </FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              <span className="flex items-center gap-2">
                                <span style={{ color: c.cor }}>
                                  {getCategoryIcon(c.nome)}
                                </span>
                                {c.nome}
                              </span>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Status
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">
                            <span className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                              Pendente
                            </span>
                          </SelectItem>
                          <SelectItem value="pago">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                              Pago
                            </span>
                          </SelectItem>
                          <SelectItem value="cancelado">
                            <span className="flex items-center gap-2">
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                              Cancelado
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
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
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="min-w-28"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEdit ? (
                  "Salvar alterações"
                ) : isAssinatura ? (
                  "Criar Assinatura"
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
