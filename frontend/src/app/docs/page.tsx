"use client";

import dynamic from "next/dynamic";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

// swagger-ui-react não suporta SSR
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

// O CSS do Swagger UI precisa ser importado globalmente;
// fazemos isso via import side-effect aqui mesmo
import "swagger-ui-react/swagger-ui.css";

function getApiBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  if (typeof window === "undefined") {
    return configuredUrl;
  }

  try {
    const url = new URL(configuredUrl);
    const isLocalhostApi =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isRemoteBrowser =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (isLocalhostApi && isRemoteBrowser) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
}

export default function DocsPage() {
  const apiUrl = getApiBaseUrl();

  return (
    <PageShell className="min-h-screen">
      <SectionHeader
        title="Documentação da API"
        description="Gerenciar Gastos - OpenAPI 3.0"
        actions={
          <Link
            className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-blue-300 transition hover:bg-white/[0.10] hover:text-blue-200"
            href="/dashboard"
          >
            Voltar ao Dashboard
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <SwaggerUI url={`${apiUrl}/docs-json`} docExpansion="list" />
        </CardContent>
      </Card>
    </PageShell>
  );
}
