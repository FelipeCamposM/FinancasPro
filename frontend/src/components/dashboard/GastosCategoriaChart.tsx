"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

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

export function GastosCategoriaChart({ data }: Props) {
  if (!data.length)
    return <p className="text-slate-400 text-sm text-center py-8">Sem dados</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="nome"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ nome, percent }) =>
            `${nome} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.cor || `hsl(${(index * 47) % 360}, 65%, 55%)`}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatBRL(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
