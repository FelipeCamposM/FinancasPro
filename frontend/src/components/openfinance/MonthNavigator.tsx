"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** `'2026-09-01'` → `{ ano: 2026, mes: 8 }` sem passar por Date (evita fuso). */
const partes = (competencia: string) => ({
  ano: Number(competencia.slice(0, 4)),
  mes: Number(competencia.slice(5, 7)) - 1,
});

const montar = (ano: number, mes: number): string => {
  const d = new Date(Date.UTC(ano, mes, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

export const rotuloMes = (competencia: string, longo = false): string => {
  const { ano, mes } = partes(competencia);
  return longo
    ? `${MESES_LONGOS[mes]} ${ano}`
    : `${MESES[mes]} ${ano}`;
};

interface MonthNavigatorProps {
  value: string;
  onChange: (competencia: string) => void;
  /** Meses que têm dado, para destacar no seletor. */
  disponiveis?: string[];
  /** Meses que só têm parcela projetada, marcados com um ponto. */
  projetados?: string[];
  className?: string;
}

export function MonthNavigator({
  value,
  onChange,
  disponiveis = [],
  projetados = [],
  className,
}: MonthNavigatorProps) {
  const [aberto, setAberto] = useState(false);
  const atual = value ? partes(value) : partes(montar(new Date().getFullYear(), new Date().getMonth()));
  const [anoPicker, setAnoPicker] = useState(atual.ano);

  const temDado = new Set(disponiveis.map((c) => c.slice(0, 7)));
  const temProjecao = new Set(projetados.map((c) => c.slice(0, 7)));

  const mover = (delta: number) => onChange(montar(atual.ano, atual.mes + delta));

  return (
    <div
      className={cn(
        "flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Mês anterior"
        onClick={() => mover(-1)}
        className="flex h-9 w-9 items-center justify-center border-r border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover
        open={aberto}
        onOpenChange={(v) => {
          setAberto(v);
          if (v) setAnoPicker(atual.ano);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 min-w-[140px] items-center justify-center px-3 text-sm font-semibold capitalize text-white/80 transition-colors hover:bg-white/[0.04] focus-visible:outline-none"
          >
            {value ? rotuloMes(value) : "—"}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="ui-popover w-60 border-white/[0.14] p-3 ui-glass-surface-strong"
          align="center"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setAnoPicker((a) => a - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-white">{anoPicker}</span>
            <button
              type="button"
              onClick={() => setAnoPicker((a) => a + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {MESES.map((label, i) => {
              const comp = montar(anoPicker, i);
              const chave = comp.slice(0, 7);
              const selecionado = atual.ano === anoPicker && atual.mes === i;
              const comDado = temDado.has(chave);
              const soProjecao = !comDado && temProjecao.has(chave);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    onChange(comp);
                    setAberto(false);
                  }}
                  className={cn(
                    "relative rounded-lg py-1.5 text-xs font-medium transition-colors",
                    selecionado
                      ? "bg-rose-500/30 text-rose-300 ring-1 ring-rose-400/40"
                      : comDado || soProjecao
                        ? "text-white/70 hover:bg-white/10 hover:text-white/90"
                        : "text-white/25 hover:bg-white/5",
                  )}
                >
                  {label}
                  {/* Ponto azul = mês que só tem parcela projetada. */}
                  {soProjecao && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-2.5 flex items-center gap-1.5 border-t border-white/[0.07] pt-2 text-[11px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            mês só com parcela projetada
          </p>
        </PopoverContent>
      </Popover>

      <button
        type="button"
        aria-label="Próximo mês"
        onClick={() => mover(1)}
        className="flex h-9 w-9 items-center justify-center border-l border-white/10 text-white/40 transition-colors hover:bg-white/[0.07] hover:text-white/80"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
