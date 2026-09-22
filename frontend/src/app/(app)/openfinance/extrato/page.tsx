"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { SyncButton } from "@/components/openfinance/SyncButton";
import {
  brl,
  dataBr,
  ofApi,
  DESTINO_LABEL,
  type OfDestino,
  type OfTransacao,
  type Paginacao,
} from "@/lib/openfinance";
import { cn } from "@/lib/utils";

const DESTINOS: OfDestino[] = ["gasto", "renda", "ignorado", "a_classificar"];

const corDoDestino: Record<OfDestino, string> = {
  gasto: "border-rose-300/30 bg-rose-500/15 text-rose-200",
  renda: "border-emerald-300/30 bg-emerald-500/15 text-emerald-200",
  ignorado: "border-white/15 bg-white/[0.06] text-white/50",
  a_classificar: "border-amber-300/30 bg-amber-500/15 text-amber-200",
};

// "todos" porque o Select do Radix não aceita SelectItem com value="".
const TODOS = "todos";

export default function ExtratoPage() {
  const searchParams = useSearchParams();
  const [destino, setDestino] = useState<string>(
    searchParams.get("destino") ?? TODOS,
  );
  const [tipo, setTipo] = useState<string>(TODOS);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [page, setPage] = useState(1);

  const [itens, setItens] = useState<OfTransacao[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");
  const [salvando, setSalvando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      const r = await ofApi.transacoes({
        page,
        limit: 50,
        destino: destino === TODOS ? undefined : destino,
        tipo: tipo === TODOS ? undefined : tipo,
        busca: buscaAplicada || undefined,
      });
      setItens(r.data);
      setPaginacao(r.pagination);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, [page, destino, tipo, buscaAplicada]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mover(id: string, novo: OfDestino) {
    setSalvando(id);
    try {
      await ofApi.classificar([{ id, destino: novo }]);
      // Atualiza no lugar em vez de recarregar: com filtro ativo a linha sairia
      // da lista e o usuário perderia a referência do que acabou de mexer.
      setItens((atual) =>
        atual.map((t) => (t.id === id ? { ...t, destino: novo } : t)),
      );
      toast.success(`Movido para ${DESTINO_LABEL[novo]}`);
    } catch {
      toast.error("Não foi possível reclassificar");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Extrato"
        description="Tudo que veio do banco. Use os botões para mover entre gasto, renda e ignorado."
        actions={<SyncButton onDone={carregar} />}
      />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setBuscaAplicada(busca);
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar na descrição…"
                className="pl-9"
              />
            </form>
          </div>

          <Select
            value={destino}
            onValueChange={(v) => {
              setDestino(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os destinos</SelectItem>
              {DESTINOS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DESTINO_LABEL[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={tipo}
            onValueChange={(v) => {
              setTipo(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Entrada e saída</SelectItem>
              <SelectItem value="debito">Saída</SelectItem>
              <SelectItem value="credito">Entrada</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {estado === "loading" ? (
        <PageDataState mode="loading" />
      ) : estado === "error" ? (
        <PageDataState mode="error" onAction={carregar} />
      ) : itens.length === 0 ? (
        <PageDataState
          mode="empty"
          title="Nenhuma transação"
          description="Ajuste os filtros ou sincronize para trazer os lançamentos."
        />
      ) : (
        <div className="space-y-2">
          {itens.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    t.tipo === "credito"
                      ? "bg-emerald-500/15"
                      : "bg-rose-500/15",
                  )}
                >
                  {t.tipo === "credito" ? (
                    <ArrowUpRight className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-rose-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">
                    {t.descricao}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
                    <span>{dataBr(t.data)}</span>
                    <span>·</span>
                    <span>
                      {t.cartao_apelido ??
                        t.cartao_nome ??
                        t.conta_apelido ??
                        t.conta_nome}
                    </span>
                    {t.categoria_nome && (
                      <>
                        <span>·</span>
                        <span style={{ color: t.categoria_cor ?? undefined }}>
                          {t.categoria_nome}
                        </span>
                      </>
                    )}
                    {t.status === "pendente" && (
                      <Badge className="border-white/15 bg-white/[0.06] text-[10px] text-white/60">
                        pendente
                      </Badge>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "font-display text-xl ds-numeric",
                      t.tipo === "credito"
                        ? "text-emerald-300"
                        : "text-rose-300",
                    )}
                  >
                    {t.tipo === "credito" ? "+" : "−"} {brl(t.valor)}
                  </span>
                  <Badge className={cn("text-[10px]", corDoDestino[t.destino])}>
                    {DESTINO_LABEL[t.destino]}
                  </Badge>
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {DESTINOS.filter((d) => d !== "a_classificar").map((d) => (
                    <Button
                      key={d}
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={salvando === t.id || t.destino === d}
                      onClick={() => mover(t.id, d)}
                      className="h-8 px-2.5 text-xs"
                    >
                      {DESTINO_LABEL[d]}
                    </Button>
                  ))}
                </div>
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
                {paginacao.total} transações
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
