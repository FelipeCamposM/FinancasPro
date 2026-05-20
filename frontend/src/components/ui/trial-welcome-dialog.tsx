"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  { label: "Gastos e renda",          free: true  },
  { label: "Categorias",              free: true  },
  { label: "Dashboard básico",        free: true  },
  { label: "Cartões ilimitados",      free: false },
  { label: "Relatórios mensais",      free: false },
  { label: "Dashboard avançado",      free: false },
  { label: "Cofrinhos e metas",       free: false },
  { label: "Suporte prioritário",     free: false },
];

function daysLeft(createdAt: string) {
  const diff = 7 * 86_400_000 - (Date.now() - new Date(createdAt).getTime());
  return Math.min(7, Math.max(0, Math.ceil(diff / 86_400_000)));
}

export function TrialWelcomeDialog() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (user.user_level !== "free") return;
    setOpen(true);
  }, [user, loading]);

  function dismiss() {
    setOpen(false);
  }

  function goSubscribe() {
    dismiss();
    router.push("/assinatura");
  }

  if (!user || user.user_level !== "free") return null;

  const days       = daysLeft(user.created_at);
  const pctUsed    = Math.round(((7 - days) / 7) * 100);
  const isExpiring = days <= 2;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className={cn(
          "px-6 py-6 text-white",
          isExpiring
            ? "bg-gradient-to-br from-rose-600 to-orange-500"
            : "bg-gradient-to-br from-blue-600 to-sky-500",
        )}>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/70 font-medium">Valora Finanças</p>
              <p className="text-sm font-bold">Plano Gratuito</p>
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-2xl bg-white/15 px-5 py-4 text-center">
            {days > 0 ? (
              <>
                <p className="text-5xl font-black leading-none">{days}</p>
                <p className="text-base font-semibold text-white/90 mt-1">
                  dia{days !== 1 ? "s" : ""} restante{days !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-white/65 mt-0.5">do período de avaliação gratuita</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-black leading-none">Período encerrado</p>
                <p className="text-xs text-white/70 mt-1">Assine para continuar usando todos os recursos</p>
              </>
            )}
          </div>

          {/* Progress bar */}
          {days > 0 && (
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-white/20">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isExpiring ? "bg-orange-200" : "bg-white",
                  )}
                  style={{ width: `${Math.max(4, pctUsed)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/50 mt-1">
                <span>Dia 1</span>
                <span>Dia 7</span>
              </div>
            </div>
          )}
        </div>

        {/* Feature comparison */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            O que está disponível
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {FREE_FEATURES.map(({ label, free }) => (
              <div key={label} className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2",
                free ? "bg-muted/30" : "opacity-50",
              )}>
                {free ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm text-foreground">{label}</span>
                {!free && (
                  <span className="ml-auto text-[10px] font-semibold text-blue-500">Premium</span>
                )}
              </div>
            ))}
          </div>

          {/* Trial CTA */}
          <div className="space-y-2 pt-1">
            <Button className="w-full h-11 text-sm font-bold" onClick={goSubscribe}>
              <Crown className="mr-2 h-4 w-4" />
              Assinar com 7 dias grátis
            </Button>
            <button
              onClick={dismiss}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Continuar no plano gratuito
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
