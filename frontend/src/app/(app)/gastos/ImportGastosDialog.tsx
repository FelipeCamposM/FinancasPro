"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Repeat,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toCSV, downloadFile, readTextFile } from "@/lib/csv";
import {
  COLUNAS_MODELO,
  MAX_LINHAS,
  criarMapeador,
  montarPromptIA,
  processarCSV,
  type Cartao,
  type Categoria,
  type Linha,
} from "@/lib/gastos-import";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportGastosDialog({ open, onClose, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [arquivo, setArquivo] = useState<string>("");
  const [enviando, setEnviando] = useState(false);
  const [promptCopiado, setPromptCopiado] = useState(false);
  const [colado, setColado] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLinhas(null);
    setArquivo("");
    setColado("");
    Promise.all([
      api
        .get<{ data: Categoria[] }>("/categorias?tipo=gasto&limit=100")
        .catch(() => ({ data: { data: [] as Categoria[] } })),
      api
        .get<{ data: Cartao[] }>("/cartoes?limit=100")
        .catch(() => ({ data: { data: [] as Cartao[] } })),
    ]).then(([cat, cart]) => {
      setCategorias(cat.data.data ?? []);
      setCartoes(cart.data.data ?? []);
    });
  }, [open]);

  function baixarModelo() {
    const exemploCategoria = categorias[0]?.nome ?? "Alimentação";
    const exemploCartao = cartoes[0]?.apelido ?? "";
    const hoje = new Date();
    const dataEx = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;

    const linhasModelo = [
      COLUNAS_MODELO,
      ["Supermercado", "350,90", dataEx, exemploCategoria, "pix", "", "1", "compra do mês"],
      ["Uber", "28,50", dataEx, exemploCategoria, "dinheiro", "", "1", ""],
      ...(exemploCartao
        ? [
            ["Notebook", "400,00", dataEx, exemploCategoria, "cartao_credito", exemploCartao, "12", "valor da parcela, não o total"],
          ]
        : []),
    ];
    downloadFile("modelo-gastos.csv", toCSV(linhasModelo), "text/csv;charset=utf-8");
  }

  async function copiarPromptIA() {
    const texto = montarPromptIA(categorias, cartoes);
    try {
      await navigator.clipboard.writeText(texto);
      setPromptCopiado(true);
      setTimeout(() => setPromptCopiado(false), 2500);
      toast.success("Prompt copiado — cole na IA junto com seus gastos");
    } catch {
      toast.error("Não foi possível copiar. Verifique a permissão do navegador.");
    }
  }

  function processar(texto: string, origem: string) {
    try {
      const resultado = processarCSV(texto, categorias, cartoes);
      if (resultado.length > MAX_LINHAS) {
        toast.error(`Máximo de ${MAX_LINHAS} linhas por importação`);
        return;
      }
      setArquivo(origem);
      setLinhas(resultado);
    } catch (e) {
      setLinhas(null);
      toast.error(e instanceof Error ? e.message : "Não foi possível ler os dados");
    }
  }

  async function lerArquivo(file: File) {
    processar(await readTextFile(file), file.name);
  }

  function atualizarLinha(numero: number, patch: Partial<Linha>) {
    setLinhas((prev) =>
      prev
        ? prev.map((l) => (l.linha === numero ? { ...l, ...patch } : l))
        : prev,
    );
  }

  function removerLinha(numero: number) {
    setLinhas((prev) => prev?.filter((l) => l.linha !== numero) ?? prev);
  }

  /** Revalida a linha inteira com a nova categoria — corrige inclusive o erro "categoria não encontrada". */
  function trocarCategoria(l: Linha, valor: string) {
    const cat = categorias.find((c) => String(c.id) === valor);
    const mapear = criarMapeador(categorias, cartoes);
    const nova = mapear(
      { ...l.bruto, categoria: cat?.nome ?? "" },
      l.linha,
    );
    atualizarLinha(l.linha, { ...nova, assinatura: l.assinatura });
  }

  const validas = linhas?.filter((l) => l.payload) ?? [];
  const invalidas = linhas?.filter((l) => l.erros.length) ?? [];
  const comoAssinatura = validas.filter((l) => l.assinatura);
  const comoGasto = validas.filter((l) => !l.assinatura);

  async function importar() {
    if (!validas.length) return;
    setEnviando(true);
    try {
      let importados = 0;
      if (comoGasto.length) {
        const { data } = await api.post<{ data: { importados: number } }>(
          "/gastos/import",
          { gastos: comoGasto.map((l) => l.payload) },
        );
        importados = data.data.importados;
      }

      // Assinaturas não entram no lote: cada uma gera as cobranças futuras.
      for (const l of comoAssinatura) {
        const p = l.payload!;
        await api.post("/assinaturas", {
          descricao: p.descricao,
          valor: p.valor_total,
          categoria_id: p.categoria_id,
          cartao_id: p.cartao_id,
          forma_pagamento: p.forma_pagamento,
          dia_cobranca: Number(p.data_gasto.slice(8, 10)),
          data_inicio: p.data_gasto,
          observacoes: p.observacoes,
        });
      }

      const partes = [
        importados ? `${importados} gasto(s)` : "",
        comoAssinatura.length ? `${comoAssinatura.length} assinatura(s)` : "",
      ].filter(Boolean);
      toast.success(`${partes.join(" e ")} importado(s)`);
      onSuccess();
      onClose();
    } catch (e) {
      const resp = (e as { response?: { data?: { error?: string; linhas?: { linha: number; erros: string[] }[] } } }).response;
      const detalhe = resp?.data?.linhas?.[0];
      toast.error(
        detalhe
          ? `Linha ${detalhe.linha}: ${detalhe.erros[0]}`
          : resp?.data?.error ?? "Erro ao importar",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[960px] p-0 overflow-hidden gap-0">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/[0.09]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="pointer-events-none absolute -left-6 -top-6 h-28 w-28 rounded-full bg-rose-500/[0.08] blur-2xl" />
          <div className="relative flex items-start gap-4 px-6 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 ring-1 ring-rose-400/20 shadow-lg shadow-rose-500/10">
              <FileSpreadsheet className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogHeader className="space-y-0">
                <DialogTitle className="text-xl font-bold leading-none text-white">
                  Importar gastos
                </DialogTitle>
                <p className="mt-1.5 text-sm text-white/40">
                  Baixe o modelo, preencha na planilha e envie o arquivo CSV
                </p>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="max-h-[calc(100dvh-16rem)] space-y-4 overflow-y-auto px-5 py-5 sm:max-h-[60vh]">
          {/* Passo 1 — modelo */}
          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">1. Baixe o modelo</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
                Colunas: {COLUNAS_MODELO.join(", ")}. Datas em dd/mm/aaaa. Em
                gastos parcelados, informe o valor da parcela.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={baixarModelo}
                className="h-9 rounded-lg border-white/15 bg-white/[0.05] text-white/80 hover:bg-white/[0.1] hover:text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Modelo CSV
              </Button>
              <Button
                variant="outline"
                onClick={copiarPromptIA}
                title="Copia um prompt com suas categorias, cartões e todas as regras — cole em qualquer IA para gerar o CSV"
                className="h-9 rounded-lg border-violet-400/30 bg-violet-500/[0.12] text-violet-200 hover:bg-violet-500/20 hover:text-white"
              >
                {promptCopiado ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {promptCopiado ? "Copiado" : "Prompt p/ IA"}
              </Button>
            </div>
          </div>

          {/* Nomes aceitos */}
          {(categorias.length > 0 || cartoes.length > 0) && (
            <div className="space-y-2 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">
                2. Use estes nomes nas colunas
              </p>
              {categorias.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                    Categorias
                  </span>
                  {categorias.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/60"
                    >
                      {c.nome}
                    </span>
                  ))}
                </div>
              )}
              {cartoes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                    Cartões
                  </span>
                  {cartoes.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/60"
                    >
                      {c.apelido}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-white/35">
                Formas de pagamento: dinheiro, pix, transferencia,
                cartao_credito, cartao_debito, outro
              </p>
            </div>
          )}

          {/* Passo 3 — arquivo */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) lerArquivo(file);
            }}
            className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center transition-colors hover:border-rose-400/40 hover:bg-rose-500/[0.04]"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) lerArquivo(file);
                e.target.value = "";
              }}
            />
            <Upload className="mx-auto h-6 w-6 text-white/25" />
            <p className="mt-2 text-sm text-white/60">
              {arquivo || "Arraste o CSV aqui ou selecione o arquivo"}
            </p>
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="mt-3 h-9 rounded-lg border-white/15 bg-white/[0.05] text-white/80 hover:bg-white/[0.1] hover:text-white"
            >
              Selecionar arquivo
            </Button>
          </div>

          {/* Ou colar o texto direto — caminho natural para CSV gerado por IA */}
          <div className="space-y-2 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-white">
              Ou cole o texto do CSV
            </p>
            <p className="text-[11px] text-white/40">
              Cole aqui a resposta da IA ou as linhas copiadas da planilha — sem
              precisar salvar arquivo.
            </p>
            <textarea
              value={colado}
              onChange={(e) => setColado(e.target.value)}
              onPaste={(e) => {
                const texto = e.clipboardData.getData("text");
                if (texto.trim()) {
                  e.preventDefault();
                  setColado(texto);
                  processar(texto, "texto colado");
                }
              }}
              rows={4}
              spellCheck={false}
              placeholder={`descricao;valor;data;categoria;forma_pagamento;cartao;parcelas;observacoes\nSupermercado;350,90;05/01/2026;Alimentação;pix;;1;`}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-[11px] text-white/80 outline-none transition-colors placeholder:text-white/20 focus:border-rose-400/40"
            />
            <Button
              variant="outline"
              disabled={!colado.trim()}
              onClick={() => processar(colado, "texto colado")}
              className="h-9 rounded-lg border-white/15 bg-white/[0.05] text-white/80 hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
            >
              Ler texto colado
            </Button>
          </div>

          {/* Preview */}
          {linhas && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {validas.length} pronta(s) para importar
                </span>
                {comoAssinatura.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200">
                    <Repeat className="h-3.5 w-3.5" />
                    {comoAssinatura.length} como assinatura
                  </span>
                )}
                {invalidas.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {invalidas.length} com erro (serão ignoradas)
                  </span>
                )}
                <span className="ml-auto text-[11px] text-white/30">
                  Ajuste a categoria, marque{" "}
                  <Repeat className="inline h-3 w-3" /> para virar assinatura ou
                  remova a linha antes de importar.
                </span>
              </div>

              <div className="max-h-[48vh] min-h-[18rem] overflow-auto rounded-xl border border-white/[0.09]">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 z-10 bg-[#1a1420] text-white/45 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
                    <tr>
                      <th className="px-2 py-2 font-semibold">#</th>
                      <th className="px-2 py-2 font-semibold">Descrição</th>
                      <th className="px-2 py-2 font-semibold">Valor</th>
                      <th className="px-2 py-2 font-semibold">Data</th>
                      <th className="px-2 py-2 font-semibold">Categoria</th>
                      <th className="px-2 py-2 font-semibold">Pagamento</th>
                      <th className="px-2 py-2 font-semibold">Parc.</th>
                      <th
                        className="px-2 py-2 text-center font-semibold"
                        title="Lançar como assinatura recorrente mensal em vez de gasto avulso"
                      >
                        Assin.
                      </th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr
                        key={l.linha}
                        className={`border-t border-white/[0.06] ${
                          l.erros.length
                            ? "bg-rose-500/[0.07]"
                            : l.assinatura
                              ? "bg-violet-500/[0.08]"
                              : ""
                        }`}
                      >
                        <td className="px-2 py-1.5 text-white/30">{l.linha}</td>
                        <td className="px-2 py-1.5 text-white/75">
                          {l.bruto.descricao || "—"}
                          {l.erros.length > 0 && (
                            <span className="block text-[10px] text-rose-300/80">
                              {l.erros.join(" · ")}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums text-white/60">
                          {l.bruto.valor}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums text-white/60">
                          {l.bruto.data}
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={l.payload?.categoria_id ?? ""}
                            onChange={(e) => trocarCategoria(l, e.target.value)}
                            className="max-w-[9rem] rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-1 text-[11px] text-white/75 outline-none transition-colors hover:bg-white/[0.1] focus:border-rose-400/40"
                          >
                            <option value="" className="bg-neutral-900">
                              {l.bruto.categoria && !l.payload?.categoria_id
                                ? `sem categoria (${l.bruto.categoria}?)`
                                : "sem categoria"}
                            </option>
                            {categorias.map((c) => (
                              <option
                                key={c.id}
                                value={c.id}
                                className="bg-neutral-900"
                              >
                                {c.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-white/60">
                          {l.bruto.forma || "dinheiro"}
                          {l.bruto.cartao ? ` · ${l.bruto.cartao}` : ""}
                        </td>
                        <td className="px-2 py-1.5 tabular-nums text-white/60">
                          {l.assinatura ? "—" : l.bruto.parcelas || "1"}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            aria-label="Lançar como assinatura"
                            title={
                              l.assinatura
                                ? "Vai virar assinatura recorrente mensal"
                                : "Marcar como assinatura recorrente mensal"
                            }
                            onClick={() =>
                              atualizarLinha(l.linha, {
                                assinatura: !l.assinatura,
                              })
                            }
                            className={`rounded-md p-1 transition-colors ${
                              l.assinatura
                                ? "bg-violet-500/25 text-violet-200"
                                : "text-white/25 hover:bg-white/10 hover:text-white/70"
                            }`}
                          >
                            <Repeat className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            aria-label="Remover linha"
                            title="Remover linha da importação"
                            onClick={() => removerLinha(l.linha)}
                            className="rounded-md p-1 text-white/25 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.09] px-5 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-10 rounded-xl text-white/60 hover:bg-white/[0.06] hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={importar}
            disabled={!validas.length || enviando}
            className="h-10 rounded-xl border border-rose-300/30 bg-gradient-to-br from-rose-500/90 via-rose-500/75 to-rose-700/90 px-4 text-white shadow-lg shadow-rose-950/25 ring-1 ring-white/[0.10] transition-all hover:-translate-y-0.5 hover:from-rose-400/95 hover:via-rose-500/85 hover:to-rose-600/95 disabled:pointer-events-none disabled:opacity-40"
          >
            {enviando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar {validas.length || ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
