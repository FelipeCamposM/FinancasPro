"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Store } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { brl, dataBr, mesBr, ofApi, type OfRelatorios } from "@/lib/openfinance";

const tooltipStyle = {
  background: "rgba(15,17,26,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
};

export default function OpenFinanceRelatoriosPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [dados, setDados] = useState<OfRelatorios | null>(null);
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");
  const [baixando, setBaixando] = useState(false);

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      setDados(await ofApi.relatorios({ de: de || undefined, ate: ate || undefined }));
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, [de, ate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Recharts precisa de uma linha por mês com as categorias como colunas.
  const { serieCategorias, categorias } = useMemo(() => {
    if (!dados) return { serieCategorias: [], categorias: [] };

    const nomes = Array.from(
      new Set(dados.por_mes_categoria.map((r) => r.categoria)),
    );
    const cores = new Map(
      dados.por_mes_categoria.map((r) => [r.categoria, r.cor]),
    );
    const porMes = new Map<string, Record<string, number | string>>();

    for (const r of dados.por_mes_categoria) {
      const chave = mesBr(r.mes);
      if (!porMes.has(chave)) porMes.set(chave, { mes: chave });
      porMes.get(chave)![r.categoria] = Number(r.total);
    }

    return {
      serieCategorias: Array.from(porMes.values()),
      categorias: nomes.map((n) => ({ nome: n, cor: cores.get(n) ?? "#94A3B8" })),
    };
  }, [dados]);

  const fluxo = useMemo(
    () =>
      (dados?.fluxo_caixa ?? []).map((f) => ({
        mes: mesBr(f.mes),
        Entradas: Number(f.entradas),
        Saídas: Number(f.saidas),
        Acumulado: Number(f.acumulado),
      })),
    [dados],
  );

  /**
   * O CSV vem por rota autenticada, então não dá para usar um <a href> puro:
   * o navegador não manda o Bearer. Baixa via axios e materializa um blob.
   */
  async function baixarCsv() {
    setBaixando(true);
    try {
      const resp = await api.get("/openfinance/relatorios/csv", {
        params: { de: de || undefined, ate: ate || undefined },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `openfinance-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Falha ao exportar");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Relatórios Open Finance"
        description="Somente dados importados do banco"
        titleColor="text-amber-100"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={baixarCsv}
            disabled={baixando}
          >
            <Download className="h-4 w-4" />
            {baixando ? "Gerando…" : "Exportar CSV"}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <label className="text-xs text-white/50">
            De
            <Input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="mt-1 w-[170px]"
            />
          </label>
          <label className="text-xs text-white/50">
            Até
            <Input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="mt-1 w-[170px]"
            />
          </label>
        </CardContent>
      </Card>

      {estado === "loading" ? (
        <PageDataState mode="loading" />
      ) : estado === "error" || !dados ? (
        <PageDataState mode="error" onAction={carregar} />
      ) : fluxo.length === 0 ? (
        <PageDataState
          mode="empty"
          title="Sem dados no período"
          description="Amplie o intervalo ou sincronize para importar lançamentos."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Fluxo de caixa (entrada x saída)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fluxo}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.45)" fontSize={12} />
                  <YAxis
                    stroke="rgba(255,255,255,0.45)"
                    fontSize={12}
                    tickFormatter={(v) => brl(v).replace("R$", "").trim()}
                  />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="Entradas" stroke="#34d399" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Saídas" stroke="#fb7185" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Acumulado" stroke="#60a5fa" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mês a mês por categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieCategorias}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.45)" fontSize={12} />
                  <YAxis
                    stroke="rgba(255,255,255,0.45)"
                    fontSize={12}
                    tickFormatter={(v) => brl(v).replace("R$", "").trim()}
                  />
                  <Tooltip formatter={(v: number) => brl(v)} contentStyle={tooltipStyle} />
                  <Legend />
                  {categorias.map((c) => (
                    <Bar key={c.nome} dataKey={c.nome} stackId="a" fill={c.cor} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="h-4 w-4 text-amber-300" />
                Onde você mais gasta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {dados.ranking_estabelecimentos.length === 0 ? (
                <PageDataState mode="empty" title="Sem dados para o ranking" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estabelecimento</TableHead>
                      <TableHead className="text-right">Vezes</TableHead>
                      <TableHead className="text-right">Última</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.ranking_estabelecimentos.map((r) => (
                      <TableRow key={r.estabelecimento}>
                        <TableCell className="max-w-[280px] truncate">
                          {r.estabelecimento}
                        </TableCell>
                        <TableCell className="text-right text-white/60">
                          {r.vezes}
                        </TableCell>
                        <TableCell className="text-right text-white/60">
                          {dataBr(r.ultima)}
                        </TableCell>
                        <TableCell className="text-right ds-numeric text-rose-300">
                          {brl(r.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
