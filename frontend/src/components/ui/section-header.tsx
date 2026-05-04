import * as React from "react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl",
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1
          className={cn(
            "text-2xl font-bold leading-tight text-white",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-white/60">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
