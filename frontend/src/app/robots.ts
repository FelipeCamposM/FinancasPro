import { MetadataRoute } from "next";

/**
 * Só as páginas públicas entram no índice. Tudo que fica atrás de login,
 * as telas de fluxo (links de uso único) e a API ficam de fora — o backend
 * responde no mesmo domínio (ver vercel.json), então `/api/` precisa constar.
 */
const ROTAS_PRIVADAS = [
  "/dashboard",
  "/gastos",
  "/renda",
  "/cartoes",
  "/assinaturas",
  "/assinatura",
  "/cofrinhos",
  "/relatorios",
  "/configuracoes",
  "/perfil",
  "/admin",
  "/docs",
];

const ROTAS_DE_FLUXO = ["/verify-email", "/reset-password", "/forgot-password"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        ...ROTAS_PRIVADAS.flatMap((r) => [r, `${r}/`]),
        ...ROTAS_DE_FLUXO,
      ],
    },
    sitemap: "https://valorafinancas.com/sitemap.xml",
    host: "https://valorafinancas.com",
  };
}
