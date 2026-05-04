import * as React from "react";

import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  contentClassName?: string;
}

export function PageShell({
  className,
  contentClassName,
  children,
  ...props
}: PageShellProps) {
  return (
    <div className={cn("px-4 py-6 sm:px-6 lg:px-8", className)} {...props}>
      <div
        className={cn("mx-auto w-full max-w-7xl space-y-6", contentClassName)}
      >
        {children}
      </div>
    </div>
  );
}
