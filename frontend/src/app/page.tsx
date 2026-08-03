import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  Check,
  Shield,
  Zap,
  PieChart,
  Bell,
  ArrowRight,
  Wallet,
  RefreshCcw,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Copy,
  Mic,
  Download,
  KeyRound,
} from "lucide-react";

const FEATURES = [
  {
    icon: TrendingDown,
    title: "Controle de Gastos",
    description:
      "Registre cada despesa, parcele compras e tenha visão clara do que sai do seu bolso todo mês.",
  },
  {
    icon: TrendingUp,
    title: "Gestão de Renda",
    description:
      "Acompanhe salário, renda extra e receitas recorrentes. Saiba exatamente quanto você ganha.",
  },
  {
    icon: CreditCard,
    title: "Cartões de Crédito",
    description:
      "Cadastre seus cartões, acompanhe faturas e nunca perca o controle do limite disponível.",
  },
  {
    icon: RefreshCcw,
    title: "Assinaturas Recorrentes",
    description:
      "Netflix, Spotify, academia: visualize tudo em um painel e elimine cobranças esquecidas.",
  },
  {
    icon: PieChart,
    title: "Relatórios Detalhados",
    description:
      "Gráficos e relatórios mensais por categoria. Entenda seus padrões de consumo com clareza.",
  },
  {
    icon: Bell,
    title: "Categorias Personalizadas",
    description:
      "Crie categorias para alimentação, lazer, saúde e muito mais. Organize do seu jeito.",
  },
];

const IPHONE_STEPS = [
  {
    icon: Download,
    title: "Baixe o atalho",
    description: "Um toque instala o atalho oficial no app Atalhos do iPhone.",
  },
  {
    icon: KeyRound,
    title: "Cole sua chave",
    description: "A chave fica em Configurações e liga o atalho à sua conta.",
  },
  {
    icon: Mic,
    title: "Fale o gasto",
    description: "Diga a descrição e o valor. O lançamento cai direto no painel.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastro gratuito em menos de 1 minuto. Sem cartão de crédito.",
  },
  {
    number: "02",
    title: "Registre seus dados",
    description: "Adicione renda, gastos, cartões e assinaturas. Importe tudo de uma vez.",
  },
  {
    number: "03",
    title: "Tome decisões melhores",
    description: "Veja relatórios, identifique gastos desnecessários e economize mais.",
  },
];

const TRUST_ITEMS = [
  { icon: Shield, label: "Dados seguros e criptografados" },
  { icon: Zap, label: "Rápido e sempre disponível" },
  { icon: Wallet, label: "100% gratuito para começar" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Valora Finanças",
  alternateName: ["Valora Financas", "ValoraFinanças", "valorafinancas"],
  url: "https://valorafinancas.com",
  description:
    "Valora Finanças é uma plataforma de controle financeiro pessoal para gerenciar gastos, renda, cartões e assinaturas em um único lugar.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
  inLanguage: "pt-BR",
};

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get("gg_token");
  if (token?.value) redirect("/dashboard");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 55%, #1d4ed8 100%)",
        }}
      >
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute top-1/2 -left-60 h-[500px] w-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }} />

        {/* ── NAVBAR ── */}
        <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-valora-branca.png" alt="Valora Finanças" width={44} height={44} className="size-11" />
            <span className="font-display text-[1.75rem] tracking-wide text-white leading-none">
              Valora
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-sky-100/80">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#iphone" className="hover:text-white transition-colors">Atalho iPhone</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-white border border-white/30 hover:border-white/60 hover:bg-white/10 px-5 py-2.5 rounded-full transition-all backdrop-blur-sm"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="hidden sm:block bg-white text-blue-700 hover:bg-sky-50 text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-lg shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-900/40 hover:-translate-y-px"
            >
              Criar conta grátis
            </Link>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight max-w-4xl mb-6">
            Organize suas finanças<br />
            <span className="text-sky-200">com inteligência</span>
          </h1>

          <p className="text-lg md:text-xl text-sky-100/80 max-w-2xl mb-10 leading-relaxed">
            Valora Finanças reúne gastos, renda, cartões e assinaturas em um único painel.
            Visualize para onde seu dinheiro vai e tome decisões melhores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-sky-50 font-bold px-8 py-4 rounded-full text-base transition-all shadow-xl shadow-blue-900/30 hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Começar gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-full text-base transition-all backdrop-blur-sm"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="-mt-10 mb-16 text-sm text-sky-100/60">
            Gratuito para começar. Sem cartão de crédito.
          </p>

          {/* Prévia do dashboard: janela flutuante no estilo Safari do macOS,
              com o tema real de dentro da aplicação no conteúdo */}
          <div className="w-full max-w-3xl [perspective:1600px]">
            <div className="group relative rounded-[14px] transition-transform duration-700 ease-out [transform:rotateX(9deg)_scale(0.99)] hover:[transform:rotateX(0deg)_scale(1)]">
              {/* Halo que sustenta a janela no ar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -bottom-10 h-24 rounded-[50%] opacity-60 blur-2xl"
                style={{ background: "radial-gradient(ellipse at center, rgba(3,7,18,0.85) 0%, transparent 70%)" }}
              />

              <div className="relative overflow-hidden rounded-[14px] border border-white/[0.14] shadow-[0_50px_110px_-25px_rgba(2,6,23,0.95),0_10px_30px_-10px_rgba(2,6,23,0.6)] ring-1 ring-black/40">
                {/* Barra de ferramentas do Safari */}
                <div className="relative flex items-center gap-3 border-b border-black/40 px-4 py-2.5"
                  style={{ background: "linear-gradient(180deg, #3a3a3e 0%, #2b2b2f 100%)" }}>
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/15" />

                  {/* Semáforos */}
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-inner shadow-black/20" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-inner shadow-black/20" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-inner shadow-black/20" />
                  </div>

                  <div className="hidden items-center gap-1 text-white/35 sm:flex">
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4" />
                  </div>

                  {/* Barra de endereço */}
                  <div className="mx-auto flex w-full max-w-[300px] items-center justify-center gap-1.5 rounded-md bg-black/25 px-3 py-1 ring-1 ring-white/[0.06]">
                    <Lock className="h-3 w-3 text-white/40" />
                    <span className="text-[11px] text-white/60">valorafinancas.com</span>
                  </div>

                  <div className="hidden items-center gap-3 text-white/30 sm:flex">
                    <Plus className="h-4 w-4" />
                    <Copy className="h-4 w-4" />
                  </div>
                </div>

                {/* Conteúdo com o fundo real da aplicação */}
                <div className="relative bg-[hsl(222_47%_5%)] p-5 text-left">
                  {/* Brilho de vidro na diagonal, como no app */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-1/3 -top-1/2 h-[200%] w-2/3 rotate-12 opacity-[0.06]"
                    style={{ background: "linear-gradient(90deg, transparent, #fff, transparent)" }}
                  />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                    Resumo do mês
                  </p>
                  <p className="font-display text-lg tracking-wide text-white/90">
                    Março de 2026
                  </p>
                </div>
                <span className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  59% da renda usada
                </span>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-3">
                {[
                  { label: "Saldo", value: "R$ 2.840", ring: "border-emerald-300/25 bg-emerald-500/[0.10]", text: "text-emerald-300", Icon: Wallet },
                  { label: "Gastos", value: "R$ 1.960", ring: "border-rose-300/25 bg-rose-500/[0.10]", text: "text-rose-300", Icon: TrendingDown },
                  { label: "Renda", value: "R$ 4.800", ring: "border-blue-300/25 bg-blue-500/[0.10]", text: "text-blue-300", Icon: TrendingUp },
                ].map(({ label, value, ring, text, Icon }) => (
                  <div key={label} className={`rounded-xl border p-3 ${ring}`}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
                        {label}
                      </p>
                      <Icon className={`h-3.5 w-3.5 ${text}`} />
                    </div>
                    <p className={`text-lg font-bold tabular-nums ${text}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                    Últimos gastos
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Supermercado", cat: "Alimentação", cor: "#34d399", value: "R$ 342,00" },
                      { label: "Spotify", cat: "Assinaturas", cor: "#a78bfa", value: "R$ 21,90" },
                      { label: "Academia", cat: "Saúde", cor: "#60a5fa", value: "R$ 99,00" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: item.cor }} />
                          <span className="truncate text-white/85">{item.label}</span>
                          <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/40">
                            {item.cat}
                          </span>
                        </div>
                        <span className="shrink-0 font-semibold tabular-nums text-rose-300">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                    Por categoria
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { cat: "Alimentação", pct: 72, cor: "#34d399" },
                      { cat: "Moradia", pct: 54, cor: "#60a5fa" },
                      { cat: "Lazer", pct: 28, cor: "#a78bfa" },
                    ].map((item) => (
                      <div key={item.cat}>
                        <div className="mb-1 flex items-center justify-between text-[11px]">
                          <span className="text-white/55">{item.cat}</span>
                          <span className="tabular-nums text-white/35">{item.pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                          <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.cor }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section className="relative z-10 border-y border-white/10 bg-white/5 backdrop-blur-sm py-5">
          <div className="flex flex-wrap items-center justify-center gap-8 px-6">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-sky-100/70">
                <Icon className="h-4 w-4 text-sky-300" />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="funcionalidades" className="relative z-10 px-6 md:px-12 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Tudo para organizar suas finanças pessoais
              </h2>
              <p className="text-sky-100/60 text-lg max-w-xl mx-auto">
                Do controle de gastos diários até relatórios mensais completos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md p-6 transition-all hover:bg-white/14 hover:border-white/25 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/30"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)" }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-inner">
                    <Icon className="h-5 w-5 text-sky-200" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-base">{title}</h3>
                  <p className="text-sky-100/60 text-sm leading-relaxed">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── ATALHO DO IPHONE (exclusivo iOS) ── */}
        <section id="iphone" className="relative z-10 px-6 md:px-12 pb-24">
          <div className="mx-auto grid max-w-5xl items-center gap-10 rounded-3xl border border-white/20 p-8 md:grid-cols-2 md:p-12 shadow-2xl shadow-blue-900/30"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 100%)", backdropFilter: "blur(20px)" }}>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky-100">
                <Smartphone className="h-3.5 w-3.5" />
                Exclusivo iOS
              </div>

              <h2 className="mt-5 text-3xl md:text-4xl font-bold text-white leading-tight">
                Registre um gasto falando com a Siri
              </h2>

              <p className="mt-4 text-sky-100/70 leading-relaxed">
                O gasto entra na sua conta pelo app Atalhos do iPhone. Sem abrir o
                Valora, sem digitar. O lançamento aparece no painel na hora, pronto
                para você completar o cartão e a categoria quando quiser.
              </p>

              <ul className="mt-7 space-y-4">
                {IPHONE_STEPS.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex gap-3.5">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                      <Icon className="h-4 w-4 text-sky-200" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{title}</p>
                      <p className="text-sky-100/60 text-sm leading-relaxed">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/30 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
              >
                Criar conta e configurar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Simulação da conversa com a Siri */}
            <div className="mx-auto w-full max-w-[280px]">
              <div className="rounded-[2.2rem] border-[6px] border-white/20 bg-blue-950/50 p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-md">
                <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/20" />

                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white/90 px-3.5 py-2.5">
                  <p className="text-[13px] font-medium leading-snug text-blue-900">
                    Ei Siri, registrar gasto
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-sky-200/70">
                  <Mic className="h-3.5 w-3.5" />
                  Mercado, 84 reais
                </div>

                <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/20">
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <p className="text-xs font-semibold text-white">Gasto registrado</p>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-sm text-white/80">Mercado</span>
                    <span className="text-base font-bold text-red-300">R$ 84,00</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/40">Hoje · aguardando cartão</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="como-funciona" className="relative z-10 px-6 md:px-12 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Simples de começar
              </h2>
              <p className="text-sky-100/60 text-lg">
                Do cadastro ao primeiro relatório em minutos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {STEPS.map((step, i) => (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-white/15" />
                  )}
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-sm shadow-lg">
                    <span className="font-display text-2xl text-white tracking-wide">{step.number}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-sky-100/60 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative z-10 px-6 md:px-12 pb-24">
          <div className="max-w-2xl mx-auto text-center rounded-3xl border border-white/20 p-10 md:p-14 shadow-2xl shadow-blue-900/30"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)", backdropFilter: "blur(20px)" }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comece hoje mesmo
            </h2>
            <p className="text-sky-100/70 text-lg mb-8 leading-relaxed">
              Crie sua conta gratuita na Valora Finanças e tenha controle total das suas finanças pessoais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-sky-50 font-bold px-8 py-4 rounded-full text-base transition-all shadow-xl hover:-translate-y-0.5"
              >
                <Check className="h-4 w-4" />
                Criar conta gratuita
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 border border-white/25 text-white hover:bg-white/10 font-medium px-8 py-4 rounded-full text-base transition-all"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 border-t border-white/10 px-6 md:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <Image src="/logo-valora-branca.png" alt="Valora Finanças" width={28} height={28} className="size-7 opacity-70" />
              <span className="text-sky-200/50 text-sm">Valora Finanças · valorafinancas.com</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-sky-200/40">
              <Link href="/login" className="hover:text-sky-200/70 transition-colors">Entrar</Link>
              <Link href="/register" className="hover:text-sky-200/70 transition-colors">Criar conta</Link>
              <span>© {new Date().getFullYear()} Valora Finanças</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
