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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function DocsPage() {
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
          <SwaggerUI url={`${API_URL}/docs-json`} docExpansion="list" />
        </CardContent>
      </Card>
    </PageShell>
  );
}
