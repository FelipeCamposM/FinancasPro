"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Eye, EyeOff, TrendingDown, TrendingUp, CreditCard, BarChart3, Check } from "lucide-react";

const FEATURES = [
  { icon: TrendingDown, color: "text-sky-200", label: "Controle total de gastos e parcelas" },
  { icon: TrendingUp,   color: "text-sky-200", label: "Acompanhe renda e receitas recorrentes" },
  { icon: CreditCard,   color: "text-sky-200", label: "Gerencie cartões e assinaturas" },
  { icon: BarChart3,    color: "text-sky-200", label: "Dashboards e relatórios em tempo real" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      setToken(data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div className="hidden md:flex md:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)" }}
      >
        {/* Animated orbs */}
        <div className="hero-orb-a absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #7dd3fc 0%, transparent 70%)" }} />
        <div className="hero-orb-b absolute bottom-10 -right-24 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #bae6fd 0%, transparent 70%)" }} />
        <div className="hero-orb-c absolute top-1/2 left-1/3 w-[280px] h-[280px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #e0f2fe 0%, transparent 70%)" }} />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Logo + brand */}
        <div className="relative z-10 flex items-center gap-3">
          <Image src="/logo-valora-branca.png" alt="Valora" width={40} height={40} />
          <span className="font-display text-2xl tracking-wide text-white">Valora</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Inteligência financeira<br />
              <span className="text-sky-100">para decisões melhores</span>
            </h2>
            <p className="text-sky-100/80 text-lg leading-relaxed max-w-sm">
              Tenha visão completa das suas finanças. Gastos, renda, cartões e assinaturas em um só lugar.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sky-50/90 text-sm">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-sky-200/50 text-xs">
            Valora &copy; {new Date().getFullYear()} — Controle financeiro pessoal
          </p>
        </div>
      </div>

      {/* ── RIGHT LOGIN PANEL ── */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 md:p-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Logo — mobile only */}
          <div className="flex flex-col items-center gap-3 md:hidden">
            <Image src="/logo-valora-branca.png" alt="Valora" width={56} height={56} />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Valora</h1>
              <p className="text-sm text-muted-foreground">Controle financeiro pessoal</p>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Entre na sua conta para continuar</p>
          </div>

          <Card className="shadow-md border-border/60">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Entrar na conta</CardTitle>
              <CardDescription>Digite seu e-mail e senha para acessar</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end -mt-1">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center pb-6">
              <p className="text-sm text-muted-foreground">
                Não tem conta?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline underline-offset-4"
                >
                  Criar conta grátis
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
