"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageDataState } from "@/components/ui/page-data-state";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  Tag,
  Lock,
  AlertTriangle,
  Smartphone,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface Categoria {
  id: number;
  nome: string;
  cor: string | null;
  icone: string | null;
  tipo: "gasto" | "renda";
  user_id: string | null;
}

interface ApiResponse {
  data: Categoria[];
  pagination: { total: number; page: number; totalPages: number };
}

const TIPO_LABELS = { gasto: "Gasto", renda: "Renda" };

const DEFAULT_COLORS = [
  "#F87171", "#FB923C", "#FBBF24", "#A3E635",
  "#34D399", "#22D3EE", "#60A5FA", "#A78BFA",
  "#F472B6", "#94A3B8",
];

function ColorDot({ cor }: { cor: string | null }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border border-white/20 shrink-0"
      style={{ background: cor ?? "#94A3B8" }}
    />
  );
}

const SHORTCUT_ICLOUD_URL = process.env.NEXT_PUBLIC_SHORTCUT_ICLOUD_URL ?? "";

function IphoneTab() {
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

  const masked = apiKey
    ? apiKey.slice(0, 8) + "••••••••••••••••••••" + apiKey.slice(-4)
    : null;

  return (
    <div className="space-y-6 max-w-lg">

      {/* Passo 1 — Baixar */}
      <Card className="border-white/[0.09] bg-white/[0.03]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 font-bold text-sm text-sky-400">
              1
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Baixar o Atalho</p>
              <p className="text-xs text-white/50 mt-0.5">
                Instala o atalho no app Atalhos do iPhone.
              </p>
            </div>
          </div>

          {SHORTCUT_ICLOUD_URL ? (
            <button
              onClick={async () => {
                if (apiKey) {
                  await navigator.clipboard.writeText(apiKey).catch(() => {});
                  toast.success("API Key copiada! Cole quando o atalho pedir.", { duration: 4000 });
                }
                window.open(SHORTCUT_ICLOUD_URL, "_blank");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-sky-400/30 bg-sky-500/20 px-4 py-2.5 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/30"
            >
              <ExternalLink className="h-4 w-4" />
              Baixar Atalho
            </button>
          ) : (
            <p className="text-center text-[11px] text-amber-400/70">
              Configure <code className="font-mono">NEXT_PUBLIC_SHORTCUT_ICLOUD_URL</code> com o link iCloud do atalho.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Passo 2 — Copiar API Key */}
      <Card className="border-white/[0.09] bg-white/[0.03]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 font-bold text-sm text-violet-400">
              2
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Configurar sua conta</p>
              <p className="text-xs text-white/50 mt-0.5">
                Copie sua API Key, abra o atalho e cole quando ele pedir.
              </p>
            </div>
          </div>

          {apiKey ? (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <code className="flex-1 text-xs font-mono text-white/70 truncate">
                {showKey ? apiKey : masked}
              </code>
              <button
                onClick={() => setShowKey((v) => !v)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleCopy}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            <div className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
          )}

          <Button
            onClick={handleCopy}
            disabled={!apiKey}
            variant="ghost"
            className="w-full bg-violet-500/20 border border-violet-400/30 text-violet-300 hover:bg-violet-500/30"
          >
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copiada!" : "Copiar API Key"}
          </Button>

          <Button
            onClick={handleRotate}
            disabled={rotating}
            variant="ghost"
            size="sm"
            className="text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 text-xs w-full"
          >
            <RefreshCw className={`mr-1.5 h-3 w-3 ${rotating ? "animate-spin" : ""}`} />
            Rotacionar key (invalida o atalho atual)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("categorias");

  // ── categorias state ──────────────────────────────────────
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | "gasto" | "renda">("todos");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: "", icone: "", cor: "#60A5FA", tipo: "gasto" as "gasto" | "renda",
  });

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>("/categorias", { params: { limit: 200 } });
      setCategorias(res.data.data);
      setTotal(res.data.pagination.total);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

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
      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        cor: form.cor || undefined,
        icone: form.icone.trim() || undefined,
      };
      if (editing) {
        await api.put(`/categorias/${editing.id}`, payload);
        toast.success("Categoria atualizada");
      } else {
        await api.post("/categorias", payload);
        toast.success("Categoria criada");
      }
      setDialogOpen(false);
      fetchCategorias();
    } catch {
      toast.error("Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/categorias/${deleteId}`);
      toast.success("Categoria excluída");
      setDeleteId(null);
      fetchCategorias();
    } catch {
      toast.error("Erro ao excluir categoria");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = categorias.filter((c) => {
    const matchTipo = filterTipo === "todos" || c.tipo === filterTipo;
    const matchSearch = !search || c.nome.toLowerCase().includes(search.toLowerCase());
    return matchTipo && matchSearch;
  });

  const userCats = filtered.filter((c) => c.user_id !== null);
  const globalCats = filtered.filter((c) => c.user_id === null);

  return (
    <PageShell contentClassName="space-y-5">
      <SectionHeader
        title="Configurações"
        titleColor="text-slate-300"
        description="Personalize a sua conta"
        actions={
          activeTab === "categorias" ? (
            <Button variant="default" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          ) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        {/* Tab bar */}
        <TabsList className="h-auto gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
          <TabsTrigger
            value="categorias"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition-all
              data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            <Tag className="mr-2 h-3.5 w-3.5" />
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="iphone"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition-all
              data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-none"
          >
            <Smartphone className="mr-2 h-3.5 w-3.5" />
            iPhone
          </TabsTrigger>
        </TabsList>

        {/* ── Categorias tab ── */}
        <TabsContent value="categorias" className="space-y-4 mt-0">
          {/* Filtros */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] max-w-xs flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Buscar categoria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="gasto">Gasto</SelectItem>
                  <SelectItem value="renda">Renda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conteúdo */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : loadError ? (
            <PageDataState
              mode="error"
              icon={AlertTriangle}
              title="Não foi possível carregar as categorias"
              description="Ocorreu um erro ao carregar a listagem."
              onAction={fetchCategorias}
            />
          ) : filtered.length === 0 ? (
            <PageDataState
              mode="empty"
              icon={Tag}
              title="Nenhuma categoria encontrada"
              description="Ajuste os filtros ou crie uma nova categoria."
            />
          ) : (
            <div className="space-y-6">
              {userCats.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                      Minhas categorias
                    </p>
                    <span className="text-[11px] text-white/25">({userCats.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ui-stagger">
                    {userCats.map((cat) => (
                      <CategoriaCard
                        key={cat.id}
                        cat={cat}
                        onClick={() => openEdit(cat)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {globalCats.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                      Categorias globais
                    </p>
                    <span className="text-[11px] text-white/25">({globalCats.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ui-stagger">
                    {globalCats.map((cat) => (
                      <CategoriaCard
                        key={cat.id}
                        cat={cat}
                        onClick={() => openEdit(cat)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="iphone" className="mt-0">
          <IphoneTab />
        </TabsContent>
      </Tabs>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-nome">Nome</Label>
              <Input
                id="cat-nome"
                placeholder="Ex: Pets"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-icone">Ícone (emoji)</Label>
              <Input
                id="cat-icone"
                placeholder="Ex: 🐾"
                value={form.icone}
                onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
                className="text-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as "gasto" | "renda" }))}
              >
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
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, cor: c }))}
                      className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ background: c, borderColor: form.cor === c ? "white" : "transparent" }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={form.cor}
                  onChange={(e) => setForm((f) => ({ ...f, cor: e.target.value }))}
                  className="h-8 w-10 cursor-pointer rounded border border-white/20 bg-transparent p-0.5"
                  title="Cor personalizada"
                />
              </div>
              <p className="text-xs text-white/40">{form.cor}</p>
            </div>
          </div>

          <DialogFooter className="flex-row items-center">
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                onClick={() => {
                  setDialogOpen(false);
                  setDeleteId(editing.id);
                }}
                disabled={saving}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Excluir
              </Button>
            )}
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-500/20 border border-rose-400/40 text-rose-300 hover:bg-rose-500/30"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function CategoriaCard({
  cat,
  onClick,
}: {
  cat: Categoria;
  onClick: () => void;
}) {
  const isGlobal = cat.user_id === null;

  return (
    <Card
      className="cursor-pointer rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
          style={{ background: (cat.cor ?? "#94A3B8") + "33" }}
        >
          {cat.icone ? <span>{cat.icone}</span> : <ColorDot cor={cat.cor} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{cat.nome}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge
              variant={cat.tipo === "gasto" ? "rose" : "blue"}
              className="text-[10px] px-1.5 py-0"
            >
              {TIPO_LABELS[cat.tipo]}
            </Badge>
            {isGlobal && (
              <Badge variant="slate" className="text-[10px] px-1.5 py-0">
                <Lock className="h-2.5 w-2.5" />
                Global
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
