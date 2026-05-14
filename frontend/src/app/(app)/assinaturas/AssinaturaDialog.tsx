"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
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
  Repeat,
  CreditCard,
  Wallet,
  CalendarDays,
  AlignLeft,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória").max(255),
  valor: z.number().positive("Deve ser positivo"),
  forma_pagamento: z.enum(["cartao_credito", "cartao_debito"]),
  cartao_id: z.string().uuid("Selecione um cartão"),
  dia_cobranca: z.number().int().min(1).max(31),
  data_inicio: z.string().min(1, "Data obrigatória"),
  categoria_id: z.string().optional(),
  observacoes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/50 mb-2">
      {children}
    </p>
  );
}

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
          ? "ring-2 ring-violet-400/80 ring-offset-2 ring-offset-[hsl(222_47%_5%)] scale-[1.04] shadow-xl shadow-violet-500/20"
          : "opacity-55 hover:opacity-85 hover:scale-[1.02]"
      }`}
      style={{ background: cartao.cor, color: textColor }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] font-semibold truncate max-w-[80px]"
          style={{ color: textColor, opacity: 0.85 }}
        >
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
          <div
            className={`h-4 w-6 rounded shrink-0 ${isLight ? "bg-black/20" : "bg-white/30"}`}
          />
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

function DiaCobrancaSpinner({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [inputVal, setInputVal] = useState(String(value));

  useEffect(() => {
    setInputVal(String(value));
  }, [value]);

  function clamp(v: number) {
    return Math.min(31, Math.max(1, v));
  }

  function commit(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      const clamped = clamp(parsed);
      onChange(clamped);
      setInputVal(String(clamped));
    } else {
      setInputVal(String(value));
    }
  }

  function step(delta: number) {
    const next = clamp(value + delta);
    onChange(next);
    setInputVal(String(next));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= 1}
        className="h-11 w-11 shrink-0 rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="relative flex-1">
        <Input
          type="number"
          min={1}
          max={31}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(inputVal);
            if (e.key === "ArrowUp") { e.preventDefault(); step(1); }
            if (e.key === "ArrowDown") { e.preventDefault(); step(-1); }
          }}
          className="h-14 text-center text-2xl font-bold tabular-nums text-violet-300
            border-violet-400/30 bg-violet-500/[0.08]
            focus-visible:ring-violet-400/50 focus-visible:border-violet-400/60
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white/25 select-none">
          / 31
        </span>
      </div>

      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= 31}
        className="h-11 w-11 shrink-0 rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FORMA_OPTIONS = [
  {
    value: "cartao_credito" as const,
    label: "Crédito",
    icon: CreditCard,
  },
  {
    value: "cartao_debito" as const,
    label: "Débito",
    icon: Wallet,
  },
] as const;

export function AssinaturaDialog({ open, onClose, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: "",
      valor: undefined,
      forma_pagamento: "cartao_credito",
      cartao_id: undefined,
      dia_cobranca: 1,
      data_inicio: new Date().toISOString().split("T")[0],
      categoria_id: undefined,
      observacoes: "",
    },
  });

  const formaPgto = form.watch("forma_pagamento");

  useEffect(() => {
    Promise.all([
      api
        .get<{ data: Categoria[] }>("/categorias?tipo=gasto&limit=100")
        .catch(() => ({ data: { data: [] as Categoria[] } })),
      api
        .get<{ data: Cartao[] }>("/cartoes?limit=100")
        .catch(() => ({ data: { data: [] as Cartao[] } })),
    ]).then(([catRes, cartRes]) => {
      setCategorias(catRes.data.data ?? []);
      setCartoes((cartRes.data.data ?? []).filter((c) => c.ativo));
    });
  }, []);

  useEffect(() => {
    if (open) {
      form.reset({
        descricao: "",
        valor: undefined,
        forma_pagamento: "cartao_credito",
        cartao_id: undefined,
        dia_cobranca: 1,
        data_inicio: new Date().toISOString().split("T")[0],
        categoria_id: undefined,
        observacoes: "",
      });
    }
  }, [open, form]);

  async function onSubmit(values: FormValues) {
    try {
      await api.post("/assinaturas", {
        descricao: values.descricao,
        valor: values.valor,
        categoria_id: values.categoria_id
          ? Number(values.categoria_id)
          : undefined,
        cartao_id: values.cartao_id,
        forma_pagamento: values.forma_pagamento,
        dia_cobranca: values.dia_cobranca,
        data_inicio: values.data_inicio,
        observacoes: values.observacoes || undefined,
      });
      toast.success("Assinatura criada — 24 meses lançados automaticamente");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao criar assinatura");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-violet-400/[0.12] bg-violet-500/[0.04]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 ring-1 ring-violet-400/30">
            <Repeat className="h-4 w-4 text-violet-300" />
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold leading-none text-white">
              Nova assinatura
            </DialogTitle>
            <p className="text-xs text-violet-300/50 mt-1">
              Cobrança recorrente mensal via cartão
            </p>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-5 py-5 space-y-5 overflow-y-auto max-h-[calc(100dvh-14rem)] sm:max-h-[62vh]">

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Nome da assinatura</SectionLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Netflix, Spotify, Academia..."
                        {...field}
                        className="h-12 text-lg border-violet-400/20 focus-visible:ring-violet-400/40"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor + Data início */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>Valor mensal</SectionLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-violet-400/50 select-none">
                            R$
                          </span>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            className="pl-9 h-12 text-lg font-bold tabular-nums text-violet-300 border-violet-400/20 focus-visible:ring-violet-400/40 placeholder:text-white/20"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <SectionLabel>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-2.5 w-2.5" />
                          Início
                        </span>
                      </SectionLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <button
                              type="button"
                              className="ui-control flex h-12 w-full items-center gap-2 px-3 text-base border-violet-400/20"
                            >
                              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-400/50" />
                              <span className={field.value ? "text-white/90" : "text-white/35"}>
                                {field.value
                                  ? (() => {
                                      const [y, m, d] = field.value.split("-");
                                      return `${d}/${m}/${y}`;
                                    })()
                                  : "Selecionar"}
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
                            selected={
                              field.value
                                ? new Date(field.value + "T12:00:00")
                                : undefined
                            }
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
                    <SectionLabel>Tipo de cartão</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMA_OPTIONS.map((f) => {
                        const Icon = f.icon;
                        const isSelected = field.value === f.value;
                        return (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => field.onChange(f.value)}
                            className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-150 active:scale-95 ${
                              isSelected
                                ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                                : "bg-violet-500/10 border-violet-400/25 text-violet-300 hover:bg-violet-500/20"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            Cartão {f.label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cartão */}
              <FormField
                control={form.control}
                name="cartao_id"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Selecione o cartão</SectionLabel>
                    {cartoes.length === 0 ? (
                      <p className="text-xs text-white/40 py-2">
                        Nenhum cartão ativo cadastrado.
                      </p>
                    ) : (
                      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
                        {cartoes
                          .filter((c) => {
                            if (formaPgto === "cartao_credito")
                              return c.tipo === "credito" || c.tipo === "credito_debito" || !c.tipo;
                            if (formaPgto === "cartao_debito")
                              return c.tipo === "debito" || c.tipo === "credito_debito" || !c.tipo;
                            return true;
                          })
                          .map((c) => (
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

              {/* Dia de cobrança */}
              <Controller
                control={form.control}
                name="dia_cobranca"
                render={({ field, fieldState }) => (
                  <div>
                    <SectionLabel>Dia de cobrança (todo mês)</SectionLabel>
                    <DiaCobrancaSpinner
                      value={field.value}
                      onChange={field.onChange}
                    />
                    {fieldState.error && (
                      <p className="text-xs text-rose-400 mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] text-white/30">
                      {field.value === 31
                        ? "Meses com menos de 31 dias cobrarão no último dia."
                        : field.value >= 29
                          ? "Fevereiro pode diferir."
                          : `Cobra todo dia ${field.value} do mês.`}
                    </p>
                  </div>
                )}
              />

              {/* Categoria */}
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Categoria (opcional)</SectionLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 border-violet-400/20 focus:ring-violet-400/40">
                          <SelectValue placeholder="Selecionar categoria..." />
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
              />

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
                        placeholder="Plano, link, login... (opcional)"
                        className="resize-none border-violet-400/20 focus-visible:ring-violet-400/40"
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
            <div className="flex items-center justify-between gap-2 border-t border-violet-400/[0.12] bg-violet-500/[0.04] px-5 py-3.5">
              <p className="flex items-center gap-1.5 text-xs text-violet-300/40 hidden sm:flex">
                <Info className="h-3.5 w-3.5 text-violet-400/50" />
                24 meses lançados automaticamente
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
                  disabled={form.formState.isSubmitting}
                  className="min-w-36 h-10 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white border-0"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Criar assinatura"
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
