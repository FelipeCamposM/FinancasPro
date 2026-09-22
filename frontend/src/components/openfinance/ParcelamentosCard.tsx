"use client";

import { useState } from "react";
import { Layers, CreditCard, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brl, dataBr, mesBr, type OfParcelamentos } from "@/lib/openfinance";
import { cn } from "@/lib/utils";

interface ParcelamentosCardProps {
  dados: OfParcelamentos;
}

export function ParcelamentosCard({ dados }: ParcelamentosCardProps) {
  const [aberto, setAberto] = useState(false);
  const emAndamento = dados.itens.filter((i) => i.parcelas_restantes > 0);

  if (emAndamento.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-blue-300" />
            Parcelamentos em andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/45">
            Nenhuma compra parcelada em aberto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-blue-300" />
          Parcelamentos em andamento
        </CardTitle>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              Ver todas as parcelas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Parcelamentos</DialogTitle>
              <DialogDescription>
                As parcelas que o banco ainda não lançou aparecem como projeção,
                calculadas a partir da última parcela conhecida.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-4">
                {dados.itens.map((p) => (
                  <div
                    key={`${p.descricao}-${p.purchase_date}-${p.total_parcelas}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white/90">
                          {p.descricao}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
                          <span>comprado em {dataBr(p.purchase_date)}</span>
                          {(p.cartao_apelido ?? p.cartao_nome) && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {p.cartao_apelido ?? p.cartao_nome}
                              </span>
                            </>
                          )}
                          {p.categoria_nome && (
                            <>
                              <span>·</span>
                              <span style={{ color: p.categoria_cor ?? undefined }}>
                                {p.categoria_nome}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl ds-numeric leading-none text-white">
                          {brl(p.valor_parcela)}
                          <span className="text-sm text-white/40"> /mês</span>
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {p.parcelas_lancadas} de {p.total_parcelas} pagas ·
                          total {brl(p.valor_total)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-blue-400/70"
                          style={{
                            width: `${(p.parcelas_lancadas / p.total_parcelas) * 100}%`,
                          }}
                        />
                      </div>
                      {p.parcelas_restantes > 0 && (
                        <p className="mt-1.5 text-xs text-white/45">
                          faltam {p.parcelas_restantes} ·{" "}
                          <strong className="text-white/70">
                            {brl(p.falta_pagar)}
                          </strong>{" "}
                          até {mesBr(p.ultima_competencia)}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.parcelas.map((x) => (
                        <span
                          key={x.numero_parcela}
                          title={`${mesBr(x.competencia)} — ${brl(x.valor)}`}
                          className={cn(
                            "rounded-md px-2 py-1 text-[11px] tabular-nums",
                            x.projecao
                              ? "border border-dashed border-blue-300/30 bg-blue-500/[0.07] text-blue-200/80"
                              : "bg-white/[0.07] text-white/60",
                          )}
                        >
                          {x.numero_parcela}/{p.total_parcelas} ·{" "}
                          {mesBr(x.competencia)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Por mês só de parcela
            </p>
            <p className="font-display text-3xl ds-numeric leading-none text-blue-300">
              {brl(dados.comprometido_mensal)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Falta pagar
            </p>
            <p className="font-display text-2xl ds-numeric leading-none text-white/80">
              {brl(dados.falta_pagar)}
            </p>
          </div>
          <Badge className="border-blue-300/25 bg-blue-500/10 text-blue-200">
            {dados.em_andamento} compra(s) em aberto
          </Badge>
        </div>

        <div className="space-y-1.5">
          {emAndamento.slice(0, 4).map((p) => (
            <div
              key={`${p.descricao}-${p.purchase_date}`}
              className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                {p.descricao}
              </span>
              <Badge className="shrink-0 border-white/15 bg-white/[0.06] text-[10px] text-white/60">
                {p.parcelas_lancadas}/{p.total_parcelas}
              </Badge>
              <span className="shrink-0 flex items-center gap-1 text-xs text-white/45">
                <Calendar className="h-3 w-3" />
                até {mesBr(p.ultima_competencia)}
              </span>
              <span className="shrink-0 ds-numeric text-sm text-white/90">
                {brl(p.valor_parcela)}
              </span>
            </div>
          ))}
          {emAndamento.length > 4 && (
            <p className="pt-1 text-xs text-white/40">
              + {emAndamento.length - 4} outra(s) — abra o detalhe para ver
              todas.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
