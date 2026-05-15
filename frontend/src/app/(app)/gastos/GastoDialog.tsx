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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Plus, Minus, Pencil, Banknote, CreditCard, Smartphone,
  ArrowLeftRight, MoreHorizontal, CalendarDays, AlignLeft, Layers,
  Info, Tag, Clock, CheckCircle2, XCircle, Repeat, Wallet,
} from "lucide-react";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const formSchema = z
  .object({
    descricao: z.string().min(1, "Descrição obrigatória").max(255),
    valor_total: z.number().positive("Deve ser positivo").optional(),
    valor_parcela: z.number().positive("Deve ser positivo").optional(),
    data_gasto: z.string().min(1, "Data obrigatória"),
    categoria_id: z.string().optional(),
    cartao_id: z.string().optional(),
    forma_pagamento: z.enum(["dinheiro","cartao_credito","cartao_debito","pix","transferencia","outro"]),
    tipo_pagamento: z.enum(["a_vista", "parcelado"]),
    quantidade_parcelas: z.number().int().min(1).max(72),
    status: z.enum(["pendente", "pago", "cancelado"]),
    observacoes: z.string().max(1000).optional(),
    dia_cobranca: z.number().int().min(1).max(28),
  })
  .refine((d) => d.tipo_pagamento === "a_vista" ? d.valor_total != null && d.valor_total > 0 : true, { message: "Informe o valor do gasto", path: ["valor_total"] })
  .refine((d) => d.tipo_pagamento === "parcelado" ? d.valor_parcela != null && d.valor_parcela > 0 : true, { message: "Informe o valor de cada parcela", path: ["valor_parcela"] })
  .refine((d) => { if (d.forma_pagamento === "cartao_credito" || d.forma_pagamento === "cartao_debito") return !!d.cartao_id; return true; }, { message: "Selecione um cartão", path: ["cartao_id"] })
  .refine((d) => d.tipo_pagamento === "parcelado" ? d.quantidade_parcelas > 1 : true, { message: "Informe o número de parcelas (mín. 2)", path: ["quantidade_parcelas"] });

type FormValues = z.infer<typeof formSchema>;

interface Gasto {
  id: string; descricao: string; valor_total: number; data_gasto: string;
  categoria_id?: number; cartao_id?: string; forma_pagamento: string;
  status: string; observacoes?: string; tipo_pagamento?: string; quantidade_parcelas?: number;
}
interface Categoria { id: number; nome: string; cor: string; icone?: string; }
interface Cartao {
  id: string; apelido: string; bandeira: string; cor: string;
  ultimos_4_digitos: string; ativo: boolean; banco?: string; nome_no_cartao?: string; tipo?: string;
}

const BANDEIRA_LOGOS: Record<string, string> = {
  visa: "/brand_cardlogos/visa.svg", mastercard: "/brand_cardlogos/mastercard.svg",
  elo: "/brand_cardlogos/elo.svg", amex: "/brand_cardlogos/amex.svg",
  hipercard: "/brand_cardlogos/hipercard.svg", alelo: "/brand_cardlogos/alelo.svg",
  paypal: "/brand_cardlogos/paypal.svg",
};

const FORMAS_PGTO = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote, idle: "bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20", active: "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/25" },
  { value: "cartao_credito", label: "Crédito", icon: CreditCard, idle: "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20", active: "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25" },
  { value: "cartao_debito", label: "Débito", icon: Wallet, idle: "bg-indigo-500/10 border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/20", active: "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25" },
  { value: "pix", label: "Pix", icon: Smartphone, idle: "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20", active: "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/25" },
  { value: "transferencia", label: "Transf.", icon: ArrowLeftRight, idle: "bg-violet-500/10 border-violet-400/30 text-violet-300 hover:bg-violet-500/20", active: "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25" },
  { value: "outro", label: "Outro", icon: MoreHorizontal, idle: "bg-white/[0.06] border-white/15 text-white/50 hover:bg-white/10", active: "bg-white/20 border-white/30 text-white shadow-lg shadow-black/20" },
] as const;

const STATUS_OPTIONS = [
  { value: "pago", label: "Pago", icon: CheckCircle2, idle: "bg-blue-500/10 border-blue-400/30 text-blue-300 hover:bg-blue-500/20", active: "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25" },
  { value: "pendente", label: "Pendente", icon: Clock, idle: "bg-amber-500/10 border-amber-400/30 text-amber-300 hover:bg-amber-500/20", active: "bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/25" },
  { value: "cancelado", label: "Cancelado", icon: XCircle, idle: "bg-rose-500/10 border-rose-400/30 text-rose-300 hover:bg-rose-500/20", active: "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/25" },
] as const;

function getContrastColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? "#1a1a1a" : "#ffffff";
}

function CartaoMini({ cartao, selected, onClick }: { cartao: Cartao; selected: boolean; onClick: () => void }) {
  const textColor = getContrastColor(cartao.cor);
  const isLight = textColor === "#1a1a1a";
  return (
    <button type="button" onClick={onClick} style={{ background: cartao.cor, color: textColor }}
      className={`relative h-[76px] w-36 shrink-0 rounded-xl p-3 text-left transition-all duration-150 active:scale-95 ${selected ? "border-2 border-white/70 shadow-xl shadow-black/40 opacity-100" : "border-2 border-transparent opacity-55 hover:opacity-85"}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold truncate max-w-[80px]" style={{ color: textColor, opacity: 0.85 }}>{cartao.apelido}</p>
        {BANDEIRA_LOGOS[cartao.bandeira]
          ? <img src={BANDEIRA_LOGOS[cartao.bandeira]} alt={cartao.bandeira} className="h-5 w-auto max-w-[32px] object-contain shrink-0" style={isLight ? {} : { filter: "brightness(0) invert(1)" }} />
          : <div className={`h-4 w-6 rounded shrink-0 ${isLight ? "bg-black/20" : "bg-white/30"}`} />}
      </div>
      <p className="mt-auto pt-2 font-mono text-xs tracking-widest" style={{ color: textColor, opacity: 0.75 }}>•••• {cartao.ultimos_4_digitos}</p>
    </button>
  );
}

function DiaCobrancaSpinner({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [inputVal, setInputVal] = useState(String(value));
  useEffect(() => { setInputVal(String(value)); }, [value]);
  const clamp = (v: number) => Math.min(28, Math.max(1, v));
  function commit(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) { const c = clamp(parsed); onChange(c); setInputVal(String(c)); }
    else setInputVal(String(value));
  }
  function step(delta: number) { const n = clamp(value + delta); onChange(n); setInputVal(String(n)); }
  const btnCls = "h-11 w-11 shrink-0 rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => step(-1)} disabled={value <= 1} className={btnCls}><Minus className="h-4 w-4" /></button>
      <div className="relative flex-1">
        <Input type="number" min={1} max={28} value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(inputVal); if (e.key === "ArrowUp") { e.preventDefault(); step(1); } if (e.key === "ArrowDown") { e.preventDefault(); step(-1); } }}
          className="h-14 text-center text-2xl font-bold tabular-nums text-violet-300 border-violet-400/30 bg-violet-500/[0.08] focus-visible:ring-violet-400/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/25 select-none">/ 28</span>
      </div>
      <button type="button" onClick={() => step(1)} disabled={value >= 28} className={btnCls}><Plus className="h-4 w-4" /></button>
    </div>
  );
}

function ParcelasSpinner({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [inputVal, setInputVal] = useState(`${value}×`);
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (!focused) setInputVal(`${value}×`); }, [value, focused]);
  const clamp = (v: number) => Math.min(72, Math.max(2, isNaN(v) ? 2 : v));
  function commit(raw: string) {
    const c = clamp(parseInt(raw.replace(/[^0-9]/g, ""), 10));
    onChange(c); setFocused(false); setInputVal(`${c}×`);
  }
  function step(delta: number) { const n = clamp(value + delta); onChange(n); if (!focused) setInputVal(`${n}×`); }
  const btnCls = "h-11 w-11 shrink-0 rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => step(-1)} disabled={value <= 2} className={btnCls}><Minus className="h-4 w-4" /></button>
      <Input type="text" inputMode="numeric" value={inputVal}
        onFocus={() => { setFocused(true); setInputVal(String(value)); }}
        onChange={(e) => setInputVal(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(inputVal); } if (e.key === "ArrowUp") { e.preventDefault(); step(1); } if (e.key === "ArrowDown") { e.preventDefault(); step(-1); } }}
        className="h-14 text-center text-2xl font-bold tabular-nums text-amber-300 border-amber-400/30 bg-amber-500/[0.08] focus-visible:ring-amber-400/50" />
      <button type="button" onClick={() => step(1)} disabled={value >= 72} className={btnCls}><Plus className="h-4 w-4" /></button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 mb-2">{children}</p>;
}

function Sep() {
  return <div className="h-px bg-white/[0.06]" />;
}

interface Props {
  open: boolean; onClose: () => void; onSuccess: () => void;
  gasto?: Gasto | null; forceAssinatura?: boolean;
}

export function GastoDialog({ open, onClose, onSuccess, gasto, forceAssinatura = false }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [isAssinatura, setIsAssinatura] = useState(forceAssinatura);
  const [parcelamentoJaIniciado, setParcelamentoJaIniciado] = useState(false);
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(false);
  const [parcelaAtual, setParcelaAtual] = useState(1);
  const isEdit = !!gasto;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "", valor_total: undefined, valor_parcela: undefined,
      data_gasto: new Date().toISOString().split("T")[0],
      categoria_id: undefined, cartao_id: undefined,
      forma_pagamento: "dinheiro", tipo_pagamento: "a_vista",
      quantidade_parcelas: 1, status: "pago", observacoes: "", dia_cobranca: 1,
    },
  });

  const formaPgto    = form.watch("forma_pagamento");
  const tipoPgto     = form.watch("tipo_pagamento");
  const qtdParcelas  = form.watch("quantidade_parcelas");
  const valorParcela = form.watch("valor_parcela");
  const valorTotal   = form.watch("valor_total");
  const totalCalculado = tipoPgto === "parcelado" && valorParcela && qtdParcelas > 1 ? valorParcela * qtdParcelas : null;
  const valorAtual = tipoPgto === "parcelado" ? (totalCalculado ?? 0) : (valorTotal ?? 0);
  const isCard = formaPgto === "cartao_credito" || formaPgto === "cartao_debito";

  function resetParcelamento() {
    setParcelamentoJaIniciado(false);
    setParcelaAtual(1);
    setParcelasSelecionadas(false);
  }

  function toggleAssinatura(checked: boolean) {
    setIsAssinatura(checked);
    if (checked) {
      form.setValue("tipo_pagamento", "a_vista");
      form.setValue("quantidade_parcelas", 1);
      form.setValue("valor_parcela", undefined);
      form.setValue("status", "pago");
      resetParcelamento();
    }
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
    if (formaPgto !== "cartao_credito" && formaPgto !== "cartao_debito") form.setValue("cartao_id", undefined);
    if (!isEdit) form.setValue("status", formaPgto === "cartao_credito" ? "pendente" : "pago");
  }, [formaPgto, form, isEdit]);

  useEffect(() => {
    if (tipoPgto === "a_vista") { form.setValue("quantidade_parcelas", 1); form.setValue("valor_parcela", undefined); }
    else { const cur = form.getValues("quantidade_parcelas"); if (!cur || cur < 2) form.setValue("quantidade_parcelas", 2); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoPgto]);

  useEffect(() => {
    if (!open) return;
    setIsAssinatura(forceAssinatura);
    resetParcelamento();
    if (gasto) {
      const isParceladoEdit = gasto.tipo_pagamento === "parcelado";
      form.reset({
        descricao: gasto.descricao,
        valor_total: isParceladoEdit ? undefined : Number(gasto.valor_total),
        valor_parcela: isParceladoEdit ? Number(gasto.valor_total) : undefined,
        data_gasto: gasto.data_gasto.slice(0, 10),
        categoria_id: gasto.categoria_id ? String(gasto.categoria_id) : undefined,
        cartao_id: gasto.cartao_id ?? undefined,
        forma_pagamento: gasto.forma_pagamento as FormValues["forma_pagamento"],
        tipo_pagamento: (gasto.tipo_pagamento as FormValues["tipo_pagamento"]) ?? "a_vista",
        quantidade_parcelas: gasto.quantidade_parcelas ?? 1,
        status: gasto.status as FormValues["status"], observacoes: gasto.observacoes ?? "", dia_cobranca: 1,
      });
    } else {
      form.reset({
        descricao: "", valor_total: undefined, valor_parcela: undefined,
        data_gasto: new Date().toISOString().split("T")[0],
        categoria_id: undefined, cartao_id: undefined,
        forma_pagamento: "dinheiro", tipo_pagamento: "a_vista",
        quantidade_parcelas: 1, status: "pago", observacoes: "", dia_cobranca: 1,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gasto, forceAssinatura]);

  async function onSubmit(values: FormValues) {
    const isParcelado = values.tipo_pagamento === "parcelado";
    try {
      if (isAssinatura && !isEdit) {
        if (!values.valor_total || values.valor_total <= 0) { form.setError("valor_total", { message: "Informe o valor mensal" }); return; }
        await api.post("/assinaturas", {
          descricao: values.descricao, valor: values.valor_total,
          categoria_id: values.categoria_id ? Number(values.categoria_id) : undefined,
          cartao_id: values.cartao_id || undefined, forma_pagamento: values.forma_pagamento,
          dia_cobranca: values.dia_cobranca, data_inicio: values.data_gasto, observacoes: values.observacoes || undefined,
        });
        toast.success("Assinatura cadastrada — próximos 24 meses lançados");
        onSuccess(); onClose(); return;
      }

      let dataGasto = values.data_gasto;
      if (isParcelado && parcelamentoJaIniciado && parcelaAtual > 1) {
        const [y, m, d] = dataGasto.split("-").map(Number);
        const dt = new Date(y, m - 1 - (parcelaAtual - 1), d, 12);
        dataGasto = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      }

      const payload = {
        descricao: values.descricao,
        valor_total: isParcelado ? (values.valor_parcela ?? 0) : (values.valor_total ?? 0),
        valor_parcela: isParcelado ? values.valor_parcela : undefined,
        data_gasto: dataGasto,
        categoria_id: values.categoria_id ? Number(values.categoria_id) : undefined,
        cartao_id: values.cartao_id || undefined, forma_pagamento: values.forma_pagamento,
        tipo_pagamento: values.tipo_pagamento, quantidade_parcelas: values.quantidade_parcelas,
        status: values.status, observacoes: values.observacoes || undefined,
      };

      if (isEdit) { await api.put(`/gastos/${gasto!.id}`, payload); toast.success("Gasto atualizado"); }
      else { await api.post("/gastos", payload); toast.success(isParcelado ? `Gasto parcelado em ${values.quantidade_parcelas}× cadastrado` : "Gasto cadastrado"); }
      onSuccess(); onClose();
    } catch { toast.error("Erro ao salvar gasto"); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetParcelamento(); onClose(); } }}>
      <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/[0.09]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-rose-500/[0.08] blur-2xl" />
          <div className="relative flex items-start gap-4 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 ring-1 ring-rose-400/20 shadow-lg shadow-rose-500/10">
              {isEdit ? <Pencil className="h-5 w-5 text-rose-400" /> : isAssinatura ? <Repeat className="h-5 w-5 text-rose-400" /> : <Plus className="h-5 w-5 text-rose-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-xl font-bold leading-none text-white">
                  {isEdit ? "Editar gasto" : isAssinatura ? "Nova assinatura" : "Novo gasto"}
                </DialogTitle>
                <p className="mt-1.5 text-sm text-white/40">
                  {isEdit ? "Atualize os dados da despesa" : isAssinatura ? "Cobrança recorrente mensal automática" : "Registre uma nova despesa"}
                </p>
              </DialogHeader>
            </div>
            {valorAtual > 0 && (
              <div className="shrink-0 text-right pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/20">Total</p>
                <p className="text-lg font-bold tabular-nums text-rose-400 leading-none mt-0.5">{formatBRL(valorAtual)}</p>
              </div>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-5 py-5 space-y-5 overflow-y-auto max-h-[calc(100dvh-14rem)] sm:max-h-[62vh]">

              {/* Hint: cascade parcelado */}
              {isEdit && gasto?.tipo_pagamento === "parcelado" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.08] px-3.5 py-2.5">
                  <Layers className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-400/70" />
                  <p className="text-[11px] text-amber-300/70 leading-relaxed">
                    Alterações serão aplicadas a todas as parcelas futuras deste parcelamento.
                  </p>
                </div>
              )}

              {/* 1 — Descrição */}
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem>
                  <SectionLabel>Descrição</SectionLabel>
                  <FormControl>
                    <Input placeholder="Ex: Supermercado, Netflix, Aluguel..." {...field} className="h-14 text-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Sep />

              {/* 2 — Valor + Data */}
              <div className="grid grid-cols-[3fr_2fr] gap-3">
                {tipoPgto === "a_vista" ? (
                  <FormField control={form.control} name="valor_total" render={({ field }) => (
                    <FormItem>
                      <SectionLabel>{isAssinatura ? "Valor mensal" : "Valor"}</SectionLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/30 select-none">R$</span>
                          <CurrencyInput value={field.value} onChange={field.onChange} className="pl-9 h-12 text-lg font-bold tabular-nums text-rose-300 placeholder:text-white/20" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ) : (
                  <div className="flex items-end">
                    <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">Total estimado</p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-rose-300">{totalCalculado ? formatBRL(totalCalculado) : "—"}</p>
                    </div>
                  </div>
                )}
                <FormField control={form.control} name="data_gasto" render={({ field }) => (
                  <FormItem>
                    <SectionLabel><span className="flex items-center gap-1"><CalendarDays className="h-2.5 w-2.5" />{isAssinatura ? "Início" : "Data"}</span></SectionLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <button type="button" className="ui-control flex h-12 w-full items-center gap-2 px-3">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/40" />
                            <span className={`text-sm ${field.value ? "text-white/90" : "text-white/35"}`}>
                              {field.value ? (() => { const [y, m, d] = field.value.split("-"); return `${d}/${m}/${y}`; })() : "Selecionar"}
                            </span>
                          </button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="ui-popover w-auto p-0 ui-glass-surface-strong border-white/[0.14]" align="start">
                        <Calendar mode="single" className="bg-transparent"
                          selected={field.value ? new Date(field.value + "T12:00:00") : undefined}
                          onSelect={(date) => { if (date) { const y = date.getFullYear(), mo = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0"); field.onChange(`${y}-${mo}-${d}`); } }}
                          initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Sep />

              {/* 3 — Forma de pagamento */}
              <FormField control={form.control} name="forma_pagamento" render={({ field }) => (
                <FormItem>
                  <SectionLabel>Forma de pagamento</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMAS_PGTO.map((f) => { const Icon = f.icon; const sel = field.value === f.value; return (
                      <button key={f.value} type="button" onClick={() => field.onChange(f.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all duration-150 active:scale-95 ${sel ? f.active : f.idle}`}>
                        <Icon className="h-4 w-4" />{f.label}
                      </button>
                    ); })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* 4 — Cartão */}
              {isCard && (
                <FormField control={form.control} name="cartao_id" render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Cartão</SectionLabel>
                    {cartoes.length === 0 ? (
                      <p className="text-xs text-white/40 py-2">Nenhum cartão cadastrado.</p>
                    ) : (
                      <div className="flex gap-2.5 overflow-x-auto py-1 -mx-1 px-1 snap-x snap-mandatory">
                        {cartoes.map((c) => <CartaoMini key={c.id} cartao={c} selected={field.value === c.id} onClick={() => field.onChange(c.id)} />)}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <Sep />

              {/* 5 — Status */}
              {!isAssinatura && (
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <SectionLabel>Status do pagamento</SectionLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {STATUS_OPTIONS.map((s) => { const Icon = s.icon; const sel = field.value === s.value; return (
                        <button key={s.value} type="button" onClick={() => field.onChange(s.value)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 text-xs font-semibold transition-all duration-150 active:scale-95 ${sel ? s.active : s.idle}`}>
                          <Icon className="h-4 w-4" />{s.label}
                        </button>
                      ); })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* 6 — Parcelamento */}
              {!isAssinatura && (
                <div className={`rounded-xl border-2 p-4 transition-colors ${tipoPgto === "parcelado" ? "border-amber-400/40 bg-amber-500/[0.08]" : "border-dashed border-white/10 bg-white/[0.03]"}`}>
                  <FormField control={form.control} name="tipo_pagamento" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-lg p-2 transition-colors ${tipoPgto === "parcelado" ? "bg-amber-500/20" : "bg-white/[0.06]"}`}>
                            <Layers className={`h-4 w-4 ${tipoPgto === "parcelado" ? "text-amber-300" : "text-white/40"}`} />
                          </div>
                          <div>
                            <FormLabel className={`text-sm font-semibold ${tipoPgto === "parcelado" ? "text-amber-300" : "text-white/70"}`}>Pagamento parcelado</FormLabel>
                            <p className="text-xs text-white/35 mt-0.5">{tipoPgto === "parcelado" ? "Cobranças lançadas automaticamente" : "Ative para parcelar este gasto"}</p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch checked={field.value === "parcelado"}
                            onCheckedChange={(c) => { field.onChange(c ? "parcelado" : "a_vista"); if (!c) resetParcelamento(); }}
                            className="data-[state=checked]:bg-amber-500" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {tipoPgto === "parcelado" && (
                    <div className="pt-3 mt-3 border-t border-amber-400/20 space-y-4">
                      <FormField control={form.control} name="valor_parcela" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-amber-300/80 font-semibold">Valor por parcela</FormLabel>
                          <FormControl>
                            <div className="relative mt-1.5">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400/50 select-none">R$</span>
                              <CurrencyInput value={field.value} onChange={field.onChange} className="pl-9 border-amber-400/30 focus-visible:ring-amber-400" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="quantidade_parcelas" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-amber-300/80 font-semibold">Nº de parcelas</FormLabel>
                          <div className="mt-1.5">
                            <ParcelasSpinner value={field.value} onChange={(v) => { field.onChange(v); setParcelasSelecionadas(true); }} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {totalCalculado != null && (
                        <div className="flex items-center justify-between rounded-lg bg-amber-500/[0.08] border border-amber-400/20 px-3 py-2.5">
                          <p className="text-xs text-amber-300/70 font-medium">{qtdParcelas}× de {formatBRL(valorParcela ?? 0)}</p>
                          <p className="text-sm font-bold tabular-nums text-amber-300">{formatBRL(totalCalculado)}</p>
                        </div>
                      )}

                      {/* Parcelamento já iniciado — bloqueado até spinner ser usado */}
                      <div className={`rounded-lg border p-3 transition-all ${parcelamentoJaIniciado ? "border-amber-400/30 bg-amber-500/[0.06]" : "border-white/[0.07] bg-white/[0.02]"} ${!parcelasSelecionadas ? "opacity-40 pointer-events-none" : ""}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${parcelamentoJaIniciado ? "text-amber-300" : "text-white/50"}`}>Parcelamento já iniciado?</p>
                            <p className="text-[10px] text-white/30 mt-0.5">
                              {!parcelasSelecionadas ? "Informe o nº de parcelas primeiro" : "Informe em qual parcela você está agora"}
                            </p>
                          </div>
                          <Switch checked={parcelamentoJaIniciado} disabled={!parcelasSelecionadas}
                            onCheckedChange={(c) => { setParcelamentoJaIniciado(c); if (!c) setParcelaAtual(1); }}
                            className="data-[state=checked]:bg-amber-500 shrink-0" />
                        </div>

                        {parcelamentoJaIniciado && parcelasSelecionadas && (
                          <div className="mt-3 pt-3 border-t border-amber-400/20">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300/60 mb-2">Parcela atual</p>
                            <div className="flex items-center gap-3">
                              <button type="button" onClick={() => setParcelaAtual((p) => Math.max(1, p - 1))} disabled={parcelaAtual <= 1}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/[0.08] text-amber-300 transition-colors hover:bg-amber-500/20 active:scale-95 disabled:opacity-30">
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <div className="flex-1 text-center">
                                <span className="text-2xl font-bold tabular-nums text-amber-300">{parcelaAtual}</span>
                                <span className="text-sm text-amber-300/50"> / {qtdParcelas}</span>
                              </div>
                              <button type="button" onClick={() => setParcelaAtual((p) => Math.min(qtdParcelas, p + 1))} disabled={parcelaAtual >= qtdParcelas}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/[0.08] text-amber-300 transition-colors hover:bg-amber-500/20 active:scale-95 disabled:opacity-30">
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

              {/* 7 — Assinatura */}
              {!isEdit && !forceAssinatura && (
                <div className={`rounded-xl border-2 p-4 transition-colors ${isAssinatura ? "border-violet-400/40 bg-violet-500/[0.08]" : "border-dashed border-white/10 bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`rounded-lg p-2 transition-colors ${isAssinatura ? "bg-violet-500/20" : "bg-white/[0.06]"}`}>
                        <Repeat className={`h-4 w-4 ${isAssinatura ? "text-violet-300" : "text-white/40"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isAssinatura ? "text-violet-300" : "text-white/70"}`}>É uma assinatura?</p>
                        <p className="text-xs text-white/35 mt-0.5">{isAssinatura ? "Cobranças mensais geradas automaticamente" : "Repete todo mês? Ative aqui"}</p>
                      </div>
                    </div>
                    <Switch checked={isAssinatura} onCheckedChange={toggleAssinatura} className="data-[state=checked]:bg-violet-500" />
                  </div>

                  {isAssinatura && (
                    <div className="pt-3 mt-3 border-t border-violet-400/20">
                      <FormField control={form.control} name="dia_cobranca" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-violet-300/80 font-semibold">Dia de cobrança (todo mês)</FormLabel>
                          <div className="mt-2">
                            <DiaCobrancaSpinner value={field.value} onChange={field.onChange} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <p className="mt-2.5 flex items-start gap-1.5 text-xs text-white/35">
                        <Info className="h-3.5 w-3.5 text-violet-400 mt-px shrink-0" />
                        Lançamentos criados para os próximos 24 meses.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Sep />

              {/* 8 — Categoria */}
              {!isAssinatura && (
                <FormField control={form.control} name="categoria_id" render={({ field }) => (
                  <FormItem>
                    <SectionLabel><span className="flex items-center gap-1"><Tag className="h-2.5 w-2.5" />Categoria</span></SectionLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.cor ?? "#94a3b8" }} />
                              {c.icone ? `${c.icone} ` : ""}{c.nome}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              {/* 9 — Observações */}
              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem>
                  <SectionLabel><span className="flex items-center gap-1"><AlignLeft className="h-2.5 w-2.5" />Observações</span></SectionLabel>
                  <FormControl>
                    <Textarea placeholder="Notas adicionais (opcional)..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2 border-t border-white/[0.08] bg-white/[0.03] px-5 py-3.5">
              <p className="hidden text-xs text-white/25 sm:block">
                {isAssinatura ? "Assinatura mensal" : tipoPgto === "parcelado" ? `${qtdParcelas}× parcelado` : "Pagamento único"}
              </p>
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}
                  className="h-10 min-w-36 border border-white/15 bg-white/10 text-sm font-semibold text-white hover:bg-white/[0.15] hover:border-white/20">
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Salvar alterações" : isAssinatura ? "Criar assinatura" : "Cadastrar gasto"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
