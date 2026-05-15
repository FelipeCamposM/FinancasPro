"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageDataState } from "@/components/ui/page-data-state";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Cofrinho, CofrinhoDialog, CofrinhoTipo } from "./CofrinhoDialog";
import { DepositarDialog } from "./DepositarDialog";

interface PaginatedResponse {
  data: Cofrinho[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SummaryResponse {
  data: {
    total_guardado: number;
    total_acoes: number;
    total_contas: number;
    total_itens: number;
    total_itens_acoes: number;
    total_itens_contas: number;
  };
}

const tipoInfo = {
  conta: {
    label: "Contas",
    singular: "conta",
    icon: Landmark,
    badge: "blue" as const,
    color: "text-blue-300",
    button:
      "border-blue-400/40 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200",
    depositButton:
      "border-blue-400/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20",
  },
  acao: {
    label: "Ações",
    singular: "ação",
    icon: TrendingUp,
    badge: "green" as const,
    color: "text-emerald-300",
    button:
      "border-emerald-400/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200",
    depositButton:
      "border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
  },
} as const;

const tabs: CofrinhoTipo[] = ["conta", "acao"];

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value + "T00:00:00").toLocaleDateString("pt-BR");
}

function getProgress(cofrinho: Cofrinho) {
  if (!cofrinho.meta_valor) return 0;
  return Math.min(100, (Number(cofrinho.saldo_atual || 0) / Number(cofrinho.meta_valor)) * 100);
}

export default function CofrinhosPage() {
  const [activeTab, setActiveTab] = useState<CofrinhoTipo>("conta");
  const [items, setItems] = useState<Cofrinho[]>([]);
  const [summary, setSummary] = useState<SummaryResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Cofrinho | null>(null);
  const [depositarCofrinho, setDepositarCofrinho] = useState<Cofrinho | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentInfo = tipoInfo[activeTab];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse>("/cofrinhos", {
        params: { tipo: activeTab, limit: 100 },
      });
      setItems(data.data);
      setLoadError(false);
    } catch {
      setLoadError(true);
      toast.error("Erro ao carregar cofrinhos");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.get<SummaryResponse>("/cofrinhos/summary");
      setSummary(data.data);
    } catch {
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const displayedItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) =>
      [item.nome, item.ticker, item.instituicao, item.observacoes]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [items, search]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/cofrinhos/${deleteId}`);
      toast.success("Cofrinho excluído");
      setDeleteId(null);
      fetchItems();
      fetchSummary();
    } catch {
      toast.error("Erro ao excluir cofrinho");
    } finally {
      setDeleting(false);
    }
  }

  function onRefresh() {
    fetchItems();
    fetchSummary();
  }

  return (
    <PageShell contentClassName="space-y-5">
      <SectionHeader
        title="Cofrinhos"
        titleColor="text-emerald-400"
        description="Planeje aonde sua grana vai ficar guardada"
        actions={
          <Button
            onClick={() => {
              setSelected(null);
              setDialogOpen(true);
            }}
            className={`border ${currentInfo.button}`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova {currentInfo.singular}
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 ui-stagger">
        <Card className="rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-500/20 p-2.5">
              <PiggyBank className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                Total guardado
              </p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="text-xl font-bold tabular-nums text-emerald-300">
                  {formatCurrency(summary?.total_guardado)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-500/20 p-2.5">
              <Landmark className="h-5 w-5 text-blue-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                Em contas
              </p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="text-xl font-bold tabular-nums text-blue-300">
                  {formatCurrency(summary?.total_contas)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-violet-500/20 p-2.5">
              <TrendingUp className="h-5 w-5 text-violet-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                Em ações
              </p>
              {loadingSummary ? (
                <Skeleton className="mt-1 h-6 w-28" />
              ) : (
                <p className="text-xl font-bold tabular-nums text-violet-300">
                  {formatCurrency(summary?.total_acoes)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as CofrinhoTipo);
          setSearch("");
        }}
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="grid h-auto grid-cols-2 gap-1 bg-white/[0.05] p-1">
            {tabs.map((tab) => {
              const info = tipoInfo[tab];
              const Icon = info.icon;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="gap-2 rounded-lg px-3 py-2 data-[state=active]:bg-white/[0.12]"
                >
                  <Icon className={`h-4 w-4 ${info.color}`} />
                  {info.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="relative min-w-0 lg:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
            <Input
              placeholder="Buscar cofrinho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0 space-y-3">
            {loading ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card
                    key={i}
                    className="rounded-xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-xl"
                  >
                    <CardContent className="space-y-4 p-5">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-8 w-40" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : loadError ? (
              <PageDataState
                mode="error"
                icon={AlertTriangle}
                title="Não foi possível carregar os cofrinhos"
                description="Ocorreu um erro ao carregar a listagem."
                onAction={fetchItems}
              />
            ) : displayedItems.length === 0 ? (
              <PageDataState
                mode="empty"
                icon={PiggyBank}
                title="Nenhum cofrinho encontrado"
                description={
                  tab === "conta"
                    ? "Cadastre contas para controlar seu saldo."
                    : "Cadastre ações para acompanhar suas cotas."
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 ui-stagger">
                {displayedItems.map((item) => {
                  const info = tipoInfo[item.tipo];
                  const Icon = info.icon;
                  const progress = getProgress(item);
                  return (
                    <Card
                      key={item.id}
                      className="rounded-xl border border-white/[0.09] bg-white/[0.04] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.16]"
                    >
                      <CardContent className="space-y-4 p-5">
                        {/* Cabeçalho do card */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Badge variant={info.badge}>
                              <Icon className="h-3 w-3" />
                              {info.singular}
                            </Badge>
                            <h2 className="mt-3 truncate text-lg font-semibold text-white">
                              {item.nome}
                            </h2>
                            <p className="text-xs text-white/45">
                              {item.tipo === "acao"
                                ? `${item.ticker} · ${Number(item.quantidade_cotas ?? 0).toLocaleString("pt-BR")} cotas`
                                : item.instituicao || "Conta manual"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 text-white/40 hover:text-white/80 ${
                                item.tipo === "conta"
                                  ? "hover:bg-blue-500/10"
                                  : "hover:bg-emerald-500/10"
                              }`}
                              title="Depositar / adicionar cotas"
                              onClick={() => setDepositarCofrinho(item)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:bg-white/10 hover:text-white/80"
                              onClick={() => {
                                setSelected(item);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/40 hover:bg-rose-500/10 hover:text-rose-300"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Saldo */}
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                            {item.tipo === "acao" ? "Total em ações" : "Saldo"}
                          </p>
                          <p className={`mt-1 text-2xl font-bold tabular-nums ${info.color}`}>
                            {formatCurrency(item.saldo_atual)}
                          </p>
                          {item.tipo === "acao" && item.valor_cota && (
                            <p className="text-xs text-white/35">
                              {Number(item.quantidade_cotas ?? 0).toLocaleString("pt-BR")} cotas ×{" "}
                              {formatCurrency(item.valor_cota)}
                            </p>
                          )}
                        </div>

                        {/* Progresso da meta (opcional) */}
                        {item.meta_valor && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-white/45">
                                Meta {formatCurrency(item.meta_valor)}
                                {item.data_alvo ? ` · até ${formatDate(item.data_alvo)}` : ""}
                              </span>
                              <span className="font-semibold text-amber-300">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${Math.round(progress)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.observacoes && (
                          <p className="line-clamp-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-white/45">
                            {item.observacoes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CofrinhoDialog
        open={dialogOpen}
        tipo={activeTab}
        cofrinho={selected}
        onClose={() => setDialogOpen(false)}
        onSuccess={onRefresh}
      />

      <DepositarDialog
        cofrinho={depositarCofrinho}
        open={!!depositarCofrinho}
        onClose={() => setDepositarCofrinho(null)}
        onSuccess={onRefresh}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cofrinho?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="border border-rose-400/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
