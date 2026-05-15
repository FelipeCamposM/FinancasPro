"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
import { CreditCard, Loader2, Wifi } from "lucide-react";

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  apelido: z.string().min(1, "Apelido obrigatório").max(50),
  nome_no_cartao: z.string().min(1, "Nome no cartão obrigatório").max(100),
  ultimos_4_digitos: z
    .string()
    .length(4, "Deve ter 4 dígitos")
    .regex(/^\d{4}$/, "Apenas números"),
  bandeira: z.enum([
    "visa", "mastercard", "elo", "amex", "hipercard",
    "alelo", "paypal", "discover", "outro",
  ]),
  tipo: z.enum(["credito", "debito", "credito_debito"]),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  banco: z.string().min(1, "Banco obrigatório").max(100),
  limite: z.number().positive().optional(),
  dia_fechamento: z.number().int().min(1).max(31).optional(),
  dia_vencimento: z.number().int().min(1).max(31).optional(),
});

const editSchema = z.object({
  apelido: z.string().min(1, "Apelido obrigatório").max(50),
  nome_no_cartao: z.string().min(1, "Nome no cartão obrigatório").max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  banco: z.string().min(1, "Banco obrigatório").max(100),
  limite: z.number().positive().optional(),
  dia_fechamento: z.number().int().min(1).max(31).optional(),
  dia_vencimento: z.number().int().min(1).max(31).optional(),
  ativo: z.boolean(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Cartao {
  id: string;
  apelido: string;
  nome_no_cartao: string;
  ultimos_4_digitos: string;
  bandeira: string;
  tipo: string;
  cor: string;
  banco: string;
  limite?: number;
  dia_fechamento?: number;
  dia_vencimento?: number;
  ativo: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cartao?: Cartao | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BANDEIRA_LOGOS: Record<string, string> = {
  visa: "/brand_cardlogos/visa.svg",
  mastercard: "/brand_cardlogos/mastercard.svg",
  elo: "/brand_cardlogos/elo.svg",
  amex: "/brand_cardlogos/amex.svg",
  hipercard: "/brand_cardlogos/hipercard.svg",
  alelo: "/brand_cardlogos/alelo.svg",
  paypal: "/brand_cardlogos/paypal.svg",
};

const BANDEIRAS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "amex", label: "American Express" },
  { value: "hipercard", label: "Hipercard" },
  { value: "alelo", label: "Alelo" },
  { value: "paypal", label: "PayPal" },
  { value: "discover", label: "Discover" },
  { value: "outro", label: "Outro" },
];

const TIPOS = [
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
  { value: "credito_debito", label: "Crédito e Débito" },
];

const TIPO_LABELS: Record<string, string> = {
  credito: "Crédito",
  debito: "Débito",
  credito_debito: "Créd/Déb",
};

const PRESET_COLORS = [
  "#1A56DB", "#7C3AED", "#0E9F6E", "#E74694",
  "#FF5A1F", "#4B5563", "#CA8A04", "#0891B2",
];

// ── Card preview ──────────────────────────────────────────────────────────────

interface PreviewData {
  apelido: string;
  nome_no_cartao: string;
  ultimos_4_digitos: string;
  bandeira: string;
  tipo: string;
  cor: string;
  banco: string;
}

function getContrastColor(hex: string): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return "#ffffff";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? "#1a1a1a" : "#ffffff";
}

function CardPreview({ data }: { data: PreviewData }) {
  const textColor = getContrastColor(data.cor);
  const isLight = textColor === "#1a1a1a";

  return (
    <div
      className="relative h-40 w-full rounded-2xl p-4 shadow-xl transition-all duration-300"
      style={{ background: data.cor, color: textColor }}
    >
      {/* shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rotate-12 bg-gradient-to-br from-white/10 to-transparent" />
      </div>

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest opacity-60">
            {data.banco || "Banco"}
          </p>
          <p className="mt-0.5 text-sm font-bold">
            {data.apelido || "Apelido"}
          </p>
        </div>
        <Wifi className="h-4 w-4 rotate-90 opacity-50" />
      </div>

      {/* Logo + número */}
      <div className="mt-3 flex items-center gap-3">
        {BANDEIRA_LOGOS[data.bandeira] ? (
          <img
            src={BANDEIRA_LOGOS[data.bandeira]}
            alt={data.bandeira}
            className="h-7 w-auto max-w-[56px] object-contain shrink-0"
            style={isLight ? {} : { filter: "brightness(0) invert(1)" }}
          />
        ) : (
          <div className={`h-7 w-9 rounded-md shrink-0 ${isLight ? "bg-black/15" : "bg-white/25"}`} />
        )}
        <p className="font-mono text-base tracking-widest opacity-90">
          •••• {data.ultimos_4_digitos || "0000"}
        </p>
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-widest opacity-50">Titular</p>
          <p className="text-xs font-semibold uppercase">
            {data.nome_no_cartao || "NOME NO CARTÃO"}
          </p>
        </div>
        <p className="text-[10px] font-semibold opacity-60">
          {TIPO_LABELS[data.tipo] ?? data.tipo}
        </p>
      </div>
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function FieldWrap({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

const inputCls =
  "h-9 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:bg-white/[0.07] focus:outline-none transition-colors";

// ── Component ─────────────────────────────────────────────────────────────────

export function CartaoDialog({ open, onClose, onSuccess, cartao }: Props) {
  const isEdit = !!cartao;

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      apelido: "",
      nome_no_cartao: "",
      ultimos_4_digitos: "",
      bandeira: "visa",
      tipo: "credito",
      cor: "#1A56DB",
      banco: "",
      limite: undefined,
      dia_fechamento: undefined,
      dia_vencimento: undefined,
    },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      apelido: "",
      nome_no_cartao: "",
      cor: "#1A56DB",
      banco: "",
      limite: undefined,
      dia_fechamento: undefined,
      dia_vencimento: undefined,
      ativo: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && cartao) {
      editForm.reset({
        apelido: cartao.apelido,
        nome_no_cartao: cartao.nome_no_cartao,
        cor: cartao.cor,
        banco: cartao.banco,
        limite: cartao.limite ?? undefined,
        dia_fechamento: cartao.dia_fechamento ?? undefined,
        dia_vencimento: cartao.dia_vencimento ?? undefined,
        ativo: cartao.ativo,
      });
    } else {
      createForm.reset({
        apelido: "",
        nome_no_cartao: "",
        ultimos_4_digitos: "",
        bandeira: "visa",
        tipo: "credito",
        cor: "#1A56DB",
        banco: "",
        limite: undefined,
        dia_fechamento: undefined,
        dia_vencimento: undefined,
      });
    }
  }, [open, isEdit, cartao, createForm, editForm]);

  // Watched values for preview
  const cv = createForm.watch();
  const ev = editForm.watch();

  const previewData: PreviewData = isEdit
    ? {
        apelido: ev.apelido,
        nome_no_cartao: ev.nome_no_cartao,
        cor: ev.cor,
        banco: ev.banco,
        bandeira: cartao!.bandeira,
        tipo: cartao!.tipo,
        ultimos_4_digitos: cartao!.ultimos_4_digitos,
      }
    : {
        apelido: cv.apelido,
        nome_no_cartao: cv.nome_no_cartao,
        cor: cv.cor,
        banco: cv.banco,
        bandeira: cv.bandeira,
        tipo: cv.tipo,
        ultimos_4_digitos: cv.ultimos_4_digitos,
      };

  const watchedTipo = createForm.watch("tipo");
  const isCredito = !isEdit && (watchedTipo === "credito" || watchedTipo === "credito_debito");

  async function onSubmitCreate(values: CreateValues) {
    try {
      await api.post("/cartoes", values);
      toast.success("Cartão cadastrado com sucesso");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao cadastrar cartão");
    }
  }

  async function onSubmitEdit(values: EditValues) {
    try {
      await api.put(`/cartoes/${cartao!.id}`, values);
      toast.success("Cartão atualizado com sucesso");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao atualizar cartão");
    }
  }

  const isSubmitting = isEdit
    ? editForm.formState.isSubmitting
    : createForm.formState.isSubmitting;

  // ── Color picker section (shared) ──────────────────────────────────────────

  function ColorSection({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Cor do cartão
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded-lg border border-white/[0.08] bg-transparent p-0.5"
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#1A56DB"
            className={`${inputCls} w-28 font-mono uppercase`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
              style={{
                background: c,
                borderColor: value === c ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[700px] p-0 overflow-hidden gap-0">

        {/* Header */}
        <div className="relative overflow-hidden border-b border-white/[0.08]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full bg-blue-500/[0.07] blur-2xl" />
          <div className="relative flex items-center gap-3 px-6 py-4 pr-14">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-400/20">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              {isEdit ? "Editar Cartão" : "Novo Cartão"}
            </DialogTitle>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-[248px_1fr]">

          {/* Left: Preview panel */}
          <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 md:border-b-0 md:border-r">
            <CardPreview data={previewData} />
            {isEdit ? (
              <ColorSection
                value={ev.cor}
                onChange={(v) => editForm.setValue("cor", v, { shouldValidate: true })}
              />
            ) : (
              <ColorSection
                value={cv.cor}
                onChange={(v) => createForm.setValue("cor", v, { shouldValidate: true })}
              />
            )}
          </div>

          {/* Right: Form */}
          <div className="overflow-y-auto max-h-[480px] p-5">
            {isEdit ? (
              <Form {...editForm}>
                <form
                  id="cartao-form"
                  onSubmit={editForm.handleSubmit(onSubmitEdit)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={editForm.control}
                      name="apelido"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Apelido" error={editForm.formState.errors.apelido?.message}>
                            <FormControl>
                              <Input placeholder="Ex: Nubank" {...field} className={inputCls} />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="banco"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Banco" error={editForm.formState.errors.banco?.message}>
                            <FormControl>
                              <Input placeholder="Ex: Nubank" {...field} className={inputCls} />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="nome_no_cartao"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FieldWrap label="Nome no cartão" error={editForm.formState.errors.nome_no_cartao?.message}>
                          <FormControl>
                            <Input
                              placeholder="Ex: JOAO P SILVA"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              className={`${inputCls} uppercase`}
                            />
                          </FormControl>
                        </FieldWrap>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={editForm.control}
                      name="limite"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Limite (R$)" error={editForm.formState.errors.limite?.message}>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                }
                                className={inputCls}
                              />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="dia_fechamento"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Fechamento" error={editForm.formState.errors.dia_fechamento?.message}>
                            <FormControl>
                              <Input
                                type="number"
                                min={1} max={31}
                                placeholder="Dia"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                className={inputCls}
                              />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="dia_vencimento"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Vencimento" error={editForm.formState.errors.dia_vencimento?.message}>
                            <FormControl>
                              <Input
                                type="number"
                                min={1} max={31}
                                placeholder="Dia"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                className={inputCls}
                              />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...createForm}>
                <form
                  id="cartao-form"
                  onSubmit={createForm.handleSubmit(onSubmitCreate)}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={createForm.control}
                      name="apelido"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Apelido" error={createForm.formState.errors.apelido?.message}>
                            <FormControl>
                              <Input placeholder="Ex: Nubank" {...field} className={inputCls} />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="banco"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Banco" error={createForm.formState.errors.banco?.message}>
                            <FormControl>
                              <Input placeholder="Ex: Nubank" {...field} className={inputCls} />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="nome_no_cartao"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FieldWrap label="Nome no cartão" error={createForm.formState.errors.nome_no_cartao?.message}>
                          <FormControl>
                            <Input
                              placeholder="Ex: JOAO P SILVA"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              className={`${inputCls} uppercase`}
                            />
                          </FormControl>
                        </FieldWrap>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={createForm.control}
                      name="ultimos_4_digitos"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FieldWrap label="Últimos 4 dígitos" error={createForm.formState.errors.ultimos_4_digitos?.message}>
                            <FormControl>
                              <Input
                                placeholder="0000"
                                maxLength={4}
                                inputMode="numeric"
                                {...field}
                                className={`${inputCls} font-mono tracking-widest`}
                              />
                            </FormControl>
                          </FieldWrap>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="bandeira"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                            Bandeira
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className={`${inputCls} w-full`}>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BANDEIRAS.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                  <div className="flex items-center gap-2">
                                    {BANDEIRA_LOGOS[b.value] ? (
                                      <img
                                        src={BANDEIRA_LOGOS[b.value]}
                                        alt={b.label}
                                        className="h-4 w-auto object-contain"
                                      />
                                    ) : (
                                      <span className="inline-block h-4 w-7 rounded-sm bg-muted" />
                                    )}
                                    {b.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                          Tipo
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className={`${inputCls} w-full`}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIPOS.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isCredito && (
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={createForm.control}
                        name="limite"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FieldWrap label="Limite (R$)" error={createForm.formState.errors.limite?.message}>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                                  }
                                  className={inputCls}
                                />
                              </FormControl>
                            </FieldWrap>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="dia_fechamento"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FieldWrap label="Fechamento" error={createForm.formState.errors.dia_fechamento?.message}>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1} max={31}
                                  placeholder="Dia"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                  }
                                  className={inputCls}
                                />
                              </FormControl>
                            </FieldWrap>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="dia_vencimento"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FieldWrap label="Vencimento" error={createForm.formState.errors.dia_vencimento?.message}>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1} max={31}
                                  placeholder="Dia"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                                  }
                                  className={inputCls}
                                />
                              </FormControl>
                            </FieldWrap>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </form>
              </Form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] bg-white/[0.02] px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-9 border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="cartao-form"
            disabled={isSubmitting}
            className="h-9 border border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
