"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
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
import { AlertCircle, Loader2, Eye, EyeOff, Check, X } from "lucide-react";

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
  if (score <= 2) return { level: "fraca",       score, color: "bg-rose-500" };
  if (score === 3) return { level: "média",       score, color: "bg-amber-500" };
  if (score === 4) return { level: "forte",       score, color: "bg-blue-500" };
  return              { level: "muito forte",  score, color: "bg-emerald-500" };
}

const REQUIREMENTS = [
  { label: "Mínimo 8 caracteres",      test: (p: string) => p.length >= 8 },
  { label: "1 letra maiúscula (A–Z)",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 letra minúscula (a–z)",  test: (p: string) => /[a-z]/.test(p) },
  { label: "1 caractere especial",     test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = password ? passwordStrength(password) : null;
  const allPassed = REQUIREMENTS.every((r) => r.test(password));
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!allPassed) {
      setError("A senha não atende todos os requisitos de segurança.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<{ retry_after_seconds?: number }>("/auth/register", {
        name,
        email,
        password,
      });
      router.push(
        `/verify-email?email=${encodeURIComponent(email)}&cooldown=${data.retry_after_seconds ?? 60}`,
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo-valora-branca.png" alt="Valora" width={56} height={56} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Valora</h1>
            <p className="text-sm text-muted-foreground">Comece a controlar seus gastos hoje</p>
          </div>
        </div>

        <Card className="shadow-md border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Criar conta</CardTitle>
            <CardDescription>Preencha os dados abaixo para se cadastrar</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name" type="text" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo" autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email" type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" autoComplete="email"
                />
              </div>

              {/* Senha */}
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

                {/* Barra de força */}
                {password.length > 0 && strength && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold capitalize ${
                        strength.level === "fraca" ? "text-rose-400" :
                        strength.level === "média" ? "text-amber-400" :
                        strength.level === "forte" ? "text-blue-400" : "text-emerald-400"
                      }`}>
                        {strength.level}
                      </span>
                    </div>

                    {/* Requisitos */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {REQUIREMENTS.map((req) => {
                        const ok = req.test(password);
                        return (
                          <div key={req.label} className="flex items-center gap-1.5">
                            {ok
                              ? <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                              : <X className="h-3 w-3 shrink-0 text-white/25" />
                            }
                            <span className={`text-[11px] ${ok ? "text-emerald-400" : "text-white/35"}`}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar senha */}
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
                      passwordsMatch ? "border-emerald-400/50 focus-visible:ring-emerald-400/40" :
                      passwordsMismatch ? "border-rose-400/50 focus-visible:ring-rose-400/40" : ""
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
                  <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <Check className="h-3 w-3" /> Senhas coincidem
                  </p>
                )}
                {passwordsMismatch && (
                  <p className="flex items-center gap-1 text-[11px] text-rose-400">
                    <X className="h-3 w-3" /> As senhas não coincidem
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || !allPassed || passwordsMismatch}>
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
  );
}
