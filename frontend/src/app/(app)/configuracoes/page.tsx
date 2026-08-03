"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
import { PageShell } from "@/components/ui/page-shell";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Trash2, Tag, Lock, AlertTriangle, Smartphone,
  Copy, Check, Eye, EyeOff, RefreshCw, ExternalLink, Pencil,
  ChevronDown, Settings, Crown, CheckCircle2, Clock, XCircle, Loader2, Bell,
  Wallet, LayoutGrid, Palette, Database, Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { Switch } from "@/components/ui/switch";
import {
  fetchPreferencias, salvarPreferencias, type Preferencias,
} from "@/lib/preferencias";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { BackgroundEfeito } from "@/components/AppBackground";
import { toCSV, downloadFile } from "@/lib/csv";

interface Categoria {
  id: number; nome: string; cor: string | null;
  icone: string | null; tipo: "gasto" | "renda"; user_id: string | null;
  limite_mensal?: number | null;
}
interface ApiResponse {
  data: Categoria[];
  pagination: { total: number; page: number; totalPages: number };
}

const DEFAULT_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#A3E635",
  "#34D399", "#22D3EE", "#60A5FA", "#A78BFA",
  "#F472B6", "#94A3B8",
];

const SHORTCUT_ICLOUD_URL = process.env.NEXT_PUBLIC_SHORTCUT_ICLOUD_URL ?? "";

// ─── iPhone section ───────────────────────────────────────────────────────────

interface ShortcutStats {
  api_key: string | null;
  shortcut_count: number;
  last_shortcut_at: string | null;
}

function fmtRelativo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH   = Math.floor(diffMs / 3_600_000);
  const diffD   = Math.floor(diffMs / 86_400_000);
  if (diffMin < 1)       return "agora";
  if (diffMin < 60)      return `${diffMin}min atrás`;
  if (diffH < 24)        return `${diffH}h atrás`;
  if (diffD === 1)       return "ontem";
  if (diffD < 30)        return `${diffD} dias atrás`;
  if (diffD < 365)       return `${Math.floor(diffD / 30)} meses atrás`;
  return `${Math.floor(diffD / 365)} anos atrás`;
}

function IphoneSection() {
  const [stats, setStats] = useState<ShortcutStats>({ api_key: null, shortcut_count: 0, last_shortcut_at: null });
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  const apiKey = stats.api_key;

  useEffect(() => {
    api.get<ShortcutStats>("/shortcut/my-key")
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Erro ao carregar API key"));
  }, []);

  async function handleCopy() {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("API Key copiada!", { duration: 2000 });
  }

  async function handleRotate() {
    if (!confirm("Isso invalida o atalho configurado. Precisará reconfigurar. Continuar?")) return;
    setRotating(true);
    try {
      const r = await api.post<{ api_key: string }>("/shortcut/rotate-key");
      setStats((s) => ({ ...s, api_key: r.data.api_key }));
      toast.success("API key rotacionada");
    } catch {
      toast.error("Erro ao rotacionar");
    } finally {
      setRotating(false);
    }
  }

  const masked = apiKey ? apiKey.slice(0, 8) + "••••••••••••••" + apiKey.slice(-4) : null;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">Atalho iPhone</h2>
        <p className="text-xs text-white/40 mt-0.5">Integre com o app Atalhos do iOS para registrar gastos por voz</p>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {/* Step 1 */}
        <div className="px-5 py-5 flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 font-bold text-xs text-sky-400">1</div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Baixar o Atalho</p>
              <p className="text-xs text-white/45 mt-0.5">Instala o atalho no app Atalhos do iPhone.</p>
            </div>
            {SHORTCUT_ICLOUD_URL ? (
              <button
                onClick={async () => {
                  if (apiKey) { await navigator.clipboard.writeText(apiKey).catch(() => {}); toast.success("API Key copiada! Cole quando o atalho pedir.", { duration: 4000 }); }
                  window.open(SHORTCUT_ICLOUD_URL, "_blank");
                }}
                className="flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/25"
              >
                <ExternalLink className="h-3.5 w-3.5" />Baixar Atalho
              </button>
            ) : (
              <p className="text-[11px] text-amber-400/70">
                Configure <code className="font-mono">NEXT_PUBLIC_SHORTCUT_ICLOUD_URL</code> com o link iCloud do atalho.
              </p>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div className="px-5 py-5 flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 font-bold text-xs text-violet-400">2</div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Configurar sua conta</p>
              <p className="text-xs text-white/45 mt-0.5">Copie sua API Key e cole quando o atalho pedir.</p>
            </div>

            {apiKey ? (
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                <code className="flex-1 text-xs font-mono text-white/60 truncate">{showKey ? apiKey : masked}</code>
                <button onClick={() => setShowKey((v) => !v)} className="text-white/25 hover:text-white/50 transition-colors">
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={handleCopy} className="text-white/25 hover:text-white/50 transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ) : (
              <div className="h-10 rounded-lg bg-white/[0.03] animate-pulse" />
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!apiKey}
                className="flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/25 disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiada!" : "Copiar API Key"}
              </button>
              <button
                onClick={handleRotate}
                disabled={rotating}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3 w-3", rotating && "animate-spin")} />
                Rotacionar key
              </button>
            </div>
          </div>
        </div>

        {/* Stats do atalho */}
        <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.015]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3">
            Uso do atalho
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-300/60 mb-1">
                Gastos registrados
              </p>
              <p className="text-2xl font-bold tabular-nums text-sky-300">
                {stats.shortcut_count}
              </p>
              <p className="text-[10px] text-sky-300/40 mt-0.5">via iPhone Shortcuts</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">
                Último uso
              </p>
              <p
                className="text-sm font-semibold text-white/70"
                title={stats.last_shortcut_at ? new Date(stats.last_shortcut_at).toLocaleString("pt-BR") : undefined}
              >
                {fmtRelativo(stats.last_shortcut_at)}
              </p>
              {stats.last_shortcut_at && (
                <p className="text-[10px] text-white/30 mt-0.5">
                  {new Date(stats.last_shortcut_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Categorias section ───────────────────────────────────────────────────────

interface CategoriasSectionProps {
  categorias: Categoria[];
  loading: boolean;
  loadError: boolean;
  onRefetch: () => void;
  onEdit: (cat: Categoria) => void;
  onCreate: () => void;
}

function CategoriasSection({ categorias, loading, loadError, onRefetch, onEdit, onCreate }: CategoriasSectionProps) {
  const [filterTipo, setFilterTipo] = useState<"todos" | "gasto" | "renda">("todos");
  const [search, setSearch] = useState("");
  const [globaisOpen, setGlobaisOpen] = useState(false);

  const filtered = categorias.filter((c) => {
    const matchTipo = filterTipo === "todos" || c.tipo === filterTipo;
    const matchSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase());
    return matchTipo && matchSearch;
  });

  const userCats = filtered;
  const globalCats: Categoria[] = [];
  const allGlobalCats: Categoria[] = [];

  const FILTER_CHIPS: { value: "todos" | "gasto" | "renda"; label: string; idle: string; active: string }[] = [
    { value: "todos", label: "Todos", idle: "bg-white/[0.05] text-white/50 border-white/10 hover:text-white/70", active: "bg-white/[0.12] text-white border-white/25" },
    { value: "gasto", label: "Gastos", idle: "bg-rose-500/[0.06] text-rose-400/60 border-rose-400/15 hover:text-rose-300", active: "bg-rose-500/20 text-rose-300 border-rose-400/40" },
    { value: "renda", label: "Rendas", idle: "bg-blue-500/[0.06] text-blue-400/60 border-blue-400/15 hover:text-blue-300", active: "bg-blue-500/20 text-blue-300 border-blue-400/40" },
  ];

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-sm font-semibold text-white">Categorias</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {loading ? "Carregando..." : `${categorias.length} categoria${categorias.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/[0.10] hover:text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />Nova
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-1.5">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setFilterTipo(chip.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
                filterTipo === chip.value ? chip.active : chip.idle
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm w-full sm:w-44 bg-white/[0.03] border-white/[0.08] focus-visible:border-white/20 focus-visible:ring-0 placeholder:text-white/25"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-5 py-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-xl" />)}
        </div>
      ) : loadError ? (
        <div className="px-5 py-6">
          <PageDataState mode="error" icon={AlertTriangle} title="Não foi possível carregar" description="Erro ao carregar categorias." onAction={onRefetch} />
        </div>
      ) : userCats.length === 0 && search ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-white/30">Nenhum resultado para &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div>
          {/* User categories list */}
          <div className="px-3 py-2">
            {userCats.length === 0 && !search && (
              <p className="px-2 py-4 text-xs text-white/30 text-center">Nenhuma categoria criada ainda.</p>
            )}
            {userCats.map((cat) => (
              <CategoriaRow key={cat.id} cat={cat} onEdit={() => onEdit(cat)} />
            ))}

            {/* Add row */}
            {filterTipo !== "renda" && (
              <button
                onClick={onCreate}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/55 hover:bg-white/[0.03] transition-colors text-xs border border-dashed border-transparent hover:border-white/[0.08]"
              >
                <Plus className="h-3.5 w-3.5" />Nova categoria
              </button>
            )}
          </div>

          {/* Global categories — collapsed */}
          {allGlobalCats.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.04]">
              <button
                onClick={() => setGlobaisOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/45 transition-colors"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", globaisOpen && "rotate-180")} />
                <Lock className="h-2.5 w-2.5" />
                {allGlobalCats.length} categorias globais pré-definidas
              </button>

              {globaisOpen && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {globalCats.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[11px] text-white/35">
                      {cat.icone ? (
                        <span className="text-sm leading-none">{cat.icone}</span>
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cat.cor ?? "#94a3b8" }} />
                      )}
                      <span>{cat.nome}</span>
                      <span className={cn(
                        "rounded px-1 text-[9px] font-bold",
                        cat.tipo === "gasto" ? "text-rose-400/50" : "text-blue-400/50"
                      )}>{cat.tipo === "gasto" ? "G" : "R"}</span>
                    </div>
                  ))}
                  {globalCats.length === 0 && search && (
                    <p className="text-[11px] text-white/20">Nenhuma global com esse filtro.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoriaRow({ cat, onEdit }: { cat: Categoria; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] group transition-colors text-left"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
        style={{ background: (cat.cor ?? "#94a3b8") + "28" }}
      >
        {cat.icone ? (
          <span>{cat.icone}</span>
        ) : (
          <span className="h-3 w-3 rounded-full block" style={{ background: cat.cor ?? "#94a3b8" }} />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-white/85 truncate">{cat.nome}</span>
      <Badge
        variant={cat.tipo === "gasto" ? "rose" : "blue"}
        className="text-[10px] px-1.5 py-0 opacity-60 group-hover:opacity-100 transition-opacity"
      >
        {cat.tipo === "gasto" ? "Gasto" : "Renda"}
      </Badge>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white/0 group-hover:text-white/40 hover:!text-white hover:bg-white/[0.08] transition-all">
        <Pencil className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

// ─── Assinatura section ───────────────────────────────────────────────────────

interface SubStatus {
  user_level: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  mp_subscription_id: string | null;
  subscription_plan: string | null;
  subscription_cancelled_at: string | null;
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function fmt(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function AssinaturaSection() {
  const { user }                      = useUser();
  const [status, setStatus]           = useState<SubStatus | null>(null);
  const [loading, setLoading]         = useState(true);
  const [cancelling, setCancelling]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    api.get<{ data: SubStatus }>("/subscriptions/status")
      .then(({ data }) => setStatus(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    setCancelling(true);
    try {
      const { data } = await api.delete<{ message: string }>("/subscriptions");
      toast.success(data.message, { duration: 6000 });
      setStatus((s) => s ? { ...s, subscription_cancelled_at: new Date().toISOString() } : s);
      setShowConfirm(false);
    } catch {
      toast.error("Erro ao cancelar renovação");
    } finally {
      setCancelling(false);
    }
  }

  async function handleChangePlan(targetPlan: "monthly" | "annual") {
    setChangingPlan(true);
    try {
      const { data } = await api.patch<{ message: string }>("/subscriptions/plan", { plan: targetPlan });
      toast.success(data.message, { duration: 6000 });
      setStatus((s) => s ? { ...s, subscription_plan: targetPlan } : s);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Erro ao alterar plano");
    } finally {
      setChangingPlan(false);
    }
  }

  const isPremium   = status?.user_level === "premium";
  const isCourtesy  = status?.subscription_plan === "courtesy";
  const isCancelled = !!status?.subscription_cancelled_at;
  const isAnnual    = status?.subscription_plan === "annual";
  const trialDays   = daysUntil(status?.trial_ends_at ?? null);
  const inTrial     = trialDays !== null && trialDays > 0;
  const subEnd      = fmt(status?.subscription_ends_at ?? null);
  const subEndDays  = daysUntil(status?.subscription_ends_at ?? null);
  const freeDays    = !isPremium && user?.created_at
    ? Math.min(7, Math.max(0, Math.ceil((7 * 86_400_000 - (Date.now() - new Date(user.created_at).getTime())) / 86_400_000)))
    : null;

  // Plan label helpers
  const planLabel   = isAnnual ? "Anual" : "Mensal";
  const planPrice   = isAnnual ? "R$ 94,90/ano" : "R$ 9,90/mês";

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">Plano atual</h2>
        <p className="text-xs text-white/40 mt-0.5">Gerencie sua assinatura Valora Premium</p>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
            <div className="h-10 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="h-8 w-40 rounded-lg bg-white/[0.03] animate-pulse" />
          </div>
        ) : (
          <>
            {/* ── Main plan card ── */}
            {isPremium && inTrial && (
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-violet-600 to-purple-500 px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/65 font-medium uppercase tracking-wider">Valora Premium</p>
                        <p className="text-sm font-bold text-white leading-none">Período de teste</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide">Trial</span>
                  </div>
                  <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-black text-white leading-none">{trialDays}</p>
                      <p className="text-[10px] text-white/70 mt-0.5">dia{trialDays !== 1 ? "s" : ""} grátis</p>
                    </div>
                    <div className="h-8 w-px bg-white/20" />
                    <div>
                      {subEnd && <p className="text-xs text-white/80">Primeiro pagamento em <span className="font-bold">{subEnd}</span></p>}
                      <p className="text-xs text-white/60 mt-0.5">{planLabel} · {planPrice}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isPremium && !inTrial && !isCancelled && !isCourtesy && (
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-blue-600 to-sky-500 px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/65 font-medium uppercase tracking-wider">Valora Premium</p>
                        <p className="text-sm font-bold text-white leading-none">Plano {planLabel}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-400/25 border border-emerald-300/30 px-2.5 py-1 text-[10px] font-bold text-emerald-200 uppercase tracking-wide">Ativo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2.5 text-center">
                      <p className="text-[10px] text-white/60 uppercase tracking-wide">Valor</p>
                      <p className="text-sm font-black text-white mt-0.5">{planPrice}</p>
                    </div>
                    <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2.5 text-center">
                      <p className="text-[10px] text-white/60 uppercase tracking-wide">Renova em</p>
                      <p className="text-sm font-black text-white mt-0.5">{subEnd ?? "—"}</p>
                      {subEndDays !== null && subEndDays <= 7 && (
                        <p className="text-[10px] text-amber-300 mt-0.5">{subEndDays}d</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isPremium && isCancelled && (
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-amber-600 to-orange-500 px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/65 font-medium uppercase tracking-wider">Valora Premium</p>
                        <p className="text-sm font-bold text-white leading-none">Renovação cancelada</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide">Expirando</span>
                  </div>
                  <div className="rounded-xl bg-white/15 border border-white/20 px-4 py-3 flex items-center gap-4">
                    {subEndDays !== null && (
                      <div className="text-center">
                        <p className="text-3xl font-black text-white leading-none">{subEndDays}</p>
                        <p className="text-[10px] text-white/70 mt-0.5">dia{subEndDays !== 1 ? "s" : ""} restantes</p>
                      </div>
                    )}
                    {subEndDays !== null && <div className="h-8 w-px bg-white/20" />}
                    <div>
                      {subEnd && <p className="text-xs text-white/80">Acesso garantido até <span className="font-bold">{subEnd}</span></p>}
                      <p className="text-xs text-white/60 mt-0.5">Sem cobranças futuras</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isPremium && isCourtesy && (
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-violet-700 to-fuchsia-600 px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/65 font-medium uppercase tracking-wider">Valora Premium</p>
                        <p className="text-sm font-bold text-white leading-none">Plano Cortesia</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide">Permanente</span>
                  </div>
                  <p className="text-xs text-white/70">Acesso completo concedido. Sem cobranças.</p>
                </div>
              </div>
            )}

            {!isPremium && (
              <div className="rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-slate-700 to-slate-600 px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                        <Crown className="h-4 w-4 text-white/50" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Valora Finanças</p>
                        <p className="text-sm font-bold text-white leading-none">Plano Gratuito</p>
                      </div>
                    </div>
                  </div>
                  {freeDays !== null && freeDays > 0 ? (
                    <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-black text-white leading-none">{freeDays}</p>
                        <p className="text-[10px] text-white/60 mt-0.5">dia{freeDays !== 1 ? "s" : ""} grátis</p>
                      </div>
                      <div className="h-8 w-px bg-white/15" />
                      <p className="text-xs text-white/60">Assine para manter acesso completo após o período gratuito</p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/50">Assine para desbloquear todos os recursos Premium</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Change plan (only for active non-courtesy premium) ── */}
            {isPremium && !isCourtesy && !isCancelled && !inTrial && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Alterar plano</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!isAnnual || changingPlan}
                    onClick={() => handleChangePlan("monthly")}
                    className={cn(
                      "relative rounded-xl border px-4 py-3 text-left transition-all",
                      !isAnnual
                        ? "border-blue-400/40 bg-blue-500/15 cursor-default"
                        : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 disabled:opacity-40"
                    )}
                  >
                    {!isAnnual && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    <p className="text-xs font-bold text-white">Mensal</p>
                    <p className="text-lg font-black text-white mt-0.5">R$ 9,90</p>
                    <p className="text-[10px] text-white/40">por mês</p>
                  </button>

                  <button
                    disabled={isAnnual || changingPlan}
                    onClick={() => handleChangePlan("annual")}
                    className={cn(
                      "relative rounded-xl border px-4 py-3 text-left transition-all",
                      isAnnual
                        ? "border-emerald-400/40 bg-emerald-500/15 cursor-default"
                        : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 disabled:opacity-40"
                    )}
                  >
                    {isAnnual && (
                      <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                    <span className="absolute left-3 top-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">-20%</span>
                    <p className="text-xs font-bold text-white mt-4">Anual</p>
                    <p className="text-lg font-black text-white mt-0.5">R$ 94,90</p>
                    <p className="text-[10px] text-white/40">por ano · R$ 7,91/mês</p>
                  </button>
                </div>
                {changingPlan && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Alterando plano...
                  </div>
                )}
                <p className="text-[10px] text-white/30">A mudança entra em vigor na próxima cobrança.</p>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex flex-wrap gap-2">
              {!isPremium ? (
                <Link
                  href="/assinatura"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  <Crown className="h-4 w-4" />
                  Assinar agora
                </Link>
              ) : (
                <>
                  {!isCancelled && !isCourtesy && (
                    <Link
                      href="/assinatura"
                      className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.10] transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver detalhes
                    </Link>
                  )}

                  {isCancelled ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400/80">
                      <Clock className="h-3.5 w-3.5" />
                      Renovação já cancelada
                    </div>
                  ) : !isCourtesy ? (
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar renovação
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={(v) => !cancelling && setShowConfirm(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar renovação automática?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Seu acesso Premium será mantido até{" "}
                  <span className="font-semibold text-foreground">{subEnd ?? "o fim do período pago"}</span>.
                  Após essa data, a conta retorna ao plano gratuito.
                </p>
                <p className="text-xs text-muted-foreground">Não há reembolso após o cancelamento.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
            >
              {cancelling ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Settings nav ─────────────────────────────────────────────────────────────


// ─── Alertas e preferências ────────────────────────────────────────────────────

function AlertasSection() {
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [percentual, setPercentual] = useState("100");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetchPreferencias().then((p) => {
      setPrefs(p);
      setPercentual(String(p.limite_gastos_percentual));
    });
  }, []);

  async function aplicar(patch: Partial<Preferencias>) {
    setSalvando(true);
    try {
      const atualizadas = await salvarPreferencias(patch);
      setPrefs(atualizadas);
      setPercentual(String(atualizadas.limite_gastos_percentual));
      toast.success("Preferências salvas");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSalvando(false);
    }
  }

  function salvarPercentual() {
    const valor = Number(percentual);
    if (!Number.isInteger(valor) || valor < 10 || valor > 300) {
      toast.error("Informe um percentual inteiro entre 10 e 300");
      setPercentual(String(prefs?.limite_gastos_percentual ?? 100));
      return;
    }
    if (valor === prefs?.limite_gastos_percentual) return;
    aplicar({ limite_gastos_percentual: valor });
  }

  if (!prefs) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-5 space-y-3">
        <Skeleton className="h-5 w-40 bg-white/10" />
        <Skeleton className="h-16 w-full bg-white/10" />
        <Skeleton className="h-16 w-full bg-white/10" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">Alertas</h2>
        <p className="text-xs text-white/40 mt-0.5">Quando o sino e os avisos críticos devem aparecer</p>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {/* Limite de gastos */}
        <div className="px-5 py-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
              <Bell className="h-4 w-4 text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Limite de gastos sobre a renda</p>
              <p className="text-xs text-white/45 mt-0.5">
                Dispara o alerta crítico quando os gastos do mês passam desse percentual da renda.
                100% = gastar tudo que entrou.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-12">
            <div className="relative w-28">
              <Input
                type="number"
                min={10}
                max={300}
                step={5}
                inputMode="numeric"
                value={percentual}
                disabled={salvando}
                onChange={(e) => setPercentual(e.target.value)}
                onBlur={salvarPercentual}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                aria-label="Percentual máximo de gastos sobre a renda"
                className="pr-7 tabular-nums"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">%</span>
            </div>
            <div className="flex gap-1.5">
              {[70, 80, 90, 100].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => aplicar({ limite_gastos_percentual: v })}
                  disabled={salvando}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    prefs.limite_gastos_percentual === v
                      ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
                      : "border-white/10 text-white/45 hover:text-white/80",
                  )}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <PreferenciaToggle
          titulo="Alerta de gastos acima do limite"
          descricao="Mostra o sino com aviso e o banner crítico no dashboard e nos relatórios."
          checked={prefs.alerta_gastos_ativo}
          disabled={salvando}
          onChange={(v) => aplicar({ alerta_gastos_ativo: v })}
        />

        <PreferenciaToggle
          titulo="Aviso de fatura fechada sem pagamento"
          descricao="Abre o lembrete com os dias restantes até o vencimento da fatura."
          checked={prefs.alerta_fatura_ativo}
          disabled={salvando}
          onChange={(v) => aplicar({ alerta_fatura_ativo: v })}
        />

        <PreferenciaToggle
          titulo="Abrir mês anterior até a fatura fechar"
          descricao="Enquanto a fatura do mês anterior não fecha, a tela de gastos abre nele."
          checked={prefs.abrir_mes_apos_fechamento}
          disabled={salvando}
          onChange={(v) => aplicar({ abrir_mes_apos_fechamento: v })}
        />
      </div>
    </div>
  );
}

function PreferenciaToggle({
  titulo, descricao, checked, disabled, onChange,
}: {
  titulo: string;
  descricao: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{titulo}</p>
        <p className="text-xs text-white/45 mt-0.5">{descricao}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={titulo}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}


interface CartaoOpcao { id: string; apelido: string; }

// ─── Lançamentos: padrões do formulário de gasto ───────────────────────────────

function LancamentosSection() {
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<CartaoOpcao[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetchPreferencias().then(setPrefs);
    api.get<ApiResponse>("/categorias", { params: { limit: 200 } })
      .then((r) => setCategorias(r.data.data))
      .catch(() => {});
    api.get<{ data: CartaoOpcao[] }>("/cartoes", { params: { limit: 100 } })
      .then((r) => setCartoes(r.data.data ?? []))
      .catch(() => {});
  }, []);

  async function aplicar(patch: Partial<Preferencias>) {
    setSalvando(true);
    try {
      setPrefs(await salvarPreferencias(patch));
      toast.success("Preferências salvas");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSalvando(false);
    }
  }

  if (!prefs) return <SecaoSkeleton />;

  const usaCartao =
    prefs.forma_pagamento_padrao === "cartao_credito" ||
    prefs.forma_pagamento_padrao === "cartao_debito";

  return (
    <SecaoCard titulo="Lançamentos" descricao="Como um novo gasto ou renda já vem preenchido">
      <LinhaSelect
        titulo="Forma de pagamento padrão"
        descricao="Pré-selecionada ao abrir o formulário de novo gasto."
        value={prefs.forma_pagamento_padrao}
        disabled={salvando}
        onChange={(v) => aplicar({ forma_pagamento_padrao: v as Preferencias["forma_pagamento_padrao"] })}
        options={[
          { value: "dinheiro", label: "Dinheiro" },
          { value: "pix", label: "Pix" },
          { value: "cartao_credito", label: "Cartão de crédito" },
          { value: "cartao_debito", label: "Cartão de débito" },
          { value: "transferencia", label: "Transferência" },
          { value: "outro", label: "Outro" },
        ]}
      />

      {usaCartao && (
        <LinhaSelect
          titulo="Cartão padrão"
          descricao="Usado quando a forma de pagamento padrão é cartão."
          value={prefs.cartao_padrao_id ?? "__none__"}
          disabled={salvando}
          onChange={(v) => aplicar({ cartao_padrao_id: v === "__none__" ? null : v })}
          options={[
            { value: "__none__", label: "Nenhum" },
            ...cartoes.map((c) => ({ value: c.id, label: c.apelido })),
          ]}
        />
      )}

      <LinhaSelect
        titulo="Categoria padrão de gasto"
        descricao="Vem marcada em todo novo gasto."
        value={prefs.categoria_gasto_padrao ? String(prefs.categoria_gasto_padrao) : "__none__"}
        disabled={salvando}
        onChange={(v) => aplicar({ categoria_gasto_padrao: v === "__none__" ? null : Number(v) })}
        options={[
          { value: "__none__", label: "Nenhuma" },
          ...categorias.filter((c) => c.tipo === "gasto").map((c) => ({ value: String(c.id), label: c.nome })),
        ]}
      />

      <LinhaSelect
        titulo="Categoria padrão de renda"
        descricao="Vem marcada em toda nova entrada de renda."
        value={prefs.categoria_renda_padrao ? String(prefs.categoria_renda_padrao) : "__none__"}
        disabled={salvando}
        onChange={(v) => aplicar({ categoria_renda_padrao: v === "__none__" ? null : Number(v) })}
        options={[
          { value: "__none__", label: "Nenhuma" },
          ...categorias.filter((c) => c.tipo === "renda").map((c) => ({ value: String(c.id), label: c.nome })),
        ]}
      />

      <LinhaSelect
        titulo="Meses lançados por assinatura"
        descricao="Quantas cobranças futuras são criadas ao cadastrar uma assinatura."
        value={String(prefs.assinatura_meses_antecipados)}
        disabled={salvando}
        onChange={(v) => aplicar({ assinatura_meses_antecipados: Number(v) })}
        options={[6, 12, 24, 36, 60].map((n) => ({ value: String(n), label: `${n} meses` }))}
      />

      <PreferenciaToggle
        titulo="Lançar renda recorrente automaticamente"
        descricao="Ao abrir a tela de renda, cria as entradas recorrentes do mês que ainda faltam."
        checked={prefs.auto_lancar_renda}
        disabled={salvando}
        onChange={(v) => aplicar({ auto_lancar_renda: v })}
      />
    </SecaoCard>
  );
}

// ─── Telas: comportamento de navegação e listagem ──────────────────────────────

function TelasSection() {
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { fetchPreferencias().then(setPrefs); }, []);

  async function aplicar(patch: Partial<Preferencias>) {
    setSalvando(true);
    try {
      setPrefs(await salvarPreferencias(patch));
      toast.success("Preferências salvas");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSalvando(false);
    }
  }

  if (!prefs) return <SecaoSkeleton />;

  return (
    <SecaoCard titulo="Telas" descricao="Onde o app abre e como as listas aparecem">
      <LinhaSelect
        titulo="Página inicial"
        descricao="Para onde ir logo depois do login."
        value={prefs.pagina_inicial}
        disabled={salvando}
        onChange={(v) => aplicar({ pagina_inicial: v as Preferencias["pagina_inicial"] })}
        options={[
          { value: "dashboard", label: "Dashboard" },
          { value: "gastos", label: "Gastos" },
          { value: "renda", label: "Renda" },
          { value: "relatorios", label: "Relatórios" },
        ]}
      />

      <LinhaSelect
        titulo="Itens por página"
        descricao="Tamanho das listas de gastos e renda."
        value={String(prefs.itens_por_pagina)}
        disabled={salvando}
        onChange={(v) => aplicar({ itens_por_pagina: Number(v) as Preferencias["itens_por_pagina"] })}
        options={[10, 15, 25, 50].map((n) => ({ value: String(n), label: `${n} itens` }))}
      />

      <LinhaSelect
        titulo="Período padrão"
        descricao="Se as listas abrem filtradas pelo mês ou mostrando tudo."
        value={prefs.periodo_padrao}
        disabled={salvando}
        onChange={(v) => aplicar({ periodo_padrao: v as Preferencias["periodo_padrao"] })}
        options={[
          { value: "mes", label: "Mês atual" },
          { value: "todos", label: "Todos os meses" },
        ]}
      />

      <LinhaSelect
        titulo="Ordenar gastos por"
        descricao="Ordenação inicial da lista de gastos."
        value={`${prefs.ordenacao_gastos.campo}:${prefs.ordenacao_gastos.direcao}`}
        disabled={salvando}
        onChange={(v) => {
          const [campo, direcao] = v.split(":");
          aplicar({
            ordenacao_gastos: {
              campo: campo as Preferencias["ordenacao_gastos"]["campo"],
              direcao: direcao as "asc" | "desc",
            },
          });
        }}
        options={[
          { value: "data:desc", label: "Data (mais recente)" },
          { value: "data:asc", label: "Data (mais antiga)" },
          { value: "valor:desc", label: "Valor (maior)" },
          { value: "valor:asc", label: "Valor (menor)" },
          { value: "descricao:asc", label: "Descrição (A-Z)" },
          { value: "categoria:asc", label: "Categoria (A-Z)" },
          { value: "status:asc", label: "Status" },
          { value: "pagamento:asc", label: "Forma de pagamento" },
        ]}
      />

      <PreferenciaToggle
        titulo="Modo privacidade"
        descricao="Borra os valores na tela. Também dá para ligar pelo ícone de olho no topo."
        checked={prefs.modo_privacidade}
        disabled={salvando}
        onChange={(v) => {
          document.body.classList.toggle("ui-valores-ocultos", v);
          aplicar({ modo_privacidade: v });
        }}
      />

      <PreferenciaToggle
        titulo="Abrir mês anterior até a fatura fechar"
        descricao="Enquanto a fatura do mês anterior não fecha, a tela de gastos abre nele."
        checked={prefs.abrir_mes_apos_fechamento}
        disabled={salvando}
        onChange={(v) => aplicar({ abrir_mes_apos_fechamento: v })}
      />
    </SecaoCard>
  );
}

// ─── Aparência: fundo animado ──────────────────────────────────────────────────

function AparenciaSection() {
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { fetchPreferencias().then(setPrefs); }, []);

  async function escolher(id: string) {
    setSalvando(true);
    try {
      setPrefs(await salvarPreferencias({ background: id }));
      toast.success("Fundo alterado");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSalvando(false);
    }
  }

  if (!prefs) return <SecaoSkeleton />;

  return (
    <SecaoCard titulo="Aparência" descricao="Fundo animado da aplicação">
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
        {BACKGROUNDS.map((bg) => {
          const ativo = prefs.background === bg.id;
          return (
            <button
              key={bg.id}
              type="button"
              disabled={salvando}
              onClick={() => escolher(bg.id)}
              aria-pressed={ativo}
              className={cn(
                "group overflow-hidden rounded-xl border text-left transition-all",
                ativo
                  ? "border-blue-400/50 ring-2 ring-blue-400/30"
                  : "border-white/10 hover:border-white/25",
              )}
            >
              {/* Preview roda o efeito de verdade, em miniatura */}
              <div
                className={cn(
                  "relative h-28 w-full overflow-hidden",
                  bg.fallbackClass,
                )}
              >
                <div className="pointer-events-none absolute inset-0">
                  <BackgroundEfeito id={bg.id} preview />
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{bg.nome}</p>
                  <p className="truncate text-[11px] text-white/40">{bg.descricao}</p>
                </div>
                {ativo && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-400" />}
              </div>
            </button>
          );
        })}
      </div>
    </SecaoCard>
  );
}

// ─── Dados: exportar e apagar ──────────────────────────────────────────────────

function DadosSection() {
  const [exportando, setExportando] = useState<"gastos" | "renda" | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [texto, setTexto] = useState("");
  const [apagando, setApagando] = useState(false);

  async function exportar(tipo: "gastos" | "renda") {
    setExportando(tipo);
    try {
      const { data } = await api.get<{
        data: { gastos: Record<string, unknown>[]; renda: Record<string, unknown>[] };
      }>("/users/me/export");
      const linhas = data.data[tipo];
      if (!linhas.length) {
        toast.error(`Nenhum registro de ${tipo} para exportar`);
        return;
      }
      const colunas = Object.keys(linhas[0]);
      const matriz = [
        colunas,
        ...linhas.map((l) => colunas.map((c) => (l[c] == null ? "" : String(l[c])))),
      ];
      downloadFile(`${tipo}-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(matriz), "text/csv;charset=utf-8");
      toast.success(`${linhas.length} ${tipo} exportados`);
    } catch {
      toast.error("Erro ao exportar dados");
    } finally {
      setExportando(null);
    }
  }

  async function apagarTudo() {
    setApagando(true);
    try {
      const { data } = await api.delete<{
        data: { gastos: number; renda: number; assinaturas: number };
      }>("/users/me/lancamentos");
      toast.success(
        `Removidos: ${data.data.gastos} gastos, ${data.data.renda} rendas, ${data.data.assinaturas} assinaturas`,
      );
      setConfirmando(false);
      setTexto("");
    } catch {
      toast.error("Erro ao apagar lançamentos");
    } finally {
      setApagando(false);
    }
  }

  return (
    <>
      <SecaoCard titulo="Dados" descricao="Leve seus lançamentos embora ou comece do zero">
        <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Exportar em CSV</p>
            <p className="mt-0.5 text-xs text-white/45">
              Abre direto no Excel. Inclui categoria, cartão, status e observações.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              disabled={exportando !== null}
              onClick={() => exportar("gastos")}
              className="h-9 rounded-lg border-white/15 bg-white/[0.05] text-white/80 hover:bg-white/[0.1] hover:text-white"
            >
              {exportando === "gastos" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Gastos
            </Button>
            <Button
              variant="outline"
              disabled={exportando !== null}
              onClick={() => exportar("renda")}
              className="h-9 rounded-lg border-white/15 bg-white/[0.05] text-white/80 hover:bg-white/[0.1] hover:text-white"
            >
              {exportando === "renda" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Renda
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-rose-200">Apagar todos os lançamentos</p>
            <p className="mt-0.5 text-xs text-white/45">
              Remove gastos, rendas e assinaturas. Mantém conta, categorias e cartões. Não dá para desfazer.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setConfirmando(true)}
            className="h-9 shrink-0 rounded-lg border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 hover:text-white"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Apagar tudo
          </Button>
        </div>
      </SecaoCard>

      <AlertDialog open={confirmando} onOpenChange={(v) => { if (!v) { setConfirmando(false); setTexto(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar todos os lançamentos?</AlertDialogTitle>
            <AlertDialogDescription>
              Gastos, parcelas, rendas e assinaturas serão removidos permanentemente.
              Digite <span className="font-mono font-semibold text-rose-300">APAGAR</span> para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="APAGAR"
            aria-label="Confirmação"
            className="font-mono"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={texto !== "APAGAR" || apagando}
              onClick={(e) => { e.preventDefault(); apagarTudo(); }}
              className="bg-rose-600 hover:bg-rose-500"
            >
              {apagando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apagar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Blocos reutilizados pelas seções de preferências ──────────────────────────

function SecaoCard({ titulo, descricao, children }: { titulo: string; descricao: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white">{titulo}</h2>
        <p className="text-xs text-white/40 mt-0.5">{descricao}</p>
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function SecaoSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-5 space-y-3">
      <Skeleton className="h-5 w-40 bg-white/10" />
      <Skeleton className="h-16 w-full bg-white/10" />
      <Skeleton className="h-16 w-full bg-white/10" />
    </div>
  );
}

function LinhaSelect({
  titulo, descricao, value, options, disabled, onChange,
}: {
  titulo: string;
  descricao: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{titulo}</p>
        <p className="text-xs text-white/45 mt-0.5">{descricao}</p>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 w-full shrink-0 sm:w-56" aria-label={titulo}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "plano",      icon: Crown,      label: "Plano",          desc: "Assinatura Premium" },
  { id: "categorias", icon: Tag,        label: "Categorias",     desc: "Tags para gastos e rendas" },
  { id: "lancamentos", icon: Wallet,    label: "Lançamentos",    desc: "Padrões de novo gasto" },
  { id: "telas",      icon: LayoutGrid, label: "Telas",          desc: "Navegação e listas" },
  { id: "alertas",    icon: Bell,       label: "Alertas",        desc: "Limites e notificações" },
  { id: "aparencia",  icon: Palette,    label: "Aparência",      desc: "Fundo da aplicação" },
  { id: "dados",      icon: Database,   label: "Dados",          desc: "Exportar e apagar" },
  { id: "iphone",     icon: Smartphone, label: "Atalho iPhone",  desc: "Integração iOS" },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

function ConfiguracoesPageContent() {
  const searchParams = useSearchParams();
  const [section, setSection] = useState("plano");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", icone: "", cor: "#60A5FA", tipo: "gasto" as "gasto" | "renda", limite_mensal: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>("/categorias", { params: { limit: 200 } });
      setCategorias(res.data.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  useEffect(() => {
    const s = searchParams.get("secao");
    if (s && NAV_ITEMS.some((i) => i.id === s)) setSection(s);
  }, [searchParams]);

  function openCreate() {
    setEditing(null);
    setForm({ nome: "", icone: "", cor: "#60A5FA", tipo: "gasto", limite_mensal: "" });
    setDialogOpen(true);
  }

  function openEdit(cat: Categoria) {
    setEditing(cat);
    setForm({ nome: cat.nome, icone: cat.icone ?? "", cor: cat.cor ?? "#60A5FA", tipo: cat.tipo, limite_mensal: cat.limite_mensal != null ? String(cat.limite_mensal) : "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      // "1.234,56" → "1234.56" (remove separador de milhar, vírgula vira ponto)
      const limite = form.limite_mensal.trim().replace(/\./g, "").replace(",", ".");
      const payload = {
        nome: form.nome.trim(), tipo: form.tipo,
        cor: form.cor || undefined, icone: form.icone.trim() || undefined,
        limite_mensal: limite ? Number(limite) : null,
      };
      if (editing) { await api.put(`/categorias/${editing.id}`, payload); toast.success("Categoria atualizada"); }
      else { await api.post("/categorias", payload); toast.success("Categoria criada"); }
      setDialogOpen(false);
      fetchCategorias();
    } catch { toast.error("Erro ao salvar categoria"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/categorias/${deleteId}`);
      toast.success("Categoria excluída");
      setDeleteId(null);
      fetchCategorias();
    } catch { toast.error("Erro ao excluir categoria"); }
    finally { setDeleting(false); }
  }

  return (
    <PageShell contentClassName="space-y-6">
      {/* Page header */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="h-px w-full bg-gradient-to-r from-slate-500/60 via-slate-400/20 to-transparent" />
        <div className="flex flex-col items-center justify-center gap-3 p-5 text-center sm:flex-row sm:justify-start sm:text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/15 ring-1 ring-slate-400/20">
            <Settings className="h-4 w-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-none text-white">Configurações</h1>
            <p className="mt-1 text-xs text-white/40">Personalize sua conta</p>
          </div>
        </div>
      </div>

      {/* Mobile nav — horizontal pills above content */}
      <div className="flex sm:hidden gap-1.5 mb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                active ? "border-white/20 bg-white/[0.08] text-white" : "border-white/10 text-white/45 hover:text-white/70"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{item.label}
            </button>
          );
        })}
      </div>

      {/* Painel de fundo: separa as opções do fundo animado escolhido em Aparência */}
      <div className="ui-panel flex gap-5 p-3 sm:p-5">
        {/* ── Desktop sidebar nav ── */}
        <nav className="hidden sm:flex w-48 shrink-0 flex-col gap-0.5 pt-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                  active ? "bg-white/[0.07] text-white" : "text-white/45 hover:text-white/70 hover:bg-white/[0.03]"
                )}
              >
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", active ? "text-white/80" : "text-white/35")} />
                <div>
                  <p className="text-xs font-semibold leading-none">{item.label}</p>
                  <p className={cn("text-[10px] mt-1 leading-none", active ? "text-white/40" : "text-white/25")}>{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* ── Content — full width on mobile ── */}
        <div className="flex-1 min-w-0 w-full">
          {section === "plano" && <AssinaturaSection />}
          {section === "categorias" && (
            <CategoriasSection
              categorias={categorias}
              loading={loading}
              loadError={loadError}
              onRefetch={fetchCategorias}
              onEdit={openEdit}
              onCreate={openCreate}
            />
          )}
          {section === "lancamentos" && <LancamentosSection />}
          {section === "telas" && <TelasSection />}
          {section === "alertas" && <AlertasSection />}
          {section === "aparencia" && <AparenciaSection />}
          {section === "dados" && <DadosSection />}
          {section === "iphone" && <IphoneSection />}
        </div>
      </div>

      {/* ── Dialog criar/editar ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-nome">Nome</Label>
              <Input id="cat-nome" placeholder="Ex: Pets" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-icone">Ícone (emoji)</Label>
              <Input id="cat-icone" placeholder="Ex: 🐾" value={form.icone} onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))} className="text-lg" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as "gasto" | "renda" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasto">Gasto</SelectItem>
                  <SelectItem value="renda">Renda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-limite">Teto mensal (opcional)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/30">R$</span>
                <Input id="cat-limite" inputMode="decimal" placeholder="Ex: 800,00" value={form.limite_mensal}
                  onChange={(e) => setForm((f) => ({ ...f, limite_mensal: e.target.value }))} className="pl-9 tabular-nums" />
              </div>
              <p className="text-xs text-white/35">O sino avisa quando os gastos do mês passarem desse valor.</p>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, cor: c }))}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: form.cor === c ? "white" : "transparent" }} />
                  ))}
                </div>
                <input type="color" value={form.cor} onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                  className="h-8 w-10 cursor-pointer rounded border border-white/20 bg-transparent p-0.5" title="Cor personalizada" />
              </div>
              <p className="text-xs text-white/35">{form.cor}</p>
            </div>
          </div>

          <DialogFooter className="flex-row items-center">
            {editing && (
              <Button variant="ghost" className="mr-auto text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                onClick={() => { setDialogOpen(false); setDeleteId(editing.id); }} disabled={saving}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />Excluir
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}
              className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ConfiguracoesPageFallback() {
  return (
    <PageShell contentClassName="space-y-6">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="flex gap-5">
        <Skeleton className="hidden h-64 w-48 shrink-0 rounded-xl sm:block" />
        <Skeleton className="h-64 flex-1 rounded-xl" />
      </div>
    </PageShell>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<ConfiguracoesPageFallback />}>
      <ConfiguracoesPageContent />
    </Suspense>
  );
}
