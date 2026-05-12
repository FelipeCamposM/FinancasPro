"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Plus,
  Minus,
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
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Repeat,
  Wallet,
} from "lucide-react";

const formSchema = z
  .object({
    descricao: z.string().min(1, "Descrição obrigatória").max(255),
    valor_total: z.number().positive("Deve ser positivo").optional(),
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
    dia_cobranca: z.number().int().min(1).max(28),
  })
  .refine(
    (d) => d.tipo_pagamento === "a_vista" ? d.valor_total != null && d.valor_total > 0 : true,
    { message: "Informe o valor do gasto", path: ["valor_total"] },
  )
  .refine(
    (d) => d.tipo_pagamento === "parcelado" ? d.valor_parcela != null && d.valor_parcela > 0 : true,
    { message: "Informe o valor de cada parcela", path: ["valor_parcela"] },
  )
  .refine(
    (d) => {
      if (d.forma_pagamento === "cartao_credito" || d.forma_pagamento === "cartao_debito") {
        return !!d.cartao_id;
      }
      return true;
    },
    { message: "Selecione um cartão", path: ["cartao_id"] },
  )
  .refine(
    (d) => d.tipo_pagamento === "parcelado" ? d.quantidade_parcelas > 1 : true,
    { message: "Informe o número de parcelas (mín. 2)", path: ["quantidade_parcelas"] },
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
  banco?: string;
  nome_no_cartao?: string;
  tipo?: string;
}

const BANDEIRA_LOGOS: Record<string, string> = {
  visa:       "/brand_cardlogos/visa.svg",
  mastercard: "/brand_cardlogos/mastercard.svg",
  elo:        "/brand_cardlogos/elo.svg",
  amex:       "/brand_cardlogos/amex.svg",
  hipercard:  "/brand_cardlogos/hipercard.svg",
  alelo:      "/brand_cardlogos/alelo.svg",
  paypal:     "/brand_cardlogos/paypal.svg",
};

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? "#1a1a1a" : "#ffffff";
}

function CartaoMini({
  cartao,
  selected,
  onClick,
}: {
  cartao: Cartao;
  selected: boolean;
  onClick: () => void;
}) {
  const textColor = getContrastColor(cartao.cor);
  const isLight = textColor === "#1a1a1a";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[76px] w-36 shrink-0 rounded-xl p-3 text-left transition-all duration-150 active:scale-95 ${
        selected
          ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[hsl(222_47%_5%)] scale-[1.04] shadow-xl"
          : "opacity-60 hover:opacity-90 hover:scale-[1.02]"
      }`}
      style={{ background: cartao.cor, color: textColor }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold truncate max-w-[80px]" style={{ color: textColor, opacity: 0.85 }}>
          {cartao.apelido}
        </p>
        {BANDEIRA_LOGOS[cartao.bandeira] ? (
          <img
            src={BANDEIRA_LOGOS[cartao.bandeira]}
            alt={cartao.bandeira}
            className="h-5 w-auto max-w-[32px] object-contain shrink-0"
            style={isLight ? {} : { filter: "brightness(0) invert(1)" }}
          />
        ) : (
          <div className={`h-4 w-6 rounded shrink-0 ${isLight ? "bg-black/20" : "bg-white/30"}`} />
        )}
      </div>
      <p
        className="mt-auto pt-2 font-mono text-xs tracking-widest"
        style={{ color: textColor, opacity: 0.75 }}
      >
        •••• {cartao.ultimos_4_digitos}
      </p>
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto?: Gasto | null;
  forceAssinatura?: boolean;
}

const FORMAS_PGTO = [
  {
    value: "dinheiro",
    label: "Dinheiro",
    icon: Banknote,
    idle:   "bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20",
    active: "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25",
  },
  {
    value: "cartao_credito",
    label: "Crédito",
    icon: CreditCard,
    idle:   "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20",
    active: "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
  },
  {
    value: "cartao_debito",
    label: "Débito",
    icon: Wallet,
    idle:   "bg-indigo-500/10 border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/20",
    active: "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25",
  },
  {
    value: "pix",
    label: "Pix",
    icon: Smartphone,
    idle:   "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20",
    active: "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/25",
  },
  {
    value: "transferencia",
    label: "Transf.",
    icon: ArrowLeftRight,
    idle:   "bg-violet-500/10 border-violet-400/30 text-violet-300 hover:bg-violet-500/20",
    active: "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25",
  },
  {
    value: "outro",
    label: "Outro",
    icon: MoreHorizontal,
    idle:   "bg-white/[0.06] border-white/15 text-white/50 hover:bg-white/10",
    active: "bg-white/20 border-white/30 text-white shadow-lg shadow-black/20",
  },
] as const;

const STATUS_OPTIONS = [
  {
    value: "pago",
    label: "Pago",
    icon: CheckCircle2,
    idle:   "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20",
    active: "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
  },
  {
    value: "pendente",
    label: "Pendente",
    icon: Clock,
    idle:   "bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20",
    active: "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/25",
  },
  {
    value: "cancelado",
    label: "Cancelado",
    icon: XCircle,
    idle:   "bg-rose-500/10 border-rose-400/30 text-rose-300 hover:bg-rose-500/20",
    active: "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/25",
  },
] as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-2">
      {children}
    </p>
  );
}

export function GastoDialog({ open, onClose, onSuccess, gasto, forceAssinatura = false }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [isAssinatura, setIsAssinatura] = useState(forceAssinatura);
  const [parcelamentoJaIniciado, setParcelamentoJaIniciado] = useState(false);
  const [parcelaAtual, setParcelaAtual] = useState(1);
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
      status: "pago",
      observacoes: "",
      dia_cobranca: 1,
    },
  });

  const formaPgto      = form.watch("forma_pagamento");
  const tipoPgto       = form.watch("tipo_pagamento");
  const qtdParcelas    = form.watch("quantidade_parcelas");
  const valorParcela   = form.watch("valor_parcela");
  const totalCalculado =
    tipoPgto === "parcelado" && valorParcela && qtdParcelas > 1
      ? valorParcela * qtdParcelas
      : null;

  function toggleAssinatura(checked: boolean) {
    setIsAssinatura(checked);
    if (checked) {
      form.setValue("tipo_pagamento", "a_vista");
      form.setValue("quantidade_parcelas", 1);
      form.setValue("valor_parcela", undefined);
      form.setValue("status", "pago");
      setParcelamentoJaIniciado(false);
      setParcelaAtual(1);
    }
  }

  function resetParcelamento() {
    setParcelamentoJaIniciado(false);
    setParcelaAtual(1);
  }

  useEffect(() => {
    Promise.all([
      api.get<{ data: Categoria[] }>("/categorias?tipo=gasto&limit=100").catch(() => ({ data: { data: [] as Categoria[] } })),
      api.get<{ data: Cartao[] }>("/cartoes?limit=100").catch(() => ({ data: { data: [] as Cartao[] } })),
    ]).then(([catRes, cartRes]) => {
      setCategorias(catRes.data.data ?? []);
      setCartoes((cartRes.data.data ?? []).filter((c) => c.ativo));
    });
  }, []);

  useEffect(() => {
    if (formaPgto !== "cartao_credito" && formaPgto !== "cartao_debito") {
      form.setValue("cartao_id", undefined);
    }
  }, [formaPgto, form]);

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
          categoria_id: gasto.categoria_id ? String(gasto.categoria_id) : undefined,
          cartao_id: gasto.cartao_id ?? undefined,
          forma_pagamento: gasto.forma_pagamento as FormValues["forma_pagamento"],
          tipo_pagamento: (gasto.tipo_pagamento as FormValues["tipo_pagamento"]) ?? "a_vista",
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
          status: "pago",
          observacoes: "",
          dia_cobranca: 1,
        });
      }
    }
  }, [open, gasto, form, forceAssinatura]);

  async function onSubmit(values: FormValues) {
    const isParcelado = values.tipo_pagamento === "parcelado";
    try {
      if (isAssinatura && !isEdit) {
        if (!values.valor_total || values.valor_total <= 0) {
          form.setError("valor_total", { message: "Informe o valor mensal" });
          return;
        }
        await api.post("/assinaturas", {
          descricao: values.descricao,
          valor: values.valor_total,
          categoria_id: values.categoria_id ? Number(values.categoria_id) : undefined,
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

      const valorTotalFinal = isParcelado ? (values.valor_parcela ?? 0) : (values.valor_total ?? 0);

      // Se parcelamento já iniciado, recalcula data da 1ª parcela
      let dataGasto = values.data_gasto;
      if (isParcelado && parcelamentoJaIniciado && parcelaAtual > 1) {
        const [y, m, d] = dataGasto.split("-").map(Number);
        const dt = new Date(y, m - 1 - (parcelaAtual - 1), d, 12);
        dataGasto = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      }

      const payload = {
        descricao: values.descricao,
        valor_total: valorTotalFinal,
        valor_parcela: isParcelado ? values.valor_parcela : undefined,
        data_gasto: dataGasto,
        categoria_id: values.categoria_id ? Number(values.categoria_id) : undefined,
        cartao_id: values.cartao_id || undefined,
        forma_pagamento: values.forma_pagamento,
        tipo_pagamento: values.tipo_pagamento,
        quantidade_parcelas: values.quantidade_parcelas,
        status: values.status,
        observacoes: values.observacoes || undefined,
      };

      if (isEdit) {
        await api.put(`/gastos/${gasto!.id}`, payload);
        toast.success("Gasto atualizado");
      } else {
        await api.post("/gastos", payload);
        toast.success(
          isParcelado
            ? `Gasto parcelado em ${values.quantidade_parcelas}× cadastrado`
            : "Gasto cadastrado",
        );
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar gasto");
    }
  }

  const isCard = formaPgto === "cartao_credito" || formaPgto === "cartao_debito";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetParcelamento(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-white/[0.08]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
            {isEdit ? (
              <Pencil className="h-4 w-4 text-rose-400" />
            ) : isAssinatura ? (
              <Repeat className="h-4 w-4 text-rose-400" />
            ) : (
              <Plus className="h-4 w-4 text-rose-400" />
            )}
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold leading-none">
              {isEdit ? "Editar gasto" : isAssinatura ? "Nova assinatura" : "Novo gasto"}
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">
              {isEdit
                ? "Atualize os dados da despesa"
                : isAssinatura
                  ? "Cobrança recorrente mensal automática"
                  : "Registre uma nova despesa"}
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* ── Scrollable body ──────────────────────────────── */}
            <div className="px-5 py-5 space-y-5 overflow-y-auto max-h-[calc(100dvh-14rem)] sm:max-h-[62vh]">

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Descrição</SectionLabel>
                    <FormControl>
                      <Input placeholder="Ex: Supermercado, Netflix, Aluguel..." {...field} className="h-12 text-lg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor + Data */}
              <div className="grid grid-cols-2 gap-3">
                {tipoPgto === "a_vista" ? (
                  <FormField
                    control={form.control}
                    name="valor_total"
                    render={({ field }) => (
                      <FormItem>
                        <SectionLabel>{isAssinatura ? "Valor mensal" : "Valor"}</SectionLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/35 select-none">
                              R$
                            </span>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              className="pl-9 h-12 text-lg font-bold tabular-nums text-rose-300 placeholder:text-white/20"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="flex items-end">
                    <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Total</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-rose-300">
                        {totalCalculado
                          ? totalCalculado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="data_gasto"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {isAssinatura ? "Início" : "Data"}
                        </span>
                      </SectionLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              className="ui-control flex h-12 w-full items-center gap-2 px-3 text-lg"
                            >
                              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/40" />
                              <span className={field.value ? "text-white/90" : "text-white/35"}>
                                {field.value
                                  ? (() => {
                                      const [y, m, d] = field.value.split("-");
                                      return `${d}/${m}/${y}`;
                                    })()
                                  : "Selecionar data"}
                              </span>
                            </button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="ui-popover w-auto p-0 ui-glass-surface-strong border-white/[0.14]"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            className="bg-transparent"
                            selected={field.value ? new Date(field.value + "T12:00:00") : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const y = date.getFullYear();
                                const mo = String(date.getMonth() + 1).padStart(2, "0");
                                const d = String(date.getDate()).padStart(2, "0");
                                field.onChange(`${y}-${mo}-${d}`);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Forma de pagamento */}
              <FormField
                control={form.control}
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Forma de pagamento</SectionLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {FORMAS_PGTO.map((f) => {
                        const Icon = f.icon;
                        const isSelected = field.value === f.value;
                        return (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => field.onChange(f.value)}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all duration-150 active:scale-95 ${
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

              {/* Cartão — miniaturas visuais */}
              {isCard && (
                <FormField
                  control={form.control}
                  name="cartao_id"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>Cartão</SectionLabel>
                      {cartoes.length === 0 ? (
                        <p className="text-xs text-white/40 py-2">Nenhum cartão cadastrado.</p>
                      ) : (
                        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
                          {cartoes.map((c) => (
                            <CartaoMini
                              key={c.id}
                              cartao={c}
                              selected={field.value === c.id}
                              onClick={() => field.onChange(c.id)}
                            />
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Categoria + Status */}
              <div className={`grid gap-3 ${isAssinatura ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                {!isAssinatura && <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>Categoria</SectionLabel>
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ background: c.cor ?? "#94a3b8" }}
                                />
                                {c.icone ? `${c.icone} ` : ""}{c.nome}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>Status</SectionLabel>
                      <div className="grid grid-cols-3 gap-1.5">
                        {STATUS_OPTIONS.map((s) => {
                          const Icon = s.icon;
                          const isSelected = field.value === s.value;
                          return (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => field.onChange(s.value)}
                              className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 px-1 text-[10px] font-semibold transition-all duration-150 active:scale-95 ${
                                isSelected ? s.active : s.idle
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Toggle Assinatura */}
              {!isEdit && !forceAssinatura && (
                <div className={`rounded-xl border-2 p-4 transition-colors ${
                  isAssinatura
                    ? "border-violet-400/40 bg-violet-500/[0.08]"
                    : "border-dashed border-white/10 bg-white/[0.03]"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg p-2 transition-colors ${isAssinatura ? "bg-violet-500/20" : "bg-white/[0.06]"}`}>
                        <Repeat className={`h-4 w-4 ${isAssinatura ? "text-violet-300" : "text-white/40"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isAssinatura ? "text-violet-300" : "text-white/70"}`}>
                          É uma assinatura?
                        </p>
                        <p className="text-xs text-white/35 mt-0.5">
                          {isAssinatura ? "Cobranças mensais geradas automaticamente" : "Repete todo mês? Ative aqui"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isAssinatura}
                      onCheckedChange={toggleAssinatura}
                      className="data-[state=checked]:bg-violet-500"
                    />
                  </div>

                  {isAssinatura && (
                    <div className="pt-3 mt-3 border-t border-violet-400/20">
                      <FormField
                        control={form.control}
                        name="dia_cobranca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-violet-300/80 font-semibold">
                              Dia de cobrança (todo mês)
                            </FormLabel>
                            <Select
                              value={String(field.value)}
                              onValueChange={(v) => field.onChange(parseInt(v))}
                            >
                              <FormControl>
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                                  <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <p className="mt-2.5 flex items-start gap-1.5 text-xs text-white/35">
                        <Info className="h-3.5 w-3.5 text-violet-400 mt-px shrink-0" />
                        Lançamentos criados para os próximos 24 meses.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle Parcelamento */}
              {!isAssinatura && (
                <div className={`rounded-xl border-2 p-4 transition-colors ${
                  tipoPgto === "parcelado"
                    ? "border-amber-400/40 bg-amber-500/[0.08]"
                    : "border-dashed border-white/10 bg-white/[0.03]"
                }`}>
                  <FormField
                    control={form.control}
                    name="tipo_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`rounded-lg p-2 transition-colors ${tipoPgto === "parcelado" ? "bg-amber-500/20" : "bg-white/[0.06]"}`}>
                              <Layers className={`h-4 w-4 ${tipoPgto === "parcelado" ? "text-amber-300" : "text-white/40"}`} />
                            </div>
                            <div>
                              <FormLabel className={`text-sm font-semibold ${tipoPgto === "parcelado" ? "text-amber-300" : "text-white/70"}`}>
                                Pagamento parcelado
                              </FormLabel>
                              <p className="text-xs text-white/35 mt-0.5">
                                {tipoPgto === "parcelado" ? "Cobranças lançadas automaticamente" : "Ative para parcelar este gasto"}
                              </p>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "parcelado"}
                              onCheckedChange={(c) => {
                                field.onChange(c ? "parcelado" : "a_vista");
                                if (!c) resetParcelamento();
                              }}
                              className="data-[state=checked]:bg-amber-500"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {tipoPgto === "parcelado" && (
                    <div className="pt-3 mt-3 border-t border-amber-400/20 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="valor_parcela"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-amber-300/80 font-semibold">
                                Valor por parcela
                              </FormLabel>
                              <FormControl>
                                <div className="relative mt-1.5">
                                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400/60 select-none">R$</span>
                                  <CurrencyInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="pl-9 border-amber-400/30 focus-visible:ring-amber-400"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="quantidade_parcelas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-amber-300/80 font-semibold">
                                Nº de parcelas
                              </FormLabel>
                              <Select
                                value={String(field.value)}
                                onValueChange={(v) => field.onChange(parseInt(v))}
                              >
                                <FormControl>
                                  <SelectTrigger className="mt-1.5 border-amber-400/30">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 71 }, (_, i) => i + 2).map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n}×</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {totalCalculado != null && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-500/[0.08] border border-amber-400/20 px-3 py-2.5">
                          <p className="text-xs text-amber-300/70 font-medium">
                            {qtdParcelas}× de{" "}
                            {(valorParcela ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                          <p className="text-sm font-bold tabular-nums text-amber-300">
                            {totalCalculado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>
                      )}

                      {/* Parcelamento já iniciado */}
                      <div className={`rounded-lg border p-3 transition-colors ${
                        parcelamentoJaIniciado
                          ? "border-amber-400/30 bg-amber-500/[0.06]"
                          : "border-white/[0.07] bg-white/[0.02]"
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${parcelamentoJaIniciado ? "text-amber-300" : "text-white/50"}`}>
                              Parcelamento já iniciado?
                            </p>
                            <p className="text-[10px] text-white/30 mt-0.5">
                              Informe em qual parcela você está agora
                            </p>
                          </div>
                          <Switch
                            checked={parcelamentoJaIniciado}
                            onCheckedChange={(c) => {
                              setParcelamentoJaIniciado(c);
                              if (!c) setParcelaAtual(1);
                            }}
                            className="data-[state=checked]:bg-amber-500 shrink-0"
                          />
                        </div>

                        {parcelamentoJaIniciado && (
                          <div className="mt-3 pt-3 border-t border-amber-400/20">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300/60 mb-2">
                              Parcela atual
                            </p>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setParcelaAtual((p) => Math.max(1, p - 1))}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/[0.08] text-amber-300 transition-colors hover:bg-amber-500/20 active:scale-95 disabled:opacity-30"
                                disabled={parcelaAtual <= 1}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <div className="flex-1 text-center">
                                <span className="text-2xl font-bold tabular-nums text-amber-300">{parcelaAtual}</span>
                                <span className="text-sm text-amber-300/50"> / {qtdParcelas}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setParcelaAtual((p) => Math.min(qtdParcelas, p + 1))}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/[0.08] text-amber-300 transition-colors hover:bg-amber-500/20 active:scale-95 disabled:opacity-30"
                                disabled={parcelaAtual >= qtdParcelas}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="mt-2 text-[10px] text-amber-300/50 text-center">
                              {parcelaAtual > 1 && `${parcelaAtual - 1} ${parcelaAtual - 1 === 1 ? "mês passado gerado" : "meses passados gerados"} · `}
                              {qtdParcelas - parcelaAtual > 0 && `${qtdParcelas - parcelaAtual} ${qtdParcelas - parcelaAtual === 1 ? "mês futuro" : "meses futuros"}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                {isAssinatura ? "Assinatura mensal" : tipoPgto === "parcelado" ? `${qtdParcelas} parcelas` : "Pagamento único"}
              </p>
              <div className="flex items-center gap-2 ml-auto">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="min-w-36 h-10 text-sm font-semibold">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEdit ? (
                    "Salvar alterações"
                  ) : isAssinatura ? (
                    "Criar assinatura"
                  ) : (
                    "Cadastrar gasto"
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
