import { MetadataRoute } from "next";

/** Manifesto PWA: melhora o resultado mobile e permite instalar o app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Valora Finanças",
    short_name: "Valora",
    description:
      "Controle de gastos, renda, cartões e assinaturas em um único painel.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a1020",
    theme_color: "#1d4ed8",
    lang: "pt-BR",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/logo-valora.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
