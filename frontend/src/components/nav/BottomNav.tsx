"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/cartoes",
    icon: CreditCard,
    label: "Cartões",
    activeColor: "text-sky-400",
  },
  {
    href: "/gastos",
    icon: TrendingDown,
    label: "Gastos",
    activeColor: "text-rose-400",
  },
  // center CTA slot — rendered separately
  null,
  {
    href: "/renda",
    icon: TrendingUp,
    label: "Renda",
    activeColor: "text-blue-400",
  },
  {
    href: "/assinaturas",
    icon: RefreshCw,
    label: "Assinaturas",
    activeColor: "text-violet-400",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [bouncing, setBouncing] = useState(false);

  function handleCtaClick() {
    setBouncing(false);
    requestAnimationFrame(() => {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 450);
    });
    router.push("/gastos?new=1");
  }

  return (
    // Barra flutuante: fica descolada das bordas e respeita a safe area do iPhone
    <nav
      className="sm:hidden fixed inset-x-4 z-50 flex items-end justify-around
        rounded-[28px] border border-white/[0.12] bg-[hsl(222_47%_7%/0.78)]
        shadow-[0_20px_50px_-12px_rgba(2,6,23,0.95)] backdrop-blur-2xl"
      style={{ bottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      {NAV_ITEMS.map((item) => {
        if (!item) {
          return (
            <div
              key="cta"
              className="flex flex-col items-center justify-center pb-2 pt-1 -mt-7"
            >
              <button
                type="button"
                aria-label="Registrar gasto"
                onClick={handleCtaClick}
                className={cn(
                  "relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full",
                  "bg-gradient-to-b from-rose-400 to-rose-600",
                  "shadow-[0_10px_28px_-6px_rgba(244,63,94,0.55)]",
                  "ring-4 ring-[hsl(222_47%_6%)]",
                  "transition-transform duration-200 hover:scale-105 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300",
                  bouncing ? "cta-bounce" : "",
                )}
              >
                {/* brilho interno discreto no topo */}
                <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                <Plus
                  className="relative h-7 w-7 text-white"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
              <span className="mt-1.5 text-[12px] font-semibold tracking-wide text-rose-300">
                Gasto
              </span>
            </div>
          );
        }

        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <item.icon
              className={cn(
                "h-6 w-6 transition-all duration-200",
                isActive ? `${item.activeColor} scale-110` : "text-white/40",
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "text-[12px] font-medium transition-colors duration-200",
                isActive ? item.activeColor : "text-white/40",
              )}
            >
              {item.label}
            </span>
            {/* indicador do item ativo */}
            <span
              aria-hidden="true"
              className={cn(
                "h-1 w-1 rounded-full transition-opacity duration-200",
                isActive ? "bg-current opacity-100" : "opacity-0",
                isActive ? item.activeColor : "",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
