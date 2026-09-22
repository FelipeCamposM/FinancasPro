"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { SyncButton } from "@/components/openfinance/SyncButton";
import {
  brl,
  dataBr,
  ofApi,
  type OfRenda,
  type Paginacao,
} from "@/lib/openfinance";

export default function OpenFinanceRendaPage() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [page, setPage] = useState(1);

  const [itens, setItens] = useState<OfRenda[]>([]);
  const [soma, setSoma] = useState(0);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [aClassificar, setAClassificar] = useState(0);
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      const [r, pendentes] = await Promise.all([
        ofApi.renda({
          page,
          limit: 50,
          de: de || undefined,
          ate: ate || undefined,
        }),
        ofApi.transacoes({ page: 1, limit: 1, destino: "a_classificar" }),
      ]);
      setItens(r.data);
      setSoma(r.soma);
      setPaginacao(r.pagination);
      setAClassificar(pendentes.pagination.total);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, [page, de, ate]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Renda Open Finance"
        description="Entradas que você classificou como renda"
        titleColor="text-blue-100"
        actions={<SyncButton onDone={carregar} />}
      />

      {aClassificar > 0 && (
        <Link href="/openfinance/extrato?destino=a_classificar">
          <Card className="border-amber-300/25 bg-amber-500/[0.07] transition-colors hover:bg-amber-500/[0.12]">
            <CardContent className="flex items-center gap-3 p-4">
              <Inbox className="h-5 w-5 shrink-0 text-amber-300" />
              <p className="text-sm text-amber-100">
                <strong>{aClassificar}</strong> entrada(s) aguardando
                classificação. Entrada só vira renda depois que você confirma.
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <label className="text-xs text-white/50">
            De
            <Input
              type="date"
              value={de}
              onChange={(e) => {
                setDe(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-[170px]"
            />
          </label>
          <label className="text-xs text-white/50">
            Até
            <Input
              type="date"
              value={ate}
              onChange={(e) => {
                setAte(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-[170px]"
            />
          </label>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              Total do período
            </p>
            <p className="font-display text-3xl ds-numeric leading-none text-emerald-300">
              {brl(soma)}
            </p>
          </div>
        </CardContent>
      </Card>

      {estado === "loading" ? (
        <PageDataState mode="loading" />
      ) : estado === "error" ? (
        <PageDataState mode="error" onAction={carregar} />
      ) : itens.length === 0 ? (
        <PageDataState
          mode="empty"
          title="Nenhuma renda registrada"
          description="Abra o Extrato e marque as entradas que são renda."
        />
      ) : (
        <div className="space-y-2">
          {itens.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">
                    {r.descricao}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
                    <span>{dataBr(r.data_renda)}</span>
                    {r.categoria_nome && (
                      <>
                        <span>·</span>
                        <span style={{ color: r.categoria_cor ?? undefined }}>
                          {r.categoria_nome}
                        </span>
                      </>
                    )}
                    {(r.conta_apelido ?? r.conta_nome) && (
                      <>
                        <span>·</span>
                        <span>{r.conta_apelido ?? r.conta_nome}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className="shrink-0 font-display text-xl ds-numeric text-emerald-300">
                  {brl(r.valor)}
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
                Página {paginacao.page} de {paginacao.totalPages}
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
