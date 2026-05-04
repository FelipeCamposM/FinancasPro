import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatTone = "blue" | "rose" | "amber" | "violet" | "slate";

const toneStyles: Record<
  StatTone,
  { value: string; iconWrap: string; iconColor: string }
> = {
  blue: {
    value: "text-blue-400",
    iconWrap: "bg-blue-500/10 group-hover:bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  rose: {
    value: "text-rose-400",
    iconWrap: "bg-rose-500/10 group-hover:bg-rose-500/20",
    iconColor: "text-rose-400",
  },
  amber: {
    value: "text-amber-400",
    iconWrap: "bg-amber-500/10 group-hover:bg-amber-500/20",
    iconColor: "text-amber-400",
  },
  violet: {
    value: "text-violet-400",
    iconWrap: "bg-violet-500/10 group-hover:bg-violet-500/20",
    iconColor: "text-violet-400",
  },
  slate: {
    value: "text-slate-300",
    iconWrap: "bg-slate-500/10 group-hover:bg-slate-500/20",
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
        "group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "truncate text-2xl font-bold tabular-nums",
                palette.value,
                valueClassName,
              )}
            >
              {value}
            </p>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "shrink-0 rounded-xl p-2.5 transition-colors",
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
