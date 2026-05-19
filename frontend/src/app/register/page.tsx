"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertCircle, Loader2, Eye, EyeOff, Check, X, ChevronLeft } from "lucide-react";

interface StrengthResult {
  level: "fraca" | "média" | "forte" | "muito forte";
  score: number;
  color: string;
}

function passwordStrength(password: string): StrengthResult {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    long: password.length >= 12,
  };
  const score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { level: "fraca",      score, color: "bg-rose-500" };
  if (score === 3) return { level: "média",      score, color: "bg-amber-500" };
  if (score === 4) return { level: "forte",      score, color: "bg-blue-500" };
  return             { level: "muito forte", score, color: "bg-emerald-500" };
}

const REQUIREMENTS = [
  { label: "Mínimo 8 caracteres",     test: (p: string) => p.length >= 8 },
  { label: "1 letra maiúscula (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 letra minúscula (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "1 caractere especial",    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const MOCK_STATS = [
  { label: "Renda",  value: "R$ 4.800", color: "text-sky-300" },
  { label: "Gastos", value: "R$ 1.960", color: "text-rose-300" },
  { label: "Saldo",  value: "R$ 2.840", color: "text-emerald-300" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);

  const strength        = password ? passwordStrength(password) : null;
  const allPassed       = REQUIREMENTS.every((r) => r.test(password));
  const passwordsMatch  = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!allPassed) { setError("A senha não atende todos os requisitos de segurança."); return; }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      const { data } = await api.post<{ retry_after_seconds?: number }>("/auth/register", { name, email, password });
      router.push(`/verify-email?email=${encodeURIComponent(email)}&cooldown=${data.retry_after_seconds ?? 60}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── MOBILE GRADIENT HEADER (oculto no desktop) ── */}
      <div
        className="md:hidden relative overflow-hidden flex flex-col items-center text-center px-6 pt-12 pb-10"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-10 right-0 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
        />
        <Link href="/" className="relative z-10 flex flex-col items-center gap-3">
          <Image src="/logo-valora-branca.png" alt="Valora" width={56} height={56} className="size-14" />
          <div>
            <p className="font-display text-3xl tracking-wide text-white">Valora</p>
            <p className="text-sm text-sky-100/70 mt-1">Comece a controlar seus gastos hoje</p>
          </div>
        </Link>
      </div>

      {/* ── FORM PANEL ── */}
      <div className="flex-1 bg-background px-5 pt-5 pb-8 md:flex md:items-center md:justify-center md:p-10">
        <div className="w-full max-w-sm space-y-6">

          {/* Desktop header */}
          <div className="hidden md:block space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Crie sua conta</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados para começar gratuitamente</p>
          </div>

          <Card className="shadow-md border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-1.5">
                <Link
                  href="/"
                  aria-label="Voltar para o início"
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <CardTitle className="text-xl">Criar conta</CardTitle>
              </div>
              <CardDescription className="mt-1">Preencha os dados abaixo para se cadastrar</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name" type="text" required
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo" autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email" type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com" autoComplete="email"
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
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {password.length > 0 && strength && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                            style={{ width: `${(strength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold capitalize ${
                          strength.level === "fraca"      ? "text-rose-500"    :
                          strength.level === "média"      ? "text-amber-500"   :
                          strength.level === "forte"      ? "text-blue-500"    : "text-emerald-500"
                        }`}>
                          {strength.level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {REQUIREMENTS.map((req) => {
                          const ok = req.test(password);
                          return (
                            <div key={req.label} className="flex items-center gap-1.5">
                              {ok
                                ? <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                                : <X    className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                              }
                              <span className={`text-[11px] ${ok ? "text-emerald-600" : "text-muted-foreground/60"}`}>
                                {req.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={`pr-10 ${
                        passwordsMatch    ? "border-emerald-400/50 focus-visible:ring-emerald-400/40" :
                        passwordsMismatch ? "border-rose-400/50 focus-visible:ring-rose-400/40"      : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordsMatch && (
                    <p className="flex items-center gap-1 text-[11px] text-emerald-600">
                      <Check className="h-3 w-3" /> Senhas coincidem
                    </p>
                  )}
                  {passwordsMismatch && (
                    <p className="flex items-center gap-1 text-[11px] text-rose-500">
                      <X className="h-3 w-3" /> As senhas não coincidem
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5 flex items-start gap-3">
                  <Checkbox
                    id="lgpd"
                    checked={lgpdAccepted}
                    onCheckedChange={(v) => setLgpdAccepted(!!v)}
                    className="mt-0.5 shrink-0"
                  />
                  <Label
                    htmlFor="lgpd"
                    className="text-xs text-muted-foreground leading-relaxed font-normal cursor-pointer"
                  >
                    Li e aceito a{" "}
                    <Link href="/politica-de-privacidade" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
                      Política de Privacidade
                    </Link>{" "}
                    e os{" "}
                    <Link href="/termos-de-uso" target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium">
                      Termos de Uso
                    </Link>
                    , concordando com o tratamento dos meus dados conforme a{" "}
                    <span className="font-medium text-foreground">LGPD</span>.
                  </Label>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !allPassed || passwordsMismatch || !lgpdAccepted}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center pb-6">
              <p className="text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* ── GRADIENT PANEL (direita, só desktop) ── */}
      <div
        className="hidden md:flex md:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)" }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-[350px] w-[350px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-0 h-[280px] w-[280px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
        />

        {/* Top: logo */}
        <Link href="/" className="relative z-10 flex items-center gap-4 group w-fit">
          <Image src="/logo-valora-branca.png" alt="Valora" width={64} height={64} className="size-16" />
          <span className="font-display text-4xl tracking-wide text-white group-hover:text-sky-100 transition-colors">
            Valora
          </span>
        </Link>

        {/* Middle: headline + glass cards */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Comece sua<br />
              <span className="text-sky-200">jornada financeira</span>
            </h2>
            <p className="text-sky-100/70 text-base leading-relaxed max-w-sm">
              Em minutos você terá visão completa de onde o seu dinheiro vai — e quanto sobra.
            </p>
          </div>

          <div className="space-y-3">
            {/* Card principal */}
            <div
              className="rounded-2xl border border-white/15 p-5"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(14px)",
              }}
            >
              <p className="text-xs text-sky-200/50 mb-4">Visão geral do mês</p>
              <div className="grid grid-cols-3 gap-4">
                {MOCK_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[10px] text-white/40 mb-1">{stat.label}</p>
                    <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dois mini cards */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border border-white/15 p-3.5"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
              >
                <p className="text-[10px] text-white/40 mb-1.5">Maior categoria</p>
                <p className="text-sm font-semibold text-white">Moradia</p>
                <p className="text-xs text-sky-200/50 mt-0.5">R$ 1.200 / mês</p>
              </div>
              <div
                className="rounded-xl border border-white/15 p-3.5"
                style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
              >
                <p className="text-[10px] text-white/40 mb-1.5">Assinaturas</p>
                <p className="text-sm font-semibold text-white">4 ativas</p>
                <p className="text-xs text-sky-200/50 mt-0.5">R$ 142,70 / mês</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-sky-200/50 text-xs">
            Valora Finanças &copy; {new Date().getFullYear()} — Controle financeiro pessoal
          </p>
        </div>
      </div>

    </div>
  );
}
