import type { Metadata } from "next";
import "./globals.css";
import { SilkBackground } from "@/components/SilkBackground";

export const metadata: Metadata = {
  title: "Gerenciar Gastos",
  description: "Dashboard de controle financeiro pessoal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SilkBackground />
        {children}
      </body>
    </html>
  );
}
