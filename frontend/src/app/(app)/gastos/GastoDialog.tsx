"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const formSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória").max(255),
  valor_total: z.number().positive("Deve ser positivo"),
  data_gasto: z.string().min(1, "Data obrigatória"),
  categoria_id: z.string().optional(),
  forma_pagamento: z.enum([
    "dinheiro",
    "cartao_credito",
    "cartao_debito",
    "pix",
    "transferencia",
    "outro",
  ]),
  status: z.enum(["pendente", "pago", "cancelado"]),
  observacoes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Gasto {
  id: string;
  descricao: string;
  valor_total: number;
  data_gasto: string;
  categoria_id?: number;
  forma_pagamento: string;
  status: string;
  observacoes?: string;
}

interface Categoria {
  id: number;
  nome: string;
  cor: string;
  icone?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gasto?: Gasto | null;
}

const formasPgto: { value: string; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "pix", label: "Pix" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

export function GastoDialog({ open, onClose, onSuccess, gasto }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const isEdit = !!gasto;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: "",
      valor_total: undefined,
      data_gasto: new Date().toISOString().split("T")[0],
      categoria_id: undefined,
      forma_pagamento: "dinheiro",
      status: "pendente",
      observacoes: "",
    },
  });

  useEffect(() => {
    api
      .get<{ data: Categoria[] }>("/categorias")
      .then((r) => setCategorias(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      if (gasto) {
        form.reset({
          descricao: gasto.descricao,
          valor_total: Number(gasto.valor_total),
          data_gasto: gasto.data_gasto.slice(0, 10),
          categoria_id: gasto.categoria_id
            ? String(gasto.categoria_id)
            : undefined,
          forma_pagamento:
            gasto.forma_pagamento as FormValues["forma_pagamento"],
          status: gasto.status as FormValues["status"],
          observacoes: gasto.observacoes ?? "",
        });
      } else {
        form.reset({
          descricao: "",
          valor_total: undefined,
          data_gasto: new Date().toISOString().split("T")[0],
          categoria_id: undefined,
          forma_pagamento: "dinheiro",
          status: "pendente",
          observacoes: "",
        });
      }
    }
  }, [open, gasto, form]);

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      categoria_id: values.categoria_id
        ? Number(values.categoria_id)
        : undefined,
      tipo_pagamento: "a_vista" as const,
      quantidade_parcelas: 1,
    };
    try {
      if (isEdit) {
        await api.put(`/gastos/${gasto!.id}`, payload);
        toast.success("Gasto atualizado com sucesso");
      } else {
        await api.post("/gastos", payload);
        toast.success("Gasto cadastrado com sucesso");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar gasto");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Gasto" : "Novo Gasto"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Supermercado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined,
                          )
                        }
                      />
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
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.icone} {c.nome}
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
                name="forma_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagamento</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formasPgto.map((f) => (
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
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opcional..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
