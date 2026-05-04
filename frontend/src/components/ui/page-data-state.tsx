import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageDataStateMode = "loading" | "empty" | "error";

interface PageDataStateProps {
  mode: PageDataStateMode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function PageDataState({
  mode,
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  className,
}: PageDataStateProps) {
  const ResolvedIcon = Icon ?? (mode === "error" ? AlertTriangle : Loader2);

  return (
    <div
      className={cn(
        "ui-glass-surface flex min-h-[240px] w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className,
      )}
      role={mode === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={cn(
          "rounded-full p-4",
          mode === "error" ? "bg-rose-500/15" : "bg-white/10",
        )}
      >
        <ResolvedIcon
          className={cn(
            "h-6 w-6",
            mode === "loading" && "animate-spin",
            mode === "error" ? "text-rose-300" : "text-white/70",
          )}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/90">
          {title ??
            (mode === "loading"
              ? "Carregando dados"
              : mode === "error"
                ? "Falha ao carregar dados"
                : "Nenhum resultado encontrado")}
        </p>
        <p className="max-w-lg text-sm text-white/55">
          {description ??
            (mode === "loading"
              ? "Estamos buscando as informações da página."
              : mode === "error"
                ? "Tente novamente em instantes."
                : "Ajuste os filtros ou cadastre um novo item para começar.")}
        </p>
      </div>

      {mode === "error" && onAction && (
        <Button
          type="button"
          variant="outline"
          onClick={onAction}
          className="mt-1 border-rose-300/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
        >
          {actionLabel ?? "Tentar novamente"}
        </Button>
      )}
    </div>
  );
}
