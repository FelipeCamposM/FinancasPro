"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RendaVsGastosChart } from "@/components/dashboard/RendaVsGastosChart";
import { GastosCategoriaChart } from "@/components/dashboard/GastosCategoriaChart";
import { FormaPagamentoChart } from "@/components/dashboard/FormaPagamentoChart";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Summary {
  total_renda: number;
  total_gastos: number;
  saldo: number;
  parcelas_pendentes: { count: number; total: number };
}

interface RendaVsGastos {
  mes: string;
  total_renda: number;
  total_gastos: number;
}

interface GastoCategoria {
  categoria_id?: number;
  nome: string;
  cor: string;
  icone?: string;
  quantidade: number;
  total: number;
}

interface GastoFormaPagamento {
  forma_pagamento: string;
  quantidade: number;
  total: number;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getMesAtual() {
  return format(new Date(), "yyyy-MM");
}

function navegarMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return format(d, "yyyy-MM");
}

export default function DashboardPage() {
  const [mes, setMes] = useState(getMesAtual());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rendaVsGastos, setRendaVsGastos] = useState<RendaVsGastos[]>([]);
  const [porCategoria, setPorCategoria] = useState<GastoCategoria[]>([]);
  const [porFormaPgto, setPorFormaPgto] = useState<GastoFormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async (mesSelecionado: string) => {
    setLoading(true);
    try {
      const [sumRes, rvgRes, catRes, fmRes] = await Promise.all([
        api.get<Summary>(`/dashboard/summary?mes=${mesSelecionado}`),
        api.get<RendaVsGastos[]>("/dashboard/renda-vs-gastos?meses=6"),
        api.get<GastoCategoria[]>(
          `/dashboard/gastos-por-categoria?mes=${mesSelecionado}`,
        ),
        api.get<GastoFormaPagamento[]>(
          `/dashboard/gastos-por-forma-pagamento?mes=${mesSelecionado}`,
        ),
      ]);
      setSummary(sumRes.data);
      setRendaVsGastos(rvgRes.data);
      setPorCategoria(catRes.data);
      setPorFormaPgto(fmRes.data);
    } catch {
      // 401 é redirecionado pelo interceptor do axios
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(mes);
  }, [mes, fetchAll]);

  const mesDisplay = (() => {
    try {
      return format(new Date(mes + "-02"), "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return mes;
    }
  })();

  const saldoPositivo = (summary?.saldo ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header com seletor de mês */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize">
            {mesDisplay}
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral financeira
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMes((m) => navegarMes(m, -1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="bg-transparent text-sm text-foreground outline-none"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMes((m) => navegarMes(m, 1))}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : summary ? (
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Renda total
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatBRL(summary.total_renda)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gastos total
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatBRL(summary.total_gastos)}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${saldoPositivo ? "border-l-primary" : "border-l-destructive"}`}
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo
                </CardTitle>
                <Wallet
                  className={`h-4 w-4 ${saldoPositivo ? "text-primary" : "text-destructive"}`}
                />
              </CardHeader>
              <CardContent>
                <p
                  className={`text-2xl font-bold ${saldoPositivo ? "text-primary" : "text-destructive"}`}
                >
                  {formatBRL(summary.saldo)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Parcelas pendentes
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {formatBRL(summary.parcelas_pendentes.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.parcelas_pendentes.count} parcela(s)
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Gráfico Renda vs Gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Renda × Gastos — últimos 6 meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full rounded-lg" />
          ) : (
            <RendaVsGastosChart data={rendaVsGastos} />
          )}
        </CardContent>
      </Card>

      {/* Gastos por Categoria e Forma de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Gastos por categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <GastosCategoriaChart data={porCategoria} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Gastos por forma de pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <FormaPagamentoChart data={porFormaPgto} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhamento por categoria */}
      {!loading && porCategoria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Detalhamento por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Qtd
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      % do gasto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {porCategoria.map((c, i) => {
                    const totalGeral = porCategoria.reduce(
                      (s, x) => s + Number(x.total),
                      0,
                    );
                    const pct =
                      totalGeral > 0 ? (Number(c.total) / totalGeral) * 100 : 0;
                    return (
                      <tr
                        key={i}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: c.cor || "#94a3b8" }}
                            />
                            <span className="text-foreground">
                              {c.icone} {c.nome}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right text-muted-foreground">
                          {c.quantidade}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium text-foreground">
                          {formatBRL(Number(c.total))}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Badge variant="secondary" className="font-mono">
                            {pct.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="opacity-50" />
      <p className="text-xs text-muted-foreground text-center pb-2">
        FinançasPro &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
