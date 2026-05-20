"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, Crown, UserCheck, FlaskConical, ChevronLeft, ChevronRight, Search, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminStats {
  total: number;
  premium: number;
  free: number;
  admin: number;
  trial_ativo: number;
  novos_30d: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  user_level: "free" | "premium" | "admin";
  subscription_plan: string | null;
  email_verified: boolean;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
}

// Derives the logical "action key" shown in the select from DB state
function deriveActionKey(u: AdminUser): string {
  if (u.user_level === "admin") return "admin";
  if (u.user_level === "free") return "free";
  if (u.subscription_plan === "courtesy") return "courtesy";
  return "premium";
}

const ACTION_LABELS: Record<string, string> = {
  free:     "Free",
  courtesy: "Premium Cortesia",
  premium:  "Premium",
  admin:    "Admin",
  mensal:   "Assinatura Mensal",
  anual:    "Assinatura Anual",
};

const LEVEL_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  admin:   { label: "Admin",   variant: "destructive" },
  premium: { label: "Premium", variant: "default" },
  free:    { label: "Free",    variant: "secondary" },
};

function CourtesyBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
      <Crown className="h-2.5 w-2.5" />Cortesia
    </span>
  );
}

function fmt(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  plan: "mensal" | "anual";
}

function CheckoutDialog({ open, onClose, url, plan }: CheckoutDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Link de Assinatura {plan === "mensal" ? "Mensal" : "Anual"}</DialogTitle>
          <DialogDescription>
            {plan === "mensal" ? "R$9,90/mês" : "R$94,90/ano"} · 7 dias grátis (se elegível). Compartilhe com o usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 overflow-hidden">
            <code className="block text-xs text-muted-foreground break-all">{url}</code>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleCopy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(url, "_blank")}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [stats,    setStats]    = useState<AdminStats | null>(null);
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [level,    setLevel]    = useState("todos");
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [checkoutDialog, setCheckoutDialog] = useState<{
    open: boolean; url: string; plan: "mensal" | "anual";
  }>({ open: false, url: "", plan: "mensal" });

  const limit      = 15;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    if (!userLoading && user?.user_level !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, userLoading, router]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: AdminStats }>("/admin/stats");
      setStats(data.data);
    } catch { /* silently fail */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(level !== "todos" && { level }),
      });
      const { data } = await api.get<{ data: AdminUser[]; pagination: { total: number } }>(
        `/admin/users?${params}`,
      );
      setUsers(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, [page, search, level]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);
  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  async function handleAction(userId: string, action: string) {
    setUpdating(userId);
    try {
      if (action === "mensal" || action === "anual") {
        const { data } = await api.post<{ url: string }>(
          `/admin/users/${userId}/checkout`,
          { plan: action === "mensal" ? "monthly" : "annual" },
        );
        setCheckoutDialog({ open: true, url: data.url, plan: action });
      } else {
        await api.patch(`/admin/users/${userId}/level`, { user_level: action });
        toast.success("Perfil atualizado com sucesso");
        void fetchUsers();
        void fetchStats();
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? "Erro ao executar ação");
    } finally {
      setUpdating(null);
    }
  }

  if (userLoading || user?.user_level !== "admin") return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
        <p className="text-sm text-muted-foreground">Gerencie usuários e acesso à plataforma</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total usuários", value: stats.total,       icon: Users,        color: "text-primary" },
            { label: "Premium",        value: stats.premium,     icon: Crown,        color: "text-amber-400" },
            { label: "Trial ativo",    value: stats.trial_ativo, icon: FlaskConical, color: "text-violet-400" },
            { label: "Novos (30d)",    value: stats.novos_30d,   icon: UserCheck,    color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 shrink-0 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={level} onValueChange={(v) => { setLevel(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border/60">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nível</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Trial até</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Assinatura até</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Cadastro</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.subscription_plan === "courtesy" ? (
                      <CourtesyBadge />
                    ) : (
                      <Badge variant={LEVEL_BADGE[u.user_level]?.variant ?? "secondary"}>
                        {LEVEL_BADGE[u.user_level]?.label ?? u.user_level}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmt(u.trial_ends_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{fmt(u.subscription_ends_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{fmt(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {updating === u.id ? (
                      <div className="flex h-8 w-36 items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <Select
                        value={deriveActionKey(u)}
                        onValueChange={(v) => handleAction(u.id, v)}
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="courtesy">Premium Cortesia</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="mensal">⚡ Assinatura Mensal</SelectItem>
                          <SelectItem value="anual">⚡ Assinatura Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {total} usuário{total !== 1 ? "s" : ""} — página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">Legenda de ações</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-start gap-1.5">
              <span className="font-mono text-foreground/60">{label}:</span>
              <span>
                {key === "free"     && "Remove acesso premium imediatamente."}
                {key === "courtesy" && "Premium permanente sem cobrança. Nunca expira."}
                {key === "premium"  && "Premium manual (override). Sem data de expiração."}
                {key === "admin"    && "Acesso total à plataforma e ao painel admin."}
                {key === "mensal"   && "Gera link de checkout mensal (R$9,90/mês) para o usuário completar."}
                {key === "anual"    && "Gera link de checkout anual (R$94,90/ano) para o usuário completar."}
              </span>
            </div>
          ))}
        </div>
      </div>

      <CheckoutDialog
        open={checkoutDialog.open}
        onClose={() => setCheckoutDialog((s) => ({ ...s, open: false }))}
        url={checkoutDialog.url}
        plan={checkoutDialog.plan}
      />
    </div>
  );
}
