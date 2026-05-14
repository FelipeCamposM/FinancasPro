"use client";

import { FormEvent, KeyboardEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Check, Loader2, Mail } from "lucide-react";
import { api, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const CODE_LENGTH = 6;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const initialCooldown = Number(searchParams.get("cooldown") ?? 0);
  const email = searchParams.get("email") ?? "";
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(
    Number.isFinite(initialCooldown) ? Math.max(initialCooldown, 0) : 0,
  );

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const code = codeDigits.join("");

  function submitOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || loading || code.length !== CODE_LENGTH) return;

    e.preventDefault();
    formRef.current?.requestSubmit();
  }

  function focusCodeInput(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function handleCodeChange(index: number, value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setCodeDigits((current) => {
        const next = [...current];
        next[index] = "";
        return next;
      });
      return;
    }

    setCodeDigits((current) => {
      const next = [...current];
      digits
        .slice(0, CODE_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });
      return next;
    });

    const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
    window.requestAnimationFrame(() => focusCodeInput(nextIndex));
  }

  function handleCodeKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    submitOnEnter(e);

    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      e.preventDefault();
      setCodeDigits((current) => {
        const next = [...current];
        next[index - 1] = "";
        return next;
      });
      window.requestAnimationFrame(() => focusCodeInput(index - 1));
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusCodeInput(index - 1);
    }

    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      focusCodeInput(index + 1);
    }
  }

  function handleCodePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    handleCodeChange(index, e.clipboardData.getData("text"));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post<{ token: string }>("/auth/verify-email", {
        email,
        code,
      });
      setToken(data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || "Codigo invalido ou expirado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const { data } = await api.post<{ retry_after_seconds?: number }>("/auth/verify-email/request", { email });
      setMessage("Enviamos um novo codigo de verificacao.");
      setResendCooldown(data.retry_after_seconds ?? 60);
    } catch (err: unknown) {
      const response = (err as {
        response?: { status?: number; data?: { error?: string; retry_after_seconds?: number } };
      }).response;
      if (response?.status === 429) {
        setResendCooldown(response.data?.retry_after_seconds ?? 60);
      }
      const msg = response?.data?.error;
      setError(msg || "Nao foi possivel reenviar o codigo.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo-valora-branca.png" alt="Valora" width={56} height={56} />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
            <p className="text-sm text-muted-foreground">Confirme sua conta para acessar o Valora</p>
          </div>
        </div>

        <Card className="shadow-md border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Codigo de verificacao</CardTitle>
            <CardDescription>Digite o codigo de 6 digitos enviado para seu e-mail</CardDescription>
          </CardHeader>

          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  E-mail de verificacao
                </div>
                <p className="mt-1 break-all text-sm font-medium text-foreground">
                  {email || "E-mail nao informado"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Codigo</Label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {codeDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      aria-label={`Digito ${index + 1} do codigo`}
                      inputMode="numeric"
                      maxLength={1}
                      required
                      value={digit}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      onPaste={(event) => handleCodePaste(index, event)}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      className="h-16 w-full rounded-md border border-input bg-background text-center text-2xl font-semibold text-foreground shadow-sm outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-20"
                    />
                  ))}
                </div>
              </div>

              {message && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading || code.length !== CODE_LENGTH || !email}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar e entrar
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={resending || !email || resendCooldown > 0}
                onClick={handleResend}
              >
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : "Reenviar codigo"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pb-6">
            <Link href="/login" className="text-sm font-medium text-primary hover:underline underline-offset-4">
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
