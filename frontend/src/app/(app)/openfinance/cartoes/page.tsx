"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Wallet, Check, Pencil, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "@/components/ui/section-header";
import { PageDataState } from "@/components/ui/page-data-state";
import { SyncButton } from "@/components/openfinance/SyncButton";
import {
  brl,
  mesBr,
  ofApi,
  type OfCartao,
  type OfConta,
  type OfFatura,
} from "@/lib/openfinance";

const CORES = [
  "#8A05BE", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#06B6D4", "#3B82F6", "#EC4899",
];

interface PersonalizarProps {
  nomeOriginal: string;
  apelido: string | null;
  cor: string | null;
  /** Dias vindos da Pluggy: quando existem, o campo manual não é necessário. */
  diaFechamentoAuto?: number | null;
  diaVencimentoAuto?: number | null;
  diaFechamentoManual?: number | null;
  diaVencimentoManual?: number | null;
  comDatas?: boolean;
  onSalvar: (body: {
    apelido?: string;
    cor?: string;
    dia_fechamento_manual?: number;
    dia_vencimento_manual?: number;
  }) => Promise<void>;
}

function PersonalizarInline({
  nomeOriginal,
  apelido,
  cor,
  diaFechamentoAuto,
  diaVencimentoAuto,
  diaFechamentoManual,
  diaVencimentoManual,
  comDatas,
  onSalvar,
}: PersonalizarProps) {
  const [aberto, setAberto] = useState(false);
  const [novoApelido, setNovoApelido] = useState(apelido ?? "");
  const [novaCor, setNovaCor] = useState(cor ?? CORES[0]);
  const [fechamento, setFechamento] = useState(
    diaFechamentoManual?.toString() ?? diaFechamentoAuto?.toString() ?? "",
  );
  const [vencimento, setVencimento] = useState(
    diaVencimentoManual?.toString() ?? diaVencimentoAuto?.toString() ?? "",
  );
  const [salvando, setSalvando] = useState(false);

  if (!aberto) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setAberto(true)}
        className="h-8 px-2.5 text-xs"
      >
        <Pencil className="h-3.5 w-3.5" />
        Personalizar
      </Button>
    );
  }

  const diaValido = (v: string) => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
  };

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={novoApelido}
          onChange={(e) => setNovoApelido(e.target.value)}
          placeholder={nomeOriginal}
          className="h-9 w-[220px]"
          maxLength={100}
        />
        <div className="flex gap-1">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNovaCor(c)}
              aria-label={`Cor ${c}`}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20"
              style={{ backgroundColor: c }}
            >
              {novaCor === c && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {comDatas && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-white/50">
            Fecha dia
            <Input
              type="number"
              min={1}
              max={31}
              value={fechamento}
              onChange={(e) => setFechamento(e.target.value)}
              className="mt-1 h-9 w-[90px]"
            />
          </label>
          <label className="text-xs text-white/50">
            Vence dia
            <Input
              type="number"
              min={1}
              max={31}
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className="mt-1 h-9 w-[90px]"
            />
          </label>
          <p className="max-w-sm text-[11px] text-white/40">
            {diaFechamentoAuto == null
              ? "O banco não informa o fechamento por aqui — preencha à mão que fica salvo."
              : "Preenchido pelo banco; o que você digitar tem prioridade."}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={salvando}
          onClick={async () => {
            const f = diaValido(fechamento);
            const v = diaValido(vencimento);
            if (f === null || v === null) {
              toast.error("Dia deve ser um número entre 1 e 31");
              return;
            }
            setSalvando(true);
            try {
              await onSalvar({
                apelido: novoApelido.trim() || undefined,
                cor: novaCor,
                ...(comDatas
                  ? { dia_fechamento_manual: f, dia_vencimento_manual: v }
                  : {}),
              });
              setAberto(false);
            } finally {
              setSalvando(false);
            }
          }}
        >
          Salvar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAberto(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export default function OpenFinanceCartoesPage() {
  const [cartoes, setCartoes] = useState<OfCartao[]>([]);
  const [contas, setContas] = useState<OfConta[]>([]);
  const [faturas, setFaturas] = useState<Record<string, OfFatura[]>>({});
  const [competencia, setCompetencia] = useState<string>("");
  const [estado, setEstado] = useState<"loading" | "ok" | "error">("loading");

  const carregar = useCallback(async () => {
    setEstado("loading");
    try {
      const [c, ct] = await Promise.all([
        ofApi.cartoes(competencia || undefined),
        ofApi.contas(),
      ]);
      setCartoes(c);
      setContas(ct);
      const listas = await Promise.all(c.map((x) => ofApi.faturas(x.id)));
      setFaturas(Object.fromEntries(c.map((x, i) => [x.id, listas[i]])));
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  }, [competencia]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarCartao(
    id: string,
    body: Parameters<typeof ofApi.atualizarCartao>[1],
  ) {
    try {
      await ofApi.atualizarCartao(id, body);
      toast.success("Cartão atualizado");
      carregar();
    } catch {
      toast.error("Não foi possível salvar");
    }
  }

  async function salvarConta(id: string, body: { apelido?: string; cor?: string }) {
    try {
      await ofApi.atualizarConta(id, body);
      toast.success("Conta atualizada");
      carregar();
    } catch {
      toast.error("Não foi possível salvar");
    }
  }

  if (estado === "loading") return <PageDataState mode="loading" />;
  if (estado === "error") return <PageDataState mode="error" onAction={carregar} />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Cartões e contas"
        description="A fatura é a soma da competência, não o limite usado. Apelido, cor e os dias de fechamento/vencimento são seus."
        actions={<SyncButton onDone={carregar} />}
      />

      {cartoes.length === 0 && contas.length === 0 ? (
        <PageDataState
          mode="empty"
          title="Nada importado ainda"
          description="Cadastre uma conexão na aba Conexões e sincronize."
        />
      ) : (
        <>
          {cartoes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white/40">
                Cartões de crédito
              </h2>
              {cartoes.map((c) => {
                const usoPct =
                  Number(c.limite) > 0
                    ? Math.min(
                        100,
                        (Number(c.limite_usado) / Number(c.limite)) * 100,
                      )
                    : 0;
                const lista = faturas[c.id] ?? [];
                return (
                  <Card key={c.id}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-wrap items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${c.cor ?? "#8A05BE"}26` }}
                        >
                          <CreditCard
                            className="h-5 w-5"
                            style={{ color: c.cor ?? "#c084fc" }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white/90">
                            {c.apelido ?? c.nome}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/45">
                            <span className="uppercase">{c.bandeira}</span>
                            {c.ultimos_4_digitos && (
                              <span>•••• {c.ultimos_4_digitos}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              {c.dia_fechamento_efetivo
                                ? `fecha ${c.dia_fechamento_efetivo}`
                                : "fechamento não informado"}
                              {c.dia_vencimento_efetivo
                                ? ` · vence ${c.dia_vencimento_efetivo}`
                                : ""}
                            </span>
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                            Fatura {mesBr(c.competencia)}
                          </p>
                          <p className="font-display text-3xl ds-numeric leading-none text-rose-300">
                            {brl(c.fatura_atual)}
                          </p>
                          <p className="mt-1 text-[11px] text-white/45">
                            {c.lancamentos} lançamentos
                          </p>
                        </div>
                      </div>

                      {/* Encargos e estornos ficam à parte: o app do banco não
                          os soma no valor da fatura em aberto. */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Number(c.encargos) > 0 && (
                          <Badge className="border-amber-300/25 bg-amber-500/10 text-amber-200">
                            + {brl(c.encargos)} em encargos (IOF, juros)
                          </Badge>
                        )}
                        {Number(c.estornos) > 0 && (
                          <Badge className="border-emerald-300/25 bg-emerald-500/10 text-emerald-200">
                            − {brl(c.estornos)} em estornos (já descontado)
                          </Badge>
                        )}
                        {Number(c.encargos) > 0 && (
                          <Badge className="border-white/15 bg-white/[0.06] text-white/60">
                            Total com encargos{" "}
                            {brl(Number(c.fatura_atual) + Number(c.encargos))}
                          </Badge>
                        )}
                      </div>

                      {Number(c.limite) > 0 && (
                        <div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-rose-400/70"
                              style={{ width: `${usoPct}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-white/45">
                            {brl(c.limite_disponivel)} disponíveis de{" "}
                            {brl(c.limite)} · {brl(c.limite_usado)} em uso
                            (inclui compras de faturas futuras)
                          </p>
                        </div>
                      )}

                      {lista.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50">
                            Ver fatura de
                          </span>
                          <Select
                            value={competencia || lista[0].competencia.slice(0, 10)}
                            onValueChange={setCompetencia}
                          >
                            <SelectTrigger className="h-9 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {lista.map((f) => (
                                <SelectItem
                                  key={f.competencia}
                                  value={f.competencia.slice(0, 10)}
                                >
                                  {mesBr(f.competencia)} — {brl(f.fatura)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <PersonalizarInline
                        nomeOriginal={c.nome}
                        apelido={c.apelido}
                        cor={c.cor}
                        comDatas
                        diaFechamentoAuto={c.dia_fechamento}
                        diaVencimentoAuto={c.dia_vencimento}
                        diaFechamentoManual={c.dia_fechamento_manual}
                        diaVencimentoManual={c.dia_vencimento_manual}
                        onSalvar={(body) => salvarCartao(c.id, body)}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          {contas.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white/40">
                Contas bancárias
              </h2>
              {contas.map((c) => (
                <Card key={c.id}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${c.cor ?? "#22C55E"}26` }}
                      >
                        <Wallet
                          className="h-5 w-5"
                          style={{ color: c.cor ?? "#34d399" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white/90">
                          {c.apelido ?? c.nome}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
                          {c.numero && <span>{c.numero}</span>}
                          <Badge className="border-white/15 bg-white/[0.06] text-[10px] text-white/60">
                            {c.subtipo}
                          </Badge>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                          Saldo
                        </p>
                        <p className="font-display text-2xl ds-numeric leading-none text-emerald-300">
                          {brl(c.saldo)}
                        </p>
                      </div>
                    </div>

                    <PersonalizarInline
                      nomeOriginal={c.nome}
                      apelido={c.apelido}
                      cor={c.cor}
                      onSalvar={(body) => salvarConta(c.id, body)}
                    />
                  </CardContent>
                </Card>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
