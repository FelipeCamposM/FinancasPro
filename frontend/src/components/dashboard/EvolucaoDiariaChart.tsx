"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

export interface EvolucaoDiariaPoint {
  dia: string;
  total: number;
  quantidade: number;
  acumulado: number;
}

interface Props {
  data: EvolucaoDiariaPoint[];
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateLabel(value: unknown, pattern: string) {
  if (value == null || value === "") return "";

  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T00:00:00`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) return raw;

  return format(date, pattern);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const diario = payload.find((p: any) => p.dataKey === "total");
  const acumulado = payload.find((p: any) => p.dataKey === "acumulado");
  const qtd = diario?.payload?.quantidade ?? 0;
  return (
    <div className="rounded-lg border border-white/15 bg-black/80 backdrop-blur-xl px-3 py-2.5 shadow-lg text-sm min-w-[180px]">
      <p className="font-semibold text-white/70 mb-2 text-xs">
        {formatDateLabel(label, "dd/MM/yyyy")}
      </p>
      {diario && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/50">Gasto do dia</span>
          <span className="font-semibold tabular-nums text-rose-400">
            {formatBRL(Number(diario.value))}
          </span>
        </div>
      )}
      {acumulado && (
        <div className="flex items-center justify-between gap-4 mt-0.5">
          <span className="text-white/50">Acumulado</span>
          <span className="font-semibold tabular-nums text-violet-400">
            {formatBRL(Number(acumulado.value))}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-white/50">Transações</span>
        <span className="font-semibold text-white/70">{qtd}</span>
      </div>
    </div>
  );
}

export function EvolucaoDiariaChart({ data }: Props) {
  if (!data.length)
    return (
      <p className="text-white/40 text-sm text-center py-12">
        Sem dados para exibir
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gradDiario" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAcumulado" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="dia"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
          tickFormatter={(v) => formatDateLabel(v, "dd/MM")}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
          tickFormatter={(v) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#f43f5e"
          strokeWidth={2}
          fill="url(#gradDiario)"
          dot={false}
          activeDot={{ r: 4, fill: "#f43f5e" }}
        />
        <Area
          type="monotone"
          dataKey="acumulado"
          stroke="#8b5cf6"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          fill="url(#gradAcumulado)"
          dot={false}
          activeDot={{ r: 4, fill: "#8b5cf6" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
