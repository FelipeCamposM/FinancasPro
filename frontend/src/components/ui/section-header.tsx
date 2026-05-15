import * as React from "react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  titleColor?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  titleColor,
}: SectionHeaderProps) {
  const accentClass =
    titleColor?.includes("rose")
      ? "from-rose-500/60 via-rose-400/20"
      : titleColor?.includes("violet")
        ? "from-violet-500/60 via-violet-400/20"
        : titleColor?.includes("blue")
          ? "from-blue-500/60 via-blue-400/20"
          : "from-white/40 via-white/15";

  return (
    <header
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl",
        className,
      )}
    >
      <div
        className={cn("h-px w-full bg-gradient-to-r to-transparent", accentClass)}
      />
      <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="min-w-0">
          <h1
            className={cn(
              "font-display text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl",
              titleColor,
              titleClassName,
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-[12px] text-white/40">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-2 [&>button]:w-full [&>div]:w-full sm:w-auto sm:justify-end sm:[&>button]:w-auto sm:[&>div]:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
