interface Props {
  title: string;
  value: string;
  subtitle?: string;
  color?: "green" | "red" | "blue" | "slate";
}

const colorMap = {
  green: "bg-green-50 border-green-200 text-green-700",
  red: "bg-red-50   border-red-200   text-red-700",
  blue: "bg-blue-50  border-blue-200  text-blue-700",
  slate: "bg-slate-50 border-slate-200 text-slate-700",
};

export function SummaryCard({
  title,
  value,
  subtitle,
  color = "slate",
}: Props) {
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold mt-1 tracking-tight">{value}</p>
      {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
    </div>
  );
}
