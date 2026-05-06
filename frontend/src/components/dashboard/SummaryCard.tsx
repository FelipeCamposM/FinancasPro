import { cn } from "@/lib/utils";

type SummaryTone = "blue" | "rose" | "amber" | "violet" | "green" | "slate";

const toneMap: Record<SummaryTone, { value: string; iconWrap: string; iconColor: string }> = {
  blue:   { value: "text-blue-400",   iconWrap: "bg-blue-500/[0.16]",   iconColor: "text-blue-400"   },
  rose:   { value: "text-rose-400",   iconWrap: "bg-rose-500/[0.16]",   iconColor: "text-rose-400"   },
  amber:  { value: "text-amber-400",  iconWrap: "bg-amber-500/[0.16]",  iconColor: "text-amber-400"  },
  violet: { value: "text-violet-400", iconWrap: "bg-violet-500/[0.16]", iconColor: "text-violet-400" },
  green:  { value: "text-green-400",  iconWrap: "bg-green-500/[0.16]",  iconColor: "text-green-400"  },
  slate:  { value: "text-slate-300",  iconWrap: "bg-white/[0.08]",      iconColor: "text-slate-300"  },
};

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: SummaryTone;
  className?: string;
}

import React from "react";

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color = "slate",
  className,
}: Props) {
  const t = toneMap[color];
  return (
    <div
      className={cn(
        "rounded-[0.9rem] border border-white/[0.13] bg-gradient-to-br from-white/[0.09] to-white/[0.03]",
        "p-5 backdrop-blur-[18px] transition-all duration-200 hover:-translate-y-0.5",
        "shadow-glass-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
            {title}
          </p>
          <p className={cn("font-display text-3xl leading-none ds-numeric", t.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-[11px] text-white/45">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn("shrink-0 rounded-[9px] p-2.5", t.iconWrap, t.iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
