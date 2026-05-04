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
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#64748b",
];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg text-sm min-w-[160px]">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold tabular-nums">
          {formatBRL(payload[0].value)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-muted-foreground">Transações</span>
        <span className="font-semibold">{payload[0].payload.quantidade}</span>
      </div>
    </div>
  );
}

export function FormaPagamentoChart({ data }: Props) {
  if (!data.length)
    return (
      <p className="text-muted-foreground text-sm text-center py-12">
        Sem dados para exibir
      </p>
    );

  const mapped = data.map((d) => ({
    ...d,
    label: FORMA_LABELS[d.forma_pagamento] ?? d.forma_pagamento,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={mapped}
        layout="vertical"
        margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="currentColor"
          strokeOpacity={0.1}
        />
        <XAxis
          type="number"
          tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={62}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "currentColor", opacity: 0.05 }}
        />
        <Bar dataKey="total" name="Total" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {mapped.map((_, index) => (
            <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
