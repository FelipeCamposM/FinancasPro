"use client";

import { useEffect, useState } from "react";
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
  CommandSeparator,
} from "@/components/ui/command";
import { Search, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { clearToken } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";
import {
  COMMAND_PALETTE_GROUPS,
  commandPaletteFilterValue,
} from "@/lib/command-palette";

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.tagName === "SELECT" ||
            t.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

          <DropdownMenuContent className="w-64 user-dropdown-content" align="end" forceMount>
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
        <CommandInput placeholder="Buscar páginas, configurações, atalhos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {COMMAND_PALETTE_GROUPS.map((group, gi) => (
            <div key={group.heading}>
              {gi > 0 ? <CommandSeparator className="my-1" /> : null}
              <CommandGroup heading={group.heading}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={commandPaletteFilterValue(item)}
                    onSelect={() => {
                      router.push(item.href);
                      setOpen(false);
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4 shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate">{item.label}</span>
                      {item.subtitle ? (
                        <span className="truncate text-xs text-muted-foreground font-normal">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
