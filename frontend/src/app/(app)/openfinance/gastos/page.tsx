"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat, CreditCard, Wallet, Info, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { SyncButton } from "@/components/openfinance/SyncButton";
import {
  MonthNavigator,
  rotuloMes,
} from "@/components/openfinance/MonthNavigator";
import {
  brl,
  dataBr,
  mesBr,
  ofApi,
  type OfCompetencia,
  type OfGasto,
  type OfGastoProjetado,
  type Paginacao,
} from "@/lib/openfinance";

/** Mês corrente como 'YYYY-MM-01', sem passar por fuso. */
const mesCorrente = (): string => {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function OpenFinanceGastosPage() {
  const [competencias, setCompetencias] = useState<OfCompetencia[]>([]);
  const [competencia, setCompetencia] = useState<string>(mesCorrente());
  const [page, setPage] = useState(1);

  const [itens, setItens] = useState<OfGasto[]>([]);
  const [projetados, setProjetados] = useState<OfGastoProjetado[]>([]);
  const [totais, setTotais] = useState({
    soma: 0,
    encargos: 0,
    cartao: 0,
    conta: 0,
    projetada: 0,
  });
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    ofApi.competencias().then(setCompetencias).catch(() => {});
  }, []);

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      const r = await ofApi.gastos({ page, limit: 50, competencia });
      setItens(r.data);
      setProjetados(r.projetados);
      setTotais({
        soma: r.soma,
        encargos: r.soma_encargos,
        cartao: r.soma_cartao,
        conta: r.soma_conta,
        projetada: r.soma_projetada,
      });
      setPaginacao(r.pagination);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, [page, competencia]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const comDado = competencias
    .filter((c) => c.lancamentos > 0)
    .map((c) => c.competencia);
  const soProjecao = competencias
    .filter((c) => c.lancamentos === 0 && c.lancamentos_projetados > 0)
    .map((c) => c.competencia);

  const vazio = itens.length === 0 && projetados.length === 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gastos Open Finance"
        description="Agrupados pela competência da fatura, não pela data da compra"
        titleColor="text-rose-100"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthNavigator
              value={competencia}
              onChange={(c) => {
                setCompetencia(c);
                setPage(1);
              }}
              disponiveis={comDado}
              projetados={soProjecao}
            />
            <SyncButton onDone={carregar} />
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-5 p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Cartão (= fatura)
            </p>
            <p className="font-display text-2xl ds-numeric leading-none text-rose-300">
              {brl(totais.cartao)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Conta
            </p>
            <p className="font-display text-2xl ds-numeric leading-none text-amber-300">
              {brl(totais.conta)}
            </p>
          </div>
          {totais.encargos > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                Encargos
              </p>
              <p className="font-display text-2xl ds-numeric leading-none text-white/60">
                {brl(totais.encargos)}
              </p>
            </div>
          )}
          {totais.projetada > 0 && (
            <div>
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-300/70">
                <Layers className="h-3 w-3" />
                Parcelas a cair
              </p>
              <p className="font-display text-2xl ds-numeric leading-none text-blue-300">
                {brl(totais.projetada)}
              </p>
            </div>
          )}
          <div className="border-l border-white/10 pl-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              {totais.projetada > 0 ? "Total previsto" : "Total do mês"}
            </p>
            <p className="font-display text-3xl ds-numeric leading-none text-white">
              {brl(totais.soma + totais.projetada)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="flex items-start gap-2.5 p-3 text-xs text-white/50">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
          <p>
            Uma compra de 28/08 que caiu na fatura de setembro aparece em
            setembro. Navegue para os meses à frente para ver as parcelas que
            ainda vão cair — elas são projeção, calculadas a partir da última
            parcela que o banco lançou.
          </p>
        </CardContent>
      </Card>

      {estado === "loading" ? (
        <PageDataState mode="loading" />
      ) : estado === "error" ? (
        <PageDataState mode="error" onAction={carregar} />
      ) : vazio ? (
        <PageDataState
          mode="empty"
          title={`Nada em ${rotuloMes(competencia, true)}`}
          description="Escolha outro mês ou sincronize para importar."
        />
      ) : (
        <div className="space-y-2">
          {projetados.length > 0 && (
            <>
              <h2 className="pt-1 text-sm font-bold uppercase tracking-[0.12em] text-blue-300/70">
                Parcelas a cair ({projetados.length})
              </h2>
              {projetados.map((p) => (
                <Card
                  key={`${p.descricao}-${p.numero_parcela}`}
                  className="border-dashed border-blue-300/25 bg-blue-500/[0.04]"
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                      style={{
                        backgroundColor: `${p.categoria_cor ?? "#60A5FA"}26`,
                      }}
                    >
                      {p.categoria_icone ?? "🧾"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white/90">
                        {p.descricao}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
                        <span>comprado em {dataBr(p.purchase_date)}</span>
                        <span>·</span>
                        <span style={{ color: p.categoria_cor ?? undefined }}>
                          {p.categoria_nome ?? "Sem categoria"}
                        </span>
                        {(p.cartao_apelido ?? p.cartao_nome) && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {p.cartao_apelido ?? p.cartao_nome}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <Badge className="shrink-0 border-blue-300/30 bg-blue-500/15 text-[10px] text-blue-200">
                      {p.numero_parcela}/{p.total_parcelas} · projeção
                    </Badge>
                    <span className="shrink-0 font-display text-xl ds-numeric text-blue-300">
                      {brl(p.valor)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {itens.length > 0 && projetados.length > 0 && (
            <h2 className="pt-3 text-sm font-bold uppercase tracking-[0.12em] text-white/40">
              Já lançados ({paginacao?.total ?? itens.length})
            </h2>
          )}

          {itens.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{
                    backgroundColor: `${g.categoria_cor ?? "#94A3B8"}26`,
                  }}
                >
                  {g.categoria_icone ?? "💸"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">
                    {g.descricao}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
                    <span>comprado em {dataBr(g.data_gasto)}</span>
                    <span>·</span>
                    <span style={{ color: g.categoria_cor ?? undefined }}>
                      {g.categoria_nome ?? "Sem categoria"}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      {g.cartao_apelido ?? g.cartao_nome ? (
                        <>
                          <CreditCard className="h-3 w-3" />
                          {g.cartao_apelido ?? g.cartao_nome}
                        </>
                      ) : (
                        <>
                          <Wallet className="h-3 w-3" />
                          conta
                        </>
                      )}
                    </span>
                  </p>
                </div>
                {g.total_parcelas && g.total_parcelas > 1 && (
                  <Badge className="shrink-0 border-blue-300/25 bg-blue-500/10 text-[10px] text-blue-200">
                    {g.numero_parcela}/{g.total_parcelas}
                  </Badge>
                )}
                {g.encargo && (
                  <Badge className="hidden shrink-0 border-amber-300/25 bg-amber-500/10 text-[10px] text-amber-200 sm:flex">
                    encargo
                  </Badge>
                )}
                {g.assinatura_nome && (
                  <Badge className="hidden shrink-0 border-violet-300/30 bg-violet-500/15 text-[10px] text-violet-200 sm:flex">
                    <Repeat className="mr-1 h-3 w-3" />
                    {g.assinatura_nome}
                  </Badge>
                )}
                <span className="shrink-0 font-display text-xl ds-numeric text-rose-300">
                  {brl(g.valor)}
                </span>
              </CardContent>
            </Card>
          ))}

          {paginacao && paginacao.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-white/50">
                Página {paginacao.page} de {paginacao.totalPages} ·{" "}
                {paginacao.total} gastos em {mesBr(competencia)}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={page >= paginacao.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
