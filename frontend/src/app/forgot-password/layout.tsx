import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description:
    "Receba por e-mail o link para redefinir a senha da sua conta.",
  // Página de fluxo (link de uso único): fora do índice
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
