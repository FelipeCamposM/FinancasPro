"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface DataPoint {
  categoria_id?: number;
  nome: string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-white/15 bg-black/70 backdrop-blur-xl px-3 py-2.5 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-white mb-1.5">{d.name}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-white/50">Total</span>
        <span className="font-semibold tabular-nums text-white">
          {formatBRL(Number(d.value))}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-white/50">Qtd.</span>
        <span className="font-semibold text-white">{d.payload.quantidade}</span>
      </div>
    </div>
  );
}

export function GastosCategoriaChart({ data }: Props) {
  if (!data.length)
    return (
      <p className="text-white/40 text-sm text-center py-12">
        Sem dados para exibir
      </p>
    );

  const total = data.reduce((s, d) => s + Number(d.total), 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={105}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.cor || `hsl(${(index * 47) % 360}, 65%, 55%)`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Label central do donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold tabular-nums leading-tight text-white">
            {formatBRL(total)}
          </span>
          <span className="text-xs text-white/50">Total</span>
        </div>
      </div>

      {/* Legenda customizada */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-1 justify-center">
        {data.map((entry, i) => {
          const pct =
            total > 0
              ? ((Number(entry.total) / total) * 100).toFixed(1)
              : "0.0";
          return (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.cor || "#94a3b8" }}
              />
              <span className="text-xs text-white/70 truncate max-w-[90px]">
                {entry.nome}
              </span>
              <span className="text-xs text-white/40 shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
