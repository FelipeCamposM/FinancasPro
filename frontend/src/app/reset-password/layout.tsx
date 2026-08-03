import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redefinir senha",
  description:
    "Defina uma nova senha para a sua conta.",
  // Página de fluxo (link de uso único): fora do índice
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
