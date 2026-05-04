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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2 } from "lucide-react";

// ── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = z.object({
  apelido: z.string().min(1, "Apelido obrigatório").max(50),
  nome_no_cartao: z.string().min(1, "Nome no cartão obrigatório").max(100),
  ultimos_4_digitos: z
    .string()
    .length(4, "Deve ter 4 dígitos")
    .regex(/^\d{4}$/, "Apenas números"),
  bandeira: z.enum([
    "visa",
    "mastercard",
    "elo",
    "amex",
    "hipercard",
    "alelo",
    "paypal",
    "discover",
    "outro",
  ]),
  tipo: z.enum(["credito", "debito", "credito_debito"]),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex: #1A2B3C)"),
  banco: z.string().min(1, "Banco obrigatório").max(100),
  limite: z.number().positive().optional(),
  dia_fechamento: z.number().int().min(1).max(31).optional(),
  dia_vencimento: z.number().int().min(1).max(31).optional(),
});

const editSchema = z.object({
  apelido: z.string().min(1, "Apelido obrigatório").max(50),
  nome_no_cartao: z.string().min(1, "Nome no cartão obrigatório").max(100),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (ex: #1A2B3C)"),
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

const PRESET_COLORS = [
  "#1A56DB",
  "#0E9F6E",
  "#E74694",
  "#FF5A1F",
  "#6875F5",
  "#4B5563",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CartaoDialog({ open, onClose, onSuccess, cartao }: Props) {
  const isEdit = !!cartao;

  // Create form
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

  // Edit form
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

  const watchedTipo = createForm.watch("tipo");
  const isCredito =
    !isEdit && (watchedTipo === "credito" || watchedTipo === "credito_debito");

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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
        </DialogHeader>

        {isEdit ? (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="apelido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apelido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="banco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="nome_no_cartao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome no cartão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: JOAO P SILVA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor do cartão</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          className="h-10 w-14 cursor-pointer p-1"
                          {...field}
                        />
                        <Input
                          placeholder="#1A56DB"
                          value={field.value}
                          onChange={field.onChange}
                          className="flex-1 font-mono uppercase"
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="h-6 w-6 rounded-full border border-white/20"
                              style={{ background: c }}
                              onClick={() => field.onChange(c)}
                            />
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="limite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dia_fechamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fechamento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Dia"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dia_vencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vencimento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          placeholder="Dia"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
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

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                >
                  {editForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="apelido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apelido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="banco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Nubank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="nome_no_cartao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome no cartão</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: JOAO P SILVA"
                        className="uppercase"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="ultimos_4_digitos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Últimos 4 dígitos</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0000"
                          maxLength={4}
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="bandeira"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bandeira</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={createForm.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor do cartão</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          className="h-10 w-14 cursor-pointer p-1"
                          {...field}
                        />
                        <Input
                          placeholder="#1A56DB"
                          value={field.value}
                          onChange={field.onChange}
                          className="flex-1 font-mono uppercase"
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="h-6 w-6 rounded-full border border-white/20"
                              style={{ background: c }}
                              onClick={() => field.onChange(c)}
                            />
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCredito && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={createForm.control}
                    name="limite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Limite (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="dia_fechamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fechamento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Dia"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="dia_vencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Dia"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
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

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                >
                  {createForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
