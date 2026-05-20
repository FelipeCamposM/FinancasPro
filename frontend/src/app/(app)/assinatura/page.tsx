"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Crown, CheckCircle2, Loader2, XCircle, Clock,
  ShieldCheck, RefreshCcw, CreditCard, Info, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubStatus {
  user_level: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  mp_subscription_id: string | null;
  subscription_plan: string | null;
  subscription_cancelled_at: string | null;
}

const FEATURES = [
  "Gastos, renda, cartões e assinaturas ilimitados",
  "Relatórios mensais completos",
  "Dashboard com gráficos avançados",
  "Cofrinhos e metas financeiras",
  "Suporte prioritário",
];

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

// ── Confirmation modal ────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  plan: "monthly" | "annual";
  hasUsedTrial: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmModal({ open, plan, hasUsedTrial, loading, onConfirm, onClose }: ConfirmModalProps) {
  const [agreed, setAgreed] = useState(false);
  useEffect(() => { if (open) setAgreed(false); }, [open]);

  const isAnnual = plan === "annual";
  const price    = isAnnual ? "R$94,90/ano" : "R$9,90/mês";
  const billing  = isAnnual ? "Cobrado anualmente. Equivale a R$7,91/mês." : "Cobrado mensalmente de forma automática.";

  const policies = [
    { icon: CreditCard,  text: hasUsedTrial ? "Cobrado imediatamente — trial já utilizado nesta conta." : "7 dias grátis antes da primeira cobrança." },
    { icon: ShieldCheck, text: "Não há reembolsos após o período de 7 dias grátis." },
    { icon: Clock,       text: "Ao cancelar, seu acesso é mantido até o fim do período pago." },
    { icon: RefreshCcw,  text: "Renovação automática. Você pode cancelar a qualquer momento." },
    { icon: Info,        text: "O período de 7 dias grátis é concedido apenas uma vez por conta." },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-sky-500 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              Confirmar assinatura
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-1">
              Revise as condições antes de prosseguir para o pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/15 px-4 py-3">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-white shrink-0" />
              <div>
                <p className="text-base font-bold text-white">Valora Premium {isAnnual ? "Anual" : "Mensal"}</p>
                <p className="text-xs text-white/70 mt-0.5">{billing}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white">{price}</p>
              {hasUsedTrial && <p className="text-[10px] text-white/60 mt-0.5">cobrado agora</p>}
            </div>
          </div>

          {!hasUsedTrial ? (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/20 border border-white/30 px-4 py-3">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-base font-black text-white leading-tight">7 dias completamente grátis</p>
                <p className="text-xs text-white/80 mt-0.5">Você só será cobrado após o período de trial. Cancele antes e não paga nada.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-500/30 border border-amber-400/40 px-4 py-3">
              <span className="text-xl">⚠️</span>
              <p className="text-sm font-semibold text-amber-200">Trial já utilizado — a cobrança inicia imediatamente após confirmar.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Condições de pagamento</p>
            <div className="space-y-2">
              {policies.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground leading-snug pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <label className={cn(
            "flex items-start gap-3 cursor-pointer rounded-xl border-2 px-4 py-3 transition-all",
            agreed ? "border-blue-500 bg-blue-500/10" : "border-border/60 bg-muted/20 hover:border-border",
          )}>
            <div className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
              agreed ? "border-blue-500 bg-blue-500" : "border-border bg-background",
            )}>
              {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </div>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
            <span className="text-sm text-foreground leading-relaxed font-medium">
              Li e aceito as condições de pagamento e a política de cancelamento da Valora.
            </span>
          </label>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Voltar</Button>
            <Button className="flex-1 h-11 text-base font-bold" onClick={onConfirm} disabled={!agreed || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Ir para pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Plan select cards (for non-subscribers) ───────────────────────────────────

interface PlanCardProps {
  plan: "monthly" | "annual";
  selected: boolean;
  hasUsedTrial: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, selected, hasUsedTrial, onSelect }: PlanCardProps) {
  const isAnnual = plan === "annual";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl border-2 p-6 text-left transition-all w-full overflow-hidden",
        selected ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10" : "border-border/60 hover:border-blue-500/40 bg-card",
      )}
    >
      {isAnnual && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-t-xl" />}

      {isAnnual && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5">
          <span className="text-sm font-black text-white tracking-tight">-20% OFF</span>
          <span className="text-[10px] text-emerald-100 font-medium">vs mensal</span>
        </div>
      )}

      {selected && (
        <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </span>
      )}

      <p className={cn(
        "text-sm font-bold uppercase tracking-widest mb-3",
        selected ? "text-blue-500" : "text-muted-foreground",
        isAnnual && !selected && "text-emerald-600 dark:text-emerald-400",
      )}>
        {isAnnual ? "Anual" : "Mensal"}
      </p>

      <div className="flex items-end gap-2 mb-1">
        <span className="text-5xl font-black text-foreground leading-none">{isAnnual ? "R$94,90" : "R$9,90"}</span>
        <span className="text-sm text-muted-foreground mb-1 font-medium">{isAnnual ? "/ano" : "/mês"}</span>
      </div>

      {isAnnual ? (
        <div className="mt-2 space-y-0.5">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Equivale a R$7,91/mês</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Você economiza R$23,90/ano</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">Sem compromisso de longo prazo</p>
      )}

      {!hasUsedTrial && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-500/10 px-2.5 py-1">
          <span className="text-sm font-bold text-violet-600 dark:text-violet-400">✦ 7 dias grátis</span>
        </div>
      )}

      {isAnnual && (
        <p className="mt-2 text-xs text-muted-foreground/60">
          <span className="line-through">R$118,80</span> se fosse mensal
        </p>
      )}

      <ul className="mt-4 space-y-2 border-t border-border/40 pt-4">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}

// ── Change plan cards ─────────────────────────────────────────────────────────

interface ChangePlanSectionProps {
  currentPlan: "monthly" | "annual";
  loading: boolean;
  onChangePlan: (p: "monthly" | "annual") => void;
}

function ChangePlanSection({ currentPlan, loading, onChangePlan }: ChangePlanSectionProps) {
  const isAnnual = currentPlan === "annual";

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
          <RefreshCcw className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Alterar plano</p>
          <p className="text-xs text-muted-foreground">A mudança entra em vigor na próxima cobrança.</p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Monthly card */}
        <div className={cn(
          "relative rounded-xl border-2 p-4 transition-all",
          !isAnnual ? "border-blue-500/50 bg-blue-500/10" : "border-border/40 bg-muted/20",
        )}>
          {!isAnnual && (
            <span className="absolute top-3 right-3 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Plano atual
            </span>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Mensal</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-3xl font-black text-foreground leading-none">R$9,90</span>
            <span className="text-xs text-muted-foreground mb-1">/mês</span>
          </div>
          <p className="text-xs text-muted-foreground">Sem compromisso longo prazo</p>
          {isAnnual && (
            <button
              onClick={() => onChangePlan("monthly")}
              disabled={loading}
              className="mt-4 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Fazer downgrade
            </button>
          )}
        </div>

        {/* Annual card */}
        <div className={cn(
          "relative rounded-xl border-2 p-4 transition-all overflow-hidden",
          isAnnual ? "border-emerald-500/50 bg-emerald-500/10" : "border-emerald-500/30 bg-emerald-500/5",
        )}>
          {isAnnual && (
            <span className="absolute top-3 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Plano atual
            </span>
          )}
          {!isAnnual && (
            <span className="absolute top-3 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
              -20%
            </span>
          )}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Anual</p>
          <div className="flex items-end gap-1 mb-0.5">
            <span className="text-3xl font-black text-foreground leading-none">R$94,90</span>
            <span className="text-xs text-muted-foreground mb-1">/ano</span>
          </div>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">R$7,91/mês · economize R$23,90</p>
          {!isAnnual && (
            <button
              onClick={() => onChangePlan("annual")}
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Fazer upgrade
            </button>
          )}
        </div>
      </div>

      {isAnnual && (
        <p className="px-5 pb-4 text-xs text-muted-foreground">
          Você está no melhor plano disponível. Downgrade para mensal reduz a frequência de cobrança mas aumenta o valor mensal efetivo.
        </p>
      )}
    </div>
  );
}

// ── Status hero card ──────────────────────────────────────────────────────────

function StatusHero({ status, isAdmin, isCancelled }: { status: SubStatus; isAdmin: boolean; isCancelled: boolean }) {
  const plan       = status.subscription_plan;
  const isCourtesy = plan === "courtesy";
  const isAnnual   = plan === "annual";
  const trialDays  = daysUntil(status.trial_ends_at);
  const inTrial    = (trialDays ?? 0) > 0;
  const subEnd     = fmtDate(status.subscription_ends_at);
  const subEndDays = daysUntil(status.subscription_ends_at);

  const grad = isAdmin
    ? "from-rose-700 to-rose-500"
    : isCourtesy
    ? "from-violet-700 to-fuchsia-600"
    : isCancelled
    ? "from-amber-600 to-orange-500"
    : inTrial
    ? "from-violet-600 to-purple-500"
    : "from-blue-600 to-sky-500";

  const badge = isAdmin ? "Admin" : isCourtesy ? "Cortesia" : isCancelled ? "Expirando" : inTrial ? "Trial" : "Ativo";
  const badgeCls = isCancelled || isAdmin ? "bg-white/20" : inTrial ? "bg-white/20" : "bg-emerald-400/25 border border-emerald-300/30 text-emerald-100";

  const planLabel = isAdmin ? "Administrador" : isCourtesy ? "Premium Cortesia" : isAnnual ? "Premium Anual" : "Premium Mensal";
  const planPrice = isCourtesy || isAdmin ? "Sem cobrança" : isAnnual ? "R$94,90/ano" : "R$9,90/mês";

  return (
    <div className={cn("rounded-2xl overflow-hidden bg-gradient-to-br", grad)}>
      <div className="px-6 py-5">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-white/65 font-medium uppercase tracking-wider">Valora Finanças</p>
              <p className="text-base font-bold text-white leading-none">{planLabel}</p>
            </div>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold text-white uppercase tracking-wide", badgeCls)}>
            {badge}
          </span>
        </div>

        {/* Info grid */}
        {!isAdmin && !isCourtesy && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3">
              <p className="text-[10px] text-white/60 uppercase tracking-wide">Valor</p>
              <p className="text-sm font-black text-white mt-0.5">{planPrice}</p>
            </div>
            <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3">
              <p className="text-[10px] text-white/60 uppercase tracking-wide">
                {isCancelled ? "Acesso até" : inTrial ? "1º pagamento" : "Renova em"}
              </p>
              <p className="text-sm font-black text-white mt-0.5">{subEnd ?? "—"}</p>
              {inTrial && trialDays !== null && (
                <p className="text-[10px] text-white/70 mt-0.5">{trialDays}d grátis restantes</p>
              )}
              {isCancelled && subEndDays !== null && (
                <p className="text-[10px] text-amber-200 mt-0.5">{subEndDays}d restantes</p>
              )}
            </div>
          </div>
        )}

        {(isAdmin || isCourtesy) && (
          <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3">
            <p className="text-sm text-white/80">
              {isAdmin ? "Acesso completo sem restrições." : "Acesso Premium permanente sem cobranças."}
            </p>
          </div>
        )}
      </div>

      {/* Features strip */}
      <div className="bg-white/10 border-t border-white/15 px-6 py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {FEATURES.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-xs text-white/75">
              <CheckCircle2 className="h-3 w-3 text-white/60 shrink-0" />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssinaturaPage() {
  const searchParams = useSearchParams();
  const { user }     = useUser();

  const [status,            setStatus]            = useState<SubStatus | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [selectedPlan,      setSelectedPlan]      = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading,   setCheckoutLoading]   = useState(false);
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [showCancel,        setShowCancel]        = useState(false);
  const [cancelLoading,     setCancelLoading]     = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState(false);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s === "success") toast.success("Assinatura ativada com sucesso!");
    if (s === "failure") toast.error("Não foi possível processar o pagamento.");
  }, [searchParams]);

  useEffect(() => {
    api.get<{ data: SubStatus }>("/subscriptions/status")
      .then(({ data }) => setStatus(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const { data } = await api.post<{ url: string }>("/subscriptions/checkout", { plan: selectedPlan });
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? "Erro ao iniciar checkout");
      setCheckoutLoading(false);
      setShowConfirm(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const { data } = await api.delete<{ message: string }>("/subscriptions");
      toast.success(data.message, { duration: 6000 });
      setStatus((s) => s ? { ...s, subscription_cancelled_at: new Date().toISOString() } : s);
      setShowCancel(false);
    } catch {
      toast.error("Erro ao cancelar renovação");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleChangePlan(targetPlan: "monthly" | "annual") {
    setChangePlanLoading(true);
    try {
      const { data } = await api.patch<{ message: string }>("/subscriptions/plan", { plan: targetPlan });
      toast.success(data.message, { duration: 7000 });
      setStatus((s) => s ? { ...s, subscription_plan: targetPlan } : s);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? "Erro ao alterar plano");
    } finally {
      setChangePlanLoading(false);
    }
  }

  const isPremium   = status?.user_level === "premium" || user?.user_level === "premium";
  const isAdmin     = user?.user_level === "admin";
  const isCancelled = !!status?.subscription_cancelled_at;
  const hasUsedTrial = !!status?.trial_ends_at;
  const rawPlan      = status?.subscription_plan ?? "monthly";
  const isCourtesy   = rawPlan === "courtesy";
  const currentPlan  = (isCourtesy ? "monthly" : rawPlan) as "monthly" | "annual";
  const accessUntil  = fmtDate(status?.subscription_ends_at ?? null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>
        <p className="text-sm text-muted-foreground">Gerencie seu plano Valora Premium</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />
        </div>
      )}

      {/* ── Premium / Admin view ── */}
      {!loading && (isPremium || isAdmin) && status && (
        <>
          <StatusHero status={status} isAdmin={isAdmin} isCancelled={isCancelled} />

          {/* Change plan */}
          {!isAdmin && !isCourtesy && !isCancelled && (
            <ChangePlanSection
              currentPlan={currentPlan}
              loading={changePlanLoading}
              onChangePlan={handleChangePlan}
            />
          )}

          {/* Cancel */}
          {!isAdmin && !isCourtesy && (
            <div className="flex justify-end">
              {isCancelled ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-400/80">
                  <Clock className="h-4 w-4" />
                  Renovação já cancelada · acesso até {accessUntil}
                </div>
              ) : (
                <button
                  onClick={() => setShowCancel(true)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar renovação automática
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Non-subscriber view ── */}
      {!loading && !isPremium && !isAdmin && (
        <>
          <div>
            <p className="text-lg font-bold text-foreground mb-1">Planos disponíveis</p>
            <p className="text-sm text-muted-foreground mb-4">Escolha o plano ideal. Cancele quando quiser.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PlanCard plan="monthly" selected={selectedPlan === "monthly"} hasUsedTrial={hasUsedTrial} onSelect={() => setSelectedPlan("monthly")} />
              <PlanCard plan="annual"  selected={selectedPlan === "annual"}  hasUsedTrial={hasUsedTrial} onSelect={() => setSelectedPlan("annual")} />
            </div>
          </div>

          <Button className="w-full h-11 text-base font-bold" onClick={() => setShowConfirm(true)} disabled={checkoutLoading}>
            <Crown className="mr-2 h-5 w-5" />
            {selectedPlan === "annual"
              ? hasUsedTrial ? "Assinar por R$94,90/ano" : "Experimente grátis · R$94,90/ano"
              : hasUsedTrial ? "Assinar por R$9,90/mês"  : "Experimente grátis · R$9,90/mês"}
          </Button>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Pagamento processado com segurança pelo{" "}
        <span className="font-semibold text-[#009EE3]">Mercado Pago</span>
      </p>

      {/* Modals */}
      <ConfirmModal
        open={showConfirm}
        plan={selectedPlan}
        hasUsedTrial={hasUsedTrial}
        loading={checkoutLoading}
        onConfirm={handleCheckout}
        onClose={() => setShowConfirm(false)}
      />

      <AlertDialog open={showCancel} onOpenChange={(v) => !cancelLoading && setShowCancel(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar renovação automática?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Seu acesso Premium será mantido até{" "}
                  <span className="font-semibold text-foreground">{accessUntil ?? "o fim do período pago"}</span>.
                  Após essa data a conta retorna ao plano gratuito.
                </p>
                <p className="text-xs text-muted-foreground">Não há reembolso após o cancelamento.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelLoading}
              className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
            >
              {cancelLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
