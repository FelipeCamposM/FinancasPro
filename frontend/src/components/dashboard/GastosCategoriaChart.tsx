"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface DataPoint {
  categoria_id?: number;
  nome?: string;
  /** API `/dashboard/gastos-por-categoria` envia `categoria` em vez de `nome`. */
  categoria?: string;
  cor: string;
  icone?: string;
  quantidade: number;
  total: number;
}

interface Props {
  data: DataPoint[];
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function rowLabel(d: DataPoint): string {
  const n = (d.nome && d.nome.trim()) || d.categoria || "Sem categoria";
  return n;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: DataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const row = d.payload;
  if (!row) return null;
  const nome = rowLabel(row);
  return (
    <div className="min-w-[160px] rounded-lg border border-white/15 bg-black/70 px-3 py-2.5 text-sm shadow-lg backdrop-blur-xl">
      <p className="mb-1.5 font-semibold text-white">{nome}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-white/50">Total</span>
        <span className="font-semibold tabular-nums text-white">
          {formatBRL(Number(d.value ?? 0))}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-4">
        <span className="text-white/50">Qtd.</span>
        <span className="font-semibold text-white">
          {row.quantidade}
        </span>
      </div>
    </div>
  );
}

export function GastosCategoriaChart({ data }: Props) {
  if (!data.length)
    return (
      <p className="py-12 text-center text-sm text-white/40">
        Sem dados para exibir
      </p>
    );

  const chartData = data.map((d) => ({
    ...d,
    nome: rowLabel(d),
  }));

  const total = chartData.reduce((s, d) => s + Number(d.total), 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={100}
              paddingAngle={2}
              strokeWidth={0}
              labelLine={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
              label={({
                name,
                percent,
              }: {
                name: string;
                percent: number;
              }) => {
                const p = percent ?? 0;
                if (p < 0.045) return "";
                const raw = String(name || "");
                const short =
                  raw.length > 14 ? `${raw.slice(0, 14)}…` : raw;
                return `${short} (${(p * 100).toFixed(0)}%)`;
              }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.cor || `hsl(${(index * 47) % 360}, 65%, 55%)`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold tabular-nums leading-tight text-white">
            {formatBRL(total)}
          </span>
          <span className="text-xs text-white/50">Total</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-1">
        {chartData.map((entry, i) => {
          const pct =
            total > 0
              ? ((Number(entry.total) / total) * 100).toFixed(1)
              : "0.0";
          return (
            <div key={i} className="flex min-w-0 max-w-[200px] items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.cor || "#94a3b8" }}
              />
              <span className="truncate text-xs text-white/80" title={entry.nome}>
                {entry.nome}
              </span>
              <span className="shrink-0 text-xs text-white/45">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
