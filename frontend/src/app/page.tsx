import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  BarChart3,
  Check,
  Shield,
  Zap,
  PieChart,
  Bell,
  ArrowRight,
  Wallet,
  RefreshCcw,
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
      "Netflix, Spotify, academia — visualize tudo em um painel e elimine cobranças esquecidas.",
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
        <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-sky-100 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Gratuito para começar — sem cartão de crédito
          </div>

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

          {/* Mock dashboard preview */}
          <div className="w-full max-w-3xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-2xl shadow-blue-900/40">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-3 w-3 rounded-full bg-red-400/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-xs text-white/40">valorafinancas.com/dashboard</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Saldo do mês", value: "R$ 2.840", color: "text-emerald-300" },
                { label: "Total gasto", value: "R$ 1.960", color: "text-red-300" },
                { label: "Renda", value: "R$ 4.800", color: "text-sky-200" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/10 border border-white/10 p-3 text-left">
                  <p className="text-[10px] text-white/50 mb-1">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-white/50 mb-3">Últimos gastos</p>
              <div className="space-y-2">
                {[
                  { label: "Supermercado", cat: "Alimentação", value: "- R$ 342,00" },
                  { label: "Spotify", cat: "Assinaturas", value: "- R$ 21,90" },
                  { label: "Academia", cat: "Saúde", value: "- R$ 99,00" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-white/80">{item.label}</span>
                      <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] bg-white/10 text-white/40">{item.cat}</span>
                    </div>
                    <span className="text-red-300 font-medium">{item.value}</span>
                  </div>
                ))}
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
              <span className="text-sky-200/50 text-sm">Valora Finanças — valorafinancas.com</span>
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
