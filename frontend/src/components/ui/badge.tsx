import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // ── Shadcn defaults (mantidos para compatibilidade) ──
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "border-white/20 text-foreground bg-white/[0.06]",

        // ── DS Valora — módulos e status ──
        blue:
          "bg-blue-500/[0.14] border-blue-400/30 text-blue-300",
        rose:
          "bg-rose-500/[0.14] border-rose-400/30 text-rose-300",
        amber:
          "bg-amber-500/[0.14] border-amber-400/30 text-amber-300",
        violet:
          "bg-violet-500/[0.14] border-violet-400/30 text-violet-300",
        green:
          "bg-green-500/[0.14] border-green-400/30 text-green-300",
        slate:
          "bg-white/[0.07] border-white/15 text-white/50",

        // ── Status aliases ──
        pending:   "bg-amber-500/[0.14] border-amber-400/30 text-amber-300",
        paid:      "bg-blue-500/[0.14]  border-blue-400/30  text-blue-300",
        cancelled: "bg-rose-500/[0.14]  border-rose-400/30  text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
