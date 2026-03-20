"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface DataPoint {
  forma_pagamento: string;
  quantidade: number;
  total: number;
}

interface Props {
  data: DataPoint[];
}

const FORMA_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Crédito",
  cartao_debito: "Débito",
  pix: "PIX",
  transferencia: "Transf.",
  outro: "Outro",
};

const BAR_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FormaPagamentoChart({ data }: Props) {
  if (!data.length)
    return <p className="text-slate-400 text-sm text-center py-8">Sem dados</p>;

  const mapped = data.map((d) => ({
    ...d,
    label: FORMA_LABELS[d.forma_pagamento] ?? d.forma_pagamento,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={mapped}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(v: number) => formatBRL(v)} />
        <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
          {mapped.map((_, index) => (
            <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
