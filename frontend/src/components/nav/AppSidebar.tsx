"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Wallet,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    iconColor: "text-primary",
    activeIconColor: "text-primary",
    activeBg: "data-[active=true]:bg-primary/15",
  },
  {
    href: "/gastos",
    icon: TrendingDown,
    label: "Gastos",
    iconColor: "text-rose-400/70",
    activeIconColor: "text-rose-400",
    activeBg: "data-[active=true]:bg-rose-500/10",
  },
  {
    href: "/renda",
    icon: TrendingUp,
    label: "Renda",
    iconColor: "text-blue-400/70",
    activeIconColor: "text-blue-400",
    activeBg: "data-[active=true]:bg-blue-500/10",
  },
  {
    href: "/cartoes",
    icon: CreditCard,
    label: "Cartões",
    iconColor: "text-blue-300/70",
    activeIconColor: "text-blue-300",
    activeBg: "data-[active=true]:bg-blue-400/10",
  },
  {
    href: "/assinaturas",
    icon: Repeat,
    label: "Assinaturas",
    iconColor: "text-violet-400/70",
    activeIconColor: "text-violet-400",
    activeBg: "data-[active=true]:bg-violet-500/10",
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shadow-glow-primary">
            <Wallet className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-base tracking-wide text-sidebar-foreground">
              FinançasPro
            </span>
            <span className="text-[11px] text-sidebar-foreground/50">
              Controle financeiro
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/35">
            Navegação
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={cn(
                      "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      item.activeBg,
                      "data-[active=true]:text-sidebar-foreground",
                      "transition-all duration-150",
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? item.activeIconColor : item.iconColor,
                        )}
                      />
                      <span className={cn(isActive && "font-semibold")}>
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/30">
          FinançasPro &copy; {new Date().getFullYear()}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
