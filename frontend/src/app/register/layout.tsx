import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar conta grátis",
  description:
    "Crie sua conta gratuita no Valora Finanças e organize gastos, renda, cartões e assinaturas em um só painel.",
  alternates: { canonical: "/register" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
