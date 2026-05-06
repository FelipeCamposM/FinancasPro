import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "blue" | "rose" | "amber" | "violet" | "green" | "slate";

const toneStyles: Record<
  StatTone,
  { value: string; iconWrap: string; iconColor: string }
> = {
  blue: {
    value: "text-blue-400",
    iconWrap: "bg-blue-500/[0.16] group-hover:bg-blue-500/25",
    iconColor: "text-blue-400",
  },
  rose: {
    value: "text-rose-400",
    iconWrap: "bg-rose-500/[0.16] group-hover:bg-rose-500/25",
    iconColor: "text-rose-400",
  },
  amber: {
    value: "text-amber-400",
    iconWrap: "bg-amber-500/[0.16] group-hover:bg-amber-500/25",
    iconColor: "text-amber-400",
  },
  violet: {
    value: "text-violet-400",
    iconWrap: "bg-violet-500/[0.16] group-hover:bg-violet-500/25",
    iconColor: "text-violet-400",
  },
  green: {
    value: "text-green-400",
    iconWrap: "bg-green-500/[0.16] group-hover:bg-green-500/25",
    iconColor: "text-green-400",
  },
  slate: {
    value: "text-slate-300",
    iconWrap: "bg-white/[0.08] group-hover:bg-white/[0.12]",
    iconColor: "text-slate-300",
  },
};

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  tone?: StatTone;
  valueClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  description,
  icon,
  tone = "blue",
  valueClassName,
  className,
}: StatCardProps) {
  const palette = toneStyles[tone];

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-soft",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* DS: 10px uppercase tracking-[0.12em] */}
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
              {label}
            </p>
            {/* DS: BebasNeue display font, tabular-nums */}
            <p
              className={cn(
                "truncate font-display text-3xl ds-numeric leading-none",
                palette.value,
                valueClassName,
              )}
            >
              {value}
            </p>
            {description ? (
              <p className="mt-1.5 text-[11px] text-white/45">{description}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "shrink-0 rounded-[9px] p-2.5 transition-colors",
              palette.iconWrap,
              palette.iconColor,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
