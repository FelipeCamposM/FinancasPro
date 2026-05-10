"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { clearToken } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";

const searchItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Gastos", href: "/gastos", icon: TrendingDown },
  { label: "Renda", href: "/renda", icon: TrendingUp },
  { label: "Cartões", href: "/cartoes", icon: CreditCard },
];

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export default function TopNavbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user } = useUser();

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.05] backdrop-blur-xl px-4 shadow-md ring-1 ring-white/5">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="flex flex-1 items-center gap-2">
          <Button
            variant="outline"
            className="relative h-9 w-full max-w-xs justify-start text-sm text-white/50 hover:text-white bg-white/[0.06] border-white/10 hover:bg-white/[0.10]"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="hidden sm:inline-flex">Pesquisar...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border border-white/15 bg-white/[0.08] px-1.5 font-mono text-[10px] font-medium sm:flex">
              /
            </kbd>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-white/[0.10] text-white transition-colors"
            >
              <Avatar className="h-8 w-8 ring-2 ring-white/10">
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {user?.name ?? "Carregando..."}
              </span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-white/40 transition-transform [[data-state=open]_&]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64" align="end" forceMount>
            {/* User header */}
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-3 mb-1.5">
              <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10">
                {user?.avatar && (
                  <AvatarImage src={user.avatar} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {user?.name ?? "—"}
                </p>
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {user?.email ?? "—"}
                </p>
              </div>
            </div>

            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <User className="text-white/50" />
              Ver perfil
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/configuracoes")}>
              <Settings className="text-white/50" />
              Configurações
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 focus:text-rose-300 focus:bg-rose-500/10"
            >
              <LogOut className="text-rose-400" />
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Pesquisar páginas..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Páginas">
            {searchItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
