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
  ChevronDown, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Categoria {
  id: number; nome: string; cor: string | null;
  icone: string | null; tipo: "gasto" | "renda"; user_id: string | null;
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

function IphoneSection() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    api.get<{ api_key: string }>("/shortcut/my-key")
      .then((r) => setApiKey(r.data.api_key))
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
      setApiKey(r.data.api_key);
      toast.success("API key rotacionada");
    } catch {
      toast.error("Erro ao rotacionar");
    } finally {
      setRotating(false);
    }
  }

  const masked = apiKey ? apiKey.slice(0, 8) + "••••••••••••••" + apiKey.slice(-4) : null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
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
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
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

// ─── Settings nav ─────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "categorias", icon: Tag, label: "Categorias", desc: "Tags para gastos e rendas" },
  { id: "iphone", icon: Smartphone, label: "Atalho iPhone", desc: "Integração iOS" },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

function ConfiguracoesPageContent() {
  const searchParams = useSearchParams();
  const [section, setSection] = useState("categorias");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", icone: "", cor: "#60A5FA", tipo: "gasto" as "gasto" | "renda" });
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
    setForm({ nome: "", icone: "", cor: "#60A5FA", tipo: "gasto" });
    setDialogOpen(true);
  }

  function openEdit(cat: Categoria) {
    setEditing(cat);
    setForm({ nome: cat.nome, icone: cat.icone ?? "", cor: cat.cor ?? "#60A5FA", tipo: cat.tipo });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const payload = { nome: form.nome.trim(), tipo: form.tipo, cor: form.cor || undefined, icone: form.icone.trim() || undefined };
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

      <div className="flex gap-5">
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
