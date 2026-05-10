"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Settings,
  Plus,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    activeColor: "text-blue-400",
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
    href: "/configuracoes",
    icon: Settings,
    label: "Config",
    activeColor: "text-slate-300",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 flex items-end justify-around
        border-t border-white/10 bg-[hsl(222_47%_5%/0.85)] backdrop-blur-xl
        pb-[env(safe-area-inset-bottom)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      {NAV_ITEMS.map((item, i) => {
        if (!item) {
          return (
            <div key="cta" className="flex flex-col items-center justify-center pb-2 pt-1 -mt-5">
              <button
                type="button"
                aria-label="Registrar gasto"
                onClick={() => router.push("/gastos?new=1")}
                className="flex h-14 w-14 items-center justify-center rounded-full
                  bg-rose-500 shadow-lg shadow-rose-500/40
                  ring-4 ring-[hsl(222_47%_5%)] active:scale-95 transition-transform"
              >
                <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
              </button>
              <span className="mt-1 text-[10px] font-medium text-rose-400/80">Gasto</span>
            </div>
          );
        }

        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-3 min-w-0"
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-colors",
                isActive ? item.activeColor : "text-white/35",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? item.activeColor : "text-white/35",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
