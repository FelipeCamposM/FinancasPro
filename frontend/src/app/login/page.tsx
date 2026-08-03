"use client";

import { useEffect, useRef, useState, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { toast } from "sonner";
import { paginaInicial } from "@/lib/preferencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  TrendingDown,
  TrendingUp,
  CreditCard,
  BarChart3,
  Check,
  Mail,
  ChevronLeft,
} from "lucide-react";

const FEATURES = [
  { icon: TrendingDown, label: "Controle total de gastos e parcelas" },
  { icon: TrendingUp, label: "Acompanhe renda e receitas recorrentes" },
  { icon: CreditCard, label: "Gerencie cartoes e assinaturas" },
  { icon: BarChart3, label: "Dashboards e relatorios em tempo real" },
];

const POST_LOGIN_REDIRECT_MS = 1400;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function LoginPage() {
  const router = useRouter();
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const codeFormRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeRequestLoading, setCodeRequestLoading] = useState(false);
  const [codeVerifyLoading, setCodeVerifyLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loginRedirecting, setLoginRedirecting] = useState(false);
  const [codeLoginRedirecting, setCodeLoginRedirecting] = useState(false);

  useEffect(() => {
    if (codeCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCodeCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [codeCooldown]);

  function submitPasswordOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || loading) return;

    e.preventDefault();
    passwordFormRef.current?.requestSubmit();
  }

  function submitCodeOnEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || codeRequestLoading || codeVerifyLoading) return;

    e.preventDefault();

    if (!codeSent) {
      if (email && codeCooldown <= 0 && !codeRequestLoading) {
        void handleRequestCode();
      }
      return;
    }

    if (loginCode.length === 6) {
      codeFormRef.current?.requestSubmit();
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoginRedirecting(false);
    setLoading(true);

    let navigatedAway = false;

    try {
      const { data } = await api.post<{ token: string }>("/auth/login", {
        email,
        password,
      });
      setToken(data.token);
      setLoginRedirecting(true);
      toast.success("Login realizado com sucesso", { description: "Redirecionando para o painel..." });
      await delay(POST_LOGIN_REDIRECT_MS);
      router.push(await paginaInicial());
      navigatedAway = true;
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; code?: string } } }).response;
      if (response?.data?.code === "EMAIL_NOT_VERIFIED") {
        const retryAfter = (response.data as { retry_after_seconds?: number }).retry_after_seconds ?? 60;
        setLoginRedirecting(true);
        toast.info("Conta ainda nao verificada", { description: "Redirecionando para confirmar o e-mail..." });
        await delay(900);
        router.push(`/verify-email?email=${encodeURIComponent(email)}&cooldown=${retryAfter}`);
        navigatedAway = true;
        return;
      }
      setError(response?.data?.error || "Credenciais invalidas");
    } finally {
      if (!navigatedAway) {
        setLoading(false);
        setLoginRedirecting(false);
      }
    }
  }

  async function handleRequestCode() {
    setError("");
    setCodeRequestLoading(true);

    try {
      const { data } = await api.post<{ retry_after_seconds?: number }>("/auth/login-code/request", { email });
      setCodeSent(true);
      toast.success("Codigo enviado", { description: "Confira a caixa de entrada do seu e-mail." });
      setCodeCooldown(data.retry_after_seconds ?? 60);
    } catch (err: unknown) {
      const response = (err as {
        response?: { status?: number; data?: { error?: string; retry_after_seconds?: number } };
      }).response;
      if (response?.status === 429) {
        setCodeCooldown(response.data?.retry_after_seconds ?? 60);
      }
      const msg = response?.data?.error;
      setError(msg || "Nao foi possivel enviar o codigo.");
    } finally {
      setCodeRequestLoading(false);
    }
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (!codeSent || loginCode.length !== 6) return;

    setError("");
    setCodeLoginRedirecting(false);
    setCodeVerifyLoading(true);

    let navigatedAway = false;

    try {
      const { data } = await api.post<{ token: string }>("/auth/login-code/verify", {
        email,
        code: loginCode,
      });
      setToken(data.token);
      setCodeLoginRedirecting(true);
      toast.success("Login realizado com sucesso", { description: "Redirecionando para o painel..." });
      await delay(POST_LOGIN_REDIRECT_MS);
      router.push(await paginaInicial());
      navigatedAway = true;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(msg || "Codigo invalido ou expirado.");
    } finally {
      if (!navigatedAway) {
        setCodeVerifyLoading(false);
        setCodeLoginRedirecting(false);
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── MOBILE GRADIENT HEADER (oculto no desktop) ── */}
      <div
        className="md:hidden relative overflow-hidden flex flex-col items-center text-center px-6 pt-12 pb-10"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)" }}
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
          className="pointer-events-none absolute -top-10 left-0 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
        />
        <Link href="/" className="relative z-10 flex flex-col items-center gap-3">
          <Image src="/logo-valora-branca.png" alt="Valora" width={56} height={56} className="size-14" />
          <div>
            <p className="font-display text-3xl tracking-wide text-white">Valora</p>
            <p className="text-sm text-sky-100/70 mt-1">Inteligência financeira pessoal</p>
          </div>
        </Link>
      </div>

      {/* ── DESKTOP GRADIENT PANEL ── */}
      <div
        className="hidden md:flex md:w-[58%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Link href="/" className="relative z-10 flex items-center gap-4 group w-fit">
          <Image src="/logo-valora-branca.png" alt="Valora" width={80} height={80} className="size-20" />
          <span className="font-display text-5xl tracking-wide text-white group-hover:text-sky-100 transition-colors">Valora</span>
        </Link>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-white">
              Inteligencia financeira
              <br />
              <span className="text-sky-100">para decisoes melhores</span>
            </h2>
            <p className="text-sky-100/80 text-lg leading-relaxed max-w-sm">
              Tenha visao completa das suas financas. Gastos, renda, cartoes e assinaturas em um so lugar.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature.label} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sky-50/90 text-sm">{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-sky-200/60 text-xs">
            Valora &copy; {new Date().getFullYear()} - Controle financeiro pessoal
          </p>
        </div>
      </div>

      <div className="flex-1 bg-background px-5 py-8 md:flex md:items-center md:justify-center md:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="hidden md:block space-y-1">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">Entre na sua conta para continuar</p>
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
                <CardTitle className="text-xl">Entrar na conta</CardTitle>
              </div>
              <CardDescription className="mt-1">Use sua senha ou receba um codigo por e-mail</CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="password" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">Senha</TabsTrigger>
                  <TabsTrigger value="code">Codigo</TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="mt-0">
                  <form ref={passwordFormRef} onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={submitPasswordOnEnter}
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
                          onKeyDown={submitPasswordOnEnter}
                          placeholder="********"
                          autoComplete="current-password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end -mt-1">
                      <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Esqueci minha senha
                      </Link>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? (loginRedirecting ? "Redirecionando..." : "Entrando...") : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="code" className="mt-0">
                  <form ref={codeFormRef} onSubmit={handleCodeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="code-email">E-mail</Label>
                      <Input
                        id="code-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={submitCodeOnEnter}
                        placeholder="seu@email.com"
                        autoComplete="email"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={codeRequestLoading || !email || codeCooldown > 0}
                      onClick={handleRequestCode}
                    >
                      {codeRequestLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      {codeCooldown > 0
                        ? `Reenviar em ${codeCooldown}s`
                        : codeSent
                          ? "Reenviar codigo"
                          : "Receber codigo por e-mail"}
                    </Button>

                    <div className="space-y-2">
                      <Label htmlFor="login-code" className={!codeSent ? "text-muted-foreground" : undefined}>
                        Codigo
                      </Label>
                      <Input
                        id="login-code"
                        inputMode="numeric"
                        maxLength={6}
                        required={codeSent}
                        value={loginCode}
                        onChange={(event) => setLoginCode(event.target.value.replace(/\D/g, ""))}
                        onKeyDown={submitCodeOnEnter}
                        placeholder={codeSent ? "123456" : "Envie o codigo primeiro"}
                        autoComplete="one-time-code"
                        disabled={!codeSent}
                        aria-disabled={!codeSent}
                        className={!codeSent ? "cursor-not-allowed opacity-60" : undefined}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={codeVerifyLoading || codeRequestLoading || loginCode.length !== 6}
                    >
                      {codeVerifyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {codeVerifyLoading
                        ? codeLoginRedirecting
                          ? "Redirecionando..."
                          : "A entrar..."
                        : "Entrar com codigo"}

                    </Button>
                  </form>
                </TabsContent>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-center pb-6">
              <p className="text-sm text-muted-foreground">
                Nao tem conta?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
                  Criar conta gratis
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
