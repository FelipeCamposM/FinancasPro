"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { SyncButton } from "@/components/openfinance/SyncButton";
import { dataBr, ofApi, type OfConexao } from "@/lib/openfinance";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ConexoesPage() {
  const [conexoes, setConexoes] = useState<OfConexao[]>([]);
  const [itemId, setItemId] = useState("");
  const [apelido, setApelido] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      setConexoes(await ofApi.conexoes());
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const id = itemId.trim();
    if (!UUID_RE.test(id)) {
      toast.error("O itemId precisa ser um UUID");
      return;
    }
    setSalvando(true);
    try {
      await ofApi.criarConexao(id, apelido.trim() || undefined);
      toast.success("Conexão cadastrada", {
        description: "Clique em Sincronizar agora para importar os dados.",
      });
      setItemId("");
      setApelido("");
      await carregar();
    } catch {
      toast.error("Não foi possível cadastrar");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    try {
      await ofApi.removerConexao(id);
      toast.success("Conexão removida");
      await carregar();
    } catch {
      toast.error("Não foi possível remover");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Conexões"
        description="Cada conexão do Meu Pluggy tem um itemId. Cole aqui o que aparece no dashboard da Pluggy."
        actions={<SyncButton onDone={carregar} />}
      />

      <Card className="border-white/10 bg-white/[0.03]">
        <CardContent className="space-y-2 p-4 text-sm text-white/60">
          <p>
            O endpoint que lista conexões automaticamente está desabilitado na
            conta pela Pluggy, então o itemId é copiado à mão — uma vez por
            conexão.
          </p>
          <a
            href="https://dashboard.pluggy.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-300 hover:underline"
          >
            Abrir dashboard da Pluggy
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionar} className="flex flex-wrap items-end gap-3">
            <label className="min-w-[320px] flex-1 text-xs text-white/50">
              itemId
              <Input
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                placeholder="bb2b6e16-ea93-4303-94aa-68688383bbd1"
                className="mt-1 font-mono text-sm"
              />
            </label>
            <label className="text-xs text-white/50">
              Apelido (opcional)
              <Input
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Santander"
                maxLength={100}
                className="mt-1 w-[200px]"
              />
            </label>
            <Button type="submit" disabled={salvando}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {estado === "loading" ? (
        <PageDataState mode="loading" />
      ) : estado === "error" ? (
        <PageDataState mode="error" onAction={carregar} />
      ) : conexoes.length === 0 ? (
        <PageDataState
          mode="empty"
          title="Nenhuma conexão cadastrada"
          description="Cole um itemId acima para começar."
          icon={Link2}
        />
      ) : (
        <div className="space-y-2">
          {conexoes.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Link2 className="h-5 w-5 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">
                    {c.apelido ?? "Conexão Meu Pluggy"}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-white/40">
                    {c.item_id}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-white/45">
                  {c.last_sync_at
                    ? `sincronizado em ${dataBr(c.last_sync_at)}`
                    : "nunca sincronizado"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => remover(c.id)}
                  className="h-8 px-2.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
