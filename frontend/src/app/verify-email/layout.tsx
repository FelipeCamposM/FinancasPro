import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmar e-mail",
  description:
    "Confirme seu endereço de e-mail para ativar a conta.",
  // Página de fluxo (link de uso único): fora do índice
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
