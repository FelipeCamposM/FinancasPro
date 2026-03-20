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
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-4 shadow-sm">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <div className="flex flex-1 items-center gap-2">
          <Button
            variant="outline"
            className="relative h-9 w-full max-w-xs justify-start text-sm text-muted-foreground hover:text-foreground bg-muted/40 border-border/60 hover:bg-muted"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-2 h-4 w-4 shrink-0" />
            <span className="hidden sm:inline-flex">Pesquisar...</span>
            <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium sm:flex">
              /
            </kbd>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
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
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                  {user?.name ?? "—"}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email ?? "—"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <User className="mr-2 h-4 w-4" />
              Ver perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/perfil")}>
              <User className="mr-2 h-4 w-4" />
              Editar perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
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
