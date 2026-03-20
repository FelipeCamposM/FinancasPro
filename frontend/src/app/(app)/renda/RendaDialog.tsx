"use client";

import { useEffect } from "react";
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
  observacoes: z.string().max(1000).optional(),
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
  observacoes?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  renda?: Renda | null;
}

const tiposRenda: { value: string; label: string }[] = [
  { value: "salario", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "investimento", label: "Investimento" },
  { value: "aluguel", label: "Aluguel" },
  { value: "bonus", label: "Bônus" },
  { value: "outro", label: "Outro" },
];

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
      observacoes: "",
    },
  });

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
          observacoes: "",
        });
      }
    }
  }, [open, renda, form]);

  async function onSubmit(values: FormValues) {
    // mes_referencia precisa ser uma data completa (YYYY-MM-DD) para o backend
    const payload = {
      ...values,
      mes_referencia: values.mes_referencia + "-01",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Renda" : "Nova Renda"}</DialogTitle>
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
                    <Input placeholder="Ex: Salário janeiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
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
                        {tiposRenda.map((t) => (
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
            </div>

            <FormField
              control={form.control}
              name="origem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa XYZ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mes_referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês referência</FormLabel>
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
                    <FormLabel>Data recebimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
