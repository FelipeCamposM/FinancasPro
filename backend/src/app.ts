import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import rateLimit from "express-rate-limit";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { authenticate, requireAdmin } from "./middlewares/auth.middleware";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import categoriasRoutes from "./routes/categorias.routes";
import cartoesRoutes from "./routes/cartoes.routes";
import gastosRoutes from "./routes/gastos.routes";
import parcelasRoutes from "./routes/parcelas.routes";
import rendaRoutes from "./routes/renda.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import assinaturasRoutes from "./routes/assinaturas.routes";
import routeMapRoutes from "./routes/route-map.routes";
import shortcutRoutes from "./routes/shortcut.routes";
import cofrinhosRoutes from "./routes/cofrinhos.routes";
import relatoriosRoutes from "./routes/relatorios.routes";
import adminRoutes from "./routes/admin.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import pluggyRoutes from "./routes/pluggy.routes";
import openfinanceRoutes from "./routes/openfinance.routes";

const app = express();
const emProducao = process.env.NODE_ENV === "production";

// Atrás do proxy da Vercel o IP real vem no X-Forwarded-For; sem isso o
// rate limit trata todo mundo como o mesmo cliente.
app.set("trust proxy", 1);

app.use(helmet());
app.use(morgan("dev"));

// Origens liberadas em produção. CORS_ORIGIN aceita lista separada por vírgula;
// o apex e o www são domínios diferentes para o navegador, então os dois entram.
const ORIGENS_PADRAO = [
  "https://valorafinancas.com",
  "https://www.valorafinancas.com",
];
const origensConfiguradas = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const origensPermitidas = origensConfiguradas.length
  ? origensConfiguradas
  : ORIGENS_PADRAO;

// Deploys de preview da Vercel mudam de subdomínio a cada build; liberá-los
// por padrão mantém o fluxo de teste funcionando sem afrouxar o domínio final.
const ehPreviewVercel = (origem: string) =>
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origem);

app.use(
  cors({
    origin: (origem, callback) => {
      // Sem Origin: curl, apps nativos e o atalho do iPhone
      if (!origem) return callback(null, true);
      if (!emProducao) return callback(null, true);
      if (origensPermitidas.includes(origem)) return callback(null, true);
      if (ehPreviewVercel(origem)) return callback(null, true);
      return callback(new Error(`Origem não permitida pelo CORS: ${origem}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));

// Health check (antes do rate limit: é usado por monitoramento)
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

// ── Rate limiting ────────────────────────────────────────────────
// Autenticação é o alvo de força bruta; o resto da API leva um teto
// folgado, só para conter varredura automatizada.
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  // O balde é compartilhado por todo /api/auth (login, código por e-mail,
  // recuperação e verificação), então 10 estoura fácil em uso legítimo.
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

const limiteGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Limite de requisições excedido. Aguarde um pouco." },
});

app.use("/api/auth", limiteAuth);
app.use("/api", limiteGeral);

// ── Documentação da API ──────────────────────────────────────────
// A UI do swagger-ui-express não tem como mandar Bearer token, então em
// produção ela não sobe: a documentação fica na página /docs do frontend,
// que é restrita a admin e busca o spec autenticado em /api/docs-json.
if (!emProducao) {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Gerenciar Gastos — API Docs",
    }),
  );
}

// Spec bruto: só admin autenticado (evita expor o mapa da API ao público)
app.get("/api/docs-json", authenticate, requireAdmin, (_req, res) =>
  res.json(swaggerSpec),
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/cartoes", cartoesRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/parcelas", parcelasRoutes);
app.use("/api/renda", rendaRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assinaturas", assinaturasRoutes);
app.use("/api/route-map", routeMapRoutes);
app.use("/api/shortcut", shortcutRoutes);
app.use("/api/cofrinhos", cofrinhosRoutes);
app.use("/api/relatorios", relatoriosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/pluggy", pluggyRoutes);
app.use("/api/openfinance", openfinanceRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

export default app;
