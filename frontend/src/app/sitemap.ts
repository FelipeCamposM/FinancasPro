import { MetadataRoute } from "next";

const BASE = "https://valorafinancas.com";

/** Apenas rotas públicas e indexáveis (as privadas estão no robots.ts). */
export default function sitemap(): MetadataRoute.Sitemap {
  const atualizadoEm = new Date();

  const rotas: Omit<MetadataRoute.Sitemap[number], "lastModified">[] = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/register`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/login`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/termos-de-uso`, changeFrequency: "yearly", priority: 0.3 },
    {
      url: `${BASE}/politica-de-privacidade`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return rotas.map((rota) => ({ ...rota, lastModified: atualizadoEm }));
}
