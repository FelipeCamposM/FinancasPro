"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DataPoint {
  mes: string;
  total_renda: number;
  total_gastos: number;
}

interface Props {
  data: DataPoint[];
}

function formatMes(mes: string) {
  try {
    return format(parseISO(mes + "-01"), "MMM/yy", { locale: ptBR });
  } catch {
    return mes;
  }
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg text-sm min-w-[190px]">
      <p className="font-medium text-foreground mb-2 capitalize">
        {formatMes(label ?? "")}
      </p>
      {payload.map(
        (p: {
          name: string;
          value: number;
          color: string;
          dataKey: string;
        }) => (
          <div
            key={p.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-semibold tabular-nums">
              {formatBRL(p.value)}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

export function RendaVsGastosChart({ data }: Props) {
  if (!data.length)
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        Sem dados para exibir
      </p>
    );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gradRenda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMes}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dx={-4}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Area
          type="monotone"
          dataKey="total_renda"
          name="Renda"
          stroke="#22c55e"
          strokeWidth={2.5}
          fill="url(#gradRenda)"
          dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 6, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="total_gastos"
          name="Gastos"
          stroke="#f43f5e"
          strokeWidth={2.5}
          fill="url(#gradGastos)"
          dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }}
          activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
