"use client";

import { useCallback, useEffect, useState } from "react";
import { Repeat, Check, X, CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { SyncButton } from "@/components/openfinance/SyncButton";
import {
  brl,
  dataBr,
  ofApi,
  type OfAssinatura,
  type OfPrevisaoItem,
} from "@/lib/openfinance";

export default function OpenFinanceAssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<OfAssinatura[]>([]);
  const [previsao, setPrevisao] = useState<{
    itens: OfPrevisaoItem[];
    total: number;
  } | null>(null);
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");
  const [salvando, setSalvando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      const [a, p] = await Promise.all([ofApi.assinaturas(), ofApi.previsao()]);
      setAssinaturas(a);
      setPrevisao(p);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(
    id: string,
    status: "confirmada" | "ignorada",
  ) {
    setSalvando(id);
    try {
      await ofApi.atualizarAssinatura(id, { status });
      toast.success(
        status === "confirmada" ? "Assinatura confirmada" : "Sugestão ignorada",
      );
      await carregar();
    } catch {
      toast.error("Não foi possível salvar");
    } finally {
      setSalvando(null);
    }
  }

  async function remover(id: string) {
    setSalvando(id);
    try {
      await ofApi.removerAssinatura(id);
      toast.success("Assinatura removida");
      await carregar();
    } catch {
      toast.error("Não foi possível remover");
    } finally {
      setSalvando(null);
    }
  }

  if (estado === "loading") return <PageDataState mode="loading" />;
  if (estado === "error")
    return <PageDataState mode="error" onAction={carregar} />;

  const sugeridas = assinaturas.filter((a) => a.status === "sugerida");
  const confirmadas = assinaturas.filter((a) => a.status === "confirmada");
  const ignoradas = assinaturas.filter((a) => a.status === "ignorada");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assinaturas"
        description="Cobranças que se repetem no cartão. Sugestões aparecem depois de 3 meses com valor parecido."
        titleColor="text-violet-100"
        actions={<SyncButton onDone={carregar} />}
      />

      {previsao && previsao.itens.length > 0 && (
        <Card className="border-violet-300/20 bg-violet-500/[0.06]">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-violet-300" />
              Previsão do próximo mês
            </CardTitle>
            <span className="font-display text-2xl ds-numeric text-violet-300">
              {brl(previsao.total)}
            </span>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {previsao.itens.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-white/80">{i.nome}</span>
                <span className="shrink-0 text-xs text-white/45">
                  {dataBr(i.data_prevista)}
                </span>
                <span className="shrink-0 ds-numeric text-white/90">
                  {brl(i.valor_previsto)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {sugeridas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-amber-300/70">
            Sugestões ({sugeridas.length})
          </h2>
          {sugeridas.map((a) => (
            <Card key={a.id} className="border-amber-300/20 bg-amber-500/[0.05]">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">{a.nome}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {a.ocorrencias} meses · média {brl(a.valor_medio)} · último{" "}
                    {brl(a.valor_ultimo ?? a.valor_medio)} · dia{" "}
                    {a.dia_cobranca ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={salvando === a.id}
                    onClick={() => mudarStatus(a.id, "confirmada")}
                  >
                    <Check className="h-4 w-4" />
                    Virar assinatura
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={salvando === a.id}
                    onClick={() => mudarStatus(a.id, "ignorada")}
                  >
                    <X className="h-4 w-4" />
                    Ignorar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white/40">
          Confirmadas ({confirmadas.length})
        </h2>
        {confirmadas.length === 0 ? (
          <PageDataState
            mode="empty"
            title="Nenhuma assinatura confirmada"
            description="Confirme uma sugestão para ela entrar na previsão do próximo mês."
          />
        ) : (
          confirmadas.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                  <Repeat className="h-5 w-5 text-violet-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">{a.nome}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-white/45">
                    <span>dia {a.dia_cobranca ?? "—"}</span>
                    {a.categoria_nome && (
                      <>
                        <span>·</span>
                        <span style={{ color: a.categoria_cor ?? undefined }}>
                          {a.categoria_nome}
                        </span>
                      </>
                    )}
                    {(a.cartao_apelido ?? a.cartao_nome) && (
                      <>
                        <span>·</span>
                        <span>{a.cartao_apelido ?? a.cartao_nome}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>última em {dataBr(a.ultima_cobranca)}</span>
                  </p>
                </div>
                <span className="shrink-0 font-display text-xl ds-numeric text-violet-300">
                  {brl(a.valor_ultimo ?? a.valor_medio)}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={salvando === a.id}
                  onClick={() => mudarStatus(a.id, "ignorada")}
                  className="h-8 px-2.5 text-xs"
                >
                  Desfazer
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {ignoradas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white/30">
            Ignoradas ({ignoradas.length})
          </h2>
          <p className="text-xs text-white/40">
            Ficam guardadas para não voltarem como sugestão a cada sync.
          </p>
          {ignoradas.map((a) => (
            <Card key={a.id} className="opacity-60">
              <CardContent className="flex flex-wrap items-center gap-3 p-3">
                <span className="min-w-0 flex-1 truncate text-sm text-white/70">
                  {a.nome}
                </span>
                <Badge className="border-white/15 bg-white/[0.06] text-[10px] text-white/50">
                  {brl(a.valor_medio)}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={salvando === a.id}
                  onClick={() => mudarStatus(a.id, "confirmada")}
                  className="h-8 px-2.5 text-xs"
                >
                  Reativar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={salvando === a.id}
                  onClick={() => remover(a.id)}
                  className="h-8 px-2.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
