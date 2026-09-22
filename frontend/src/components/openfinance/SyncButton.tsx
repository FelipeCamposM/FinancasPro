"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ofApi } from "@/lib/openfinance";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  onDone?: () => void;
  className?: string;
}

export function SyncButton({ onDone, className }: SyncButtonProps) {
  const [rodando, setRodando] = useState(false);

  async function sincronizar() {
    setRodando(true);
    // A carga inicial puxa todo o histórico e pode demorar, então o toast de
    // progresso fica até a resposta chegar.
    const id = toast.loading("Sincronizando com o banco…");
    try {
      const r = await ofApi.sync();
      toast.success(
        `${r.transacoes_novas} novas, ${r.transacoes_atualizadas} atualizadas`,
        {
          id,
          description:
            r.assinaturas_sugeridas > 0
              ? `${r.assinaturas_sugeridas} assinatura(s) sugerida(s)`
              : undefined,
        },
      );
      onDone?.();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Falha ao sincronizar";
      toast.error(msg, { id });
    } finally {
      setRodando(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={sincronizar}
      disabled={rodando}
      className={cn(
        "border-emerald-300/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
        className,
      )}
      variant="outline"
    >
      <RefreshCw className={cn("h-4 w-4", rodando && "animate-spin")} />
      {rodando ? "Sincronizando…" : "Sincronizar agora"}
    </Button>
  );
}
