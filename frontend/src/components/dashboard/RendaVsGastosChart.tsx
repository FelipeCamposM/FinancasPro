"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export function RendaVsGastosChart({ data }: Props) {
  if (!data.length)
    return <p className="text-slate-400 text-sm text-center py-8">Sem dados</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMes}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickFormatter={(v) => `R$ ${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(v: number) => formatBRL(v)}
          labelFormatter={formatMes}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="total_renda"
          name="Renda"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="total_gastos"
          name="Gastos"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
