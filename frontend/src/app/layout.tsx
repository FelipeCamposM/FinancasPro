import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { AppBackground } from "@/components/AppBackground";
import { Toaster } from "@/components/ui/sonner";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Valora Finanças | Controle Financeiro Pessoal",
    template: "%s | Valora Finanças",
  },
  description:
    "Valora Finanças — controle inteligente de gastos, renda, cartões e assinaturas. Organize suas finanças pessoais em um só lugar. Acesse valorafinancas.com.",
  keywords: [
    "Valora Finanças",
    "Valora Financas",
    "ValoraFinanças",
    "valorafinancas",
    "valora financas",
    "controle financeiro pessoal",
    "gerenciar gastos",
    "organizar finanças",
    "controle de gastos",
    "cartões de crédito",
    "assinaturas recorrentes",
    "dashboard financeiro",
    "renda e despesas",
    "parcelas",
    "finanças pessoais",
  ],
  authors: [{ name: "Valora Finanças" }],
  creator: "Valora Finanças",
  publisher: "Valora Finanças",
  metadataBase: new URL("https://valorafinancas.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://valorafinancas.com",
    siteName: "Valora Finanças",
    title: "Valora Finanças | Controle Financeiro Pessoal",
    description:
      "Controle inteligente de gastos, renda, cartões e assinaturas. Organize suas finanças pessoais em um só lugar com Valora Finanças.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Valora Finanças — Controle Financeiro Pessoal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Valora Finanças | Controle Financeiro Pessoal",
    description:
      "Controle inteligente de gastos, renda, cartões e assinaturas. Organize suas finanças pessoais.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Código do Search Console via env: trocar não exige mexer no código
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  applicationName: "Valora Finanças",
  category: "finance",
  manifest: "/manifest.webmanifest",
};

// No Next 14 viewport e themeColor saem do metadata
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1020" },
    { media: "(prefers-color-scheme: light)", color: "#1d4ed8" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${bebasNeue.variable} ${inter.variable}`}>
        <AppBackground />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
