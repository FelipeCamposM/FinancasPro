"use client";

import dynamic from "next/dynamic";

// swagger-ui-react não suporta SSR
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

// O CSS do Swagger UI precisa ser importado globalmente;
// fazemos isso via import side-effect aqui mesmo
import "swagger-ui-react/swagger-ui.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Documentação da API
          </h1>
          <p className="text-sm text-slate-500">
            Gerenciar Gastos — OpenAPI 3.0
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-sm text-green-600 hover:underline font-medium"
        >
          ← Voltar ao Dashboard
        </a>
      </div>

      <SwaggerUI url={`${API_URL}/docs-json`} docExpansion="list" />
    </div>
  );
}
