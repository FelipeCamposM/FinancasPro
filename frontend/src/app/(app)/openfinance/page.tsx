"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Repeat,
  Inbox,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { Badge } from "@/components/ui/badge";
import { SyncButton } from "@/components/openfinance/SyncButton";
import { ParcelamentosCard } from "@/components/openfinance/ParcelamentosCard";
import {
  brl,
  mesBr,
  ofApi,
  type OfDashboard,
  type OfParcelamentos,
} from "@/lib/openfinance";

export default function OpenFinanceDashboardPage() {
  const [dados, setDados] = useState<OfDashboard | null>(null);
  const [parcelamentos, setParcelamentos] = useState<OfParcelamentos | null>(
    null,
  );
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      const [d, p] = await Promise.all([
        ofApi.dashboard(),
        ofApi.parcelamentos(),
      ]);
      setDados(d);
      setParcelamentos(p);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (estado === "loading") return <PageDataState mode="loading" />;
  if (estado === "error" || !dados)
    return <PageDataState mode="error" onAction={carregar} />;

  const serie = dados.serie_mensal.map((s) => ({
    mes: mesBr(s.mes),
    Entradas: Number(s.entradas),
    Saídas: Number(s.saidas),
  }));

  const categorias = dados.por_categoria.map((c) => ({
    nome: c.categoria,
    valor: Number(c.total),
    cor: c.cor,
  }));

  const semDados =
    dados.contas.length === 0 && dados.cartoes.length === 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Open Finance"
        description="Dados vindos direto do banco via Pluggy"
        actions={<SyncButton onDone={carregar} />}
      />

      {semDados ? (
        <PageDataState
          mode="empty"
          title="Nenhuma conta importada"
          description="Cadastre uma conexão na aba Conexões e clique em Sincronizar agora."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Saldo em conta"
              value={brl(dados.saldo_total)}
              icon={<Wallet className="h-5 w-5" />}
              tone="green"
              description={`${dados.contas.length} conta(s)`}
            />
            <StatCard
              label="Fatura aberta"
              value={brl(dados.fatura_total)}
              icon={<CreditCard className="h-5 w-5" />}
              tone="rose"
              description={
                dados.encargos_total > 0
                  ? `${dados.cartoes.length} cartão(ões) · + ${brl(dados.encargos_total)} em encargos`
                  : `${dados.cartoes.length} cartão(ões)`
              }
            />
            <StatCard
              label="Gastos do mês"
              value={brl(dados.gastos_mes)}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Renda do mês"
              value={brl(dados.renda_mes)}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="blue"
              description="Somente entradas classificadas"
            />
          </div>

          {dados.a_classificar > 0 && (
            <Link href="/openfinance/extrato?destino=a_classificar">
              <Card className="border-amber-300/25 bg-amber-500/[0.07] transition-colors hover:bg-amber-500/[0.12]">
                <CardContent className="flex items-center gap-3 p-4">
                  <Inbox className="h-5 w-5 shrink-0 text-amber-300" />
                  <p className="text-sm text-amber-100">
                    <strong>{dados.a_classificar}</strong> entrada(s) aguardando
                    classificação — elas não entram na renda até você decidir.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {parcelamentos && <ParcelamentosCard dados={parcelamentos} />}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entradas x saídas</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <XAxis
                      dataKey="mes"
                      stroke="rgba(255,255,255,0.45)"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.45)"
                      fontSize={12}
                      tickFormatter={(v) => brl(v).replace("R$", "").trim()}
                    />
                    <Tooltip
                      formatter={(v: number) => brl(v)}
                      contentStyle={{
                        background: "rgba(15,17,26,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saídas" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Gasto do mês por categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {categorias.length === 0 ? (
                  <PageDataState
                    mode="empty"
                    title="Sem gastos neste mês"
                    description="Sincronize para trazer os lançamentos."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorias}
                        dataKey="valor"
                        nameKey="nome"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {categorias.map((c) => (
                          <Cell key={c.nome} fill={c.cor} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => brl(v)}
                        contentStyle={{
                          background: "rgba(15,17,26,0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Assinaturas</CardTitle>
              <Link
                href="/openfinance/assinaturas"
                className="text-sm text-emerald-300 hover:underline"
              >
                Ver todas
              </Link>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-violet-500/15 p-3">
                  <Repeat className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <p className="font-display text-3xl ds-numeric leading-none text-violet-300">
                    {brl(dados.assinaturas.total_mensal)}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {dados.assinaturas.confirmadas} confirmada(s) — previsão do
                    próximo mês
                  </p>
                </div>
              </div>
              {dados.assinaturas.sugestoes > 0 && (
                <Badge className="border-amber-300/30 bg-amber-500/15 text-amber-200">
                  {dados.assinaturas.sugestoes} sugestão(ões) aguardando
                </Badge>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
