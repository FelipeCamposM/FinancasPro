"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useUser } from "@/contexts/UserContext";

// swagger-ui-react não suporta SSR
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

// O CSS do Swagger UI precisa ser importado globalmente;
// fazemos isso via import side-effect aqui mesmo
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [spec, setSpec] = useState<object | null>(null);

  const ehAdmin = user?.user_level === "admin";

  useEffect(() => {
    if (!userLoading && !ehAdmin) router.replace("/dashboard");
  }, [ehAdmin, userLoading, router]);

  // O spec é buscado pelo cliente HTTP para levar o Bearer token: /docs-json
  // exige admin, então passar a URL direto ao SwaggerUI daria 401.
  useEffect(() => {
    if (!ehAdmin) return;
    api
      .get<object>("/docs-json")
      .then(({ data }) => setSpec(data))
      .catch(() => setSpec(null));
  }, [ehAdmin]);

  if (userLoading || !ehAdmin) {
    return (
      <PageShell className="min-h-screen">
        <div className="flex items-center justify-center py-24 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-screen">
      <SectionHeader
        title="Documentação da API"
        description="Gerenciar Gastos - OpenAPI 3.0 (restrito a administradores)"
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
          {spec ? (
            <SwaggerUI spec={spec} docExpansion="list" />
          ) : (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando especificação...
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
