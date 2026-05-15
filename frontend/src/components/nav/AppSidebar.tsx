"use client";

import Image from "next/image";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Repeat,
  Settings,
  FileBarChart,
  PiggyBank,
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
  {
    href: "/cofrinhos",
    icon: PiggyBank,
    label: "Cofrinhos",
    iconColor: "text-emerald-400/70",
    activeIconColor: "text-emerald-400",
    activeBg: "data-[active=true]:bg-emerald-500/10",
  },
  {
    href: "/relatorios",
    icon: FileBarChart,
    label: "Relatórios",
    iconColor: "text-amber-400/70",
    activeIconColor: "text-amber-400",
    activeBg: "data-[active=true]:bg-amber-500/10",
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-4 px-4 py-5 md:gap-3.5 md:px-3 md:py-4">
          <Image
            src="/logo-valora-branca.png"
            alt="Valora"
            width={48}
            height={48}
            className="h-14 w-14 shrink-0 md:h-11 md:w-11"
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-3xl tracking-wide text-sidebar-foreground md:text-xl">
              Valora
            </span>
            <span className="mt-1.5 text-base text-sidebar-foreground/60 md:mt-1 md:text-sm md:text-sidebar-foreground/55">
              Controle financeiro
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="h-10 px-4 text-sm font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40 md:h-9 md:px-3 md:text-xs">
            Navegação
          </SidebarGroupLabel>
          <SidebarMenu className="gap-2 md:gap-1.5">
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
                      "h-14 gap-3.5 rounded-xl px-4 text-lg transition-all duration-150 [&_svg]:!size-7 md:h-11 md:gap-3 md:rounded-lg md:px-3 md:py-2 md:text-base md:[&_svg]:!size-5",
                    )}
                  >
                    <Link href={item.href} onClick={closeMobileSidebar}>
                      <item.icon
                        className={cn(
                          "h-7 w-7 transition-colors md:h-5 md:w-5",
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="h-10 px-4 text-sm font-bold uppercase tracking-[0.14em] text-sidebar-foreground/40 md:h-9 md:px-3 md:text-xs">
            Sistema
          </SidebarGroupLabel>
          <SidebarMenu className="gap-2 md:gap-1.5">
            {(() => {
              const isActive =
                pathname === "/configuracoes" ||
                pathname.startsWith("/configuracoes/");
              return (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip="Configurações"
                    className={cn(
                      "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      "data-[active=true]:bg-slate-500/10",
                      "data-[active=true]:text-sidebar-foreground",
                      "h-14 gap-3.5 rounded-xl px-4 text-lg transition-all duration-150 [&_svg]:!size-7 md:h-11 md:gap-3 md:rounded-lg md:px-3 md:py-2 md:text-base md:[&_svg]:!size-5",
                    )}
                  >
                    <Link href="/configuracoes" onClick={closeMobileSidebar}>
                      <Settings
                        className={cn(
                          "h-7 w-7 transition-colors md:h-5 md:w-5",
                          isActive ? "text-slate-300" : "text-slate-400/70",
                        )}
                      />
                      <span className={cn(isActive && "font-semibold")}>
                        Configurações
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })()}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/30">
          Valora &copy; {new Date().getFullYear()}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
