import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middlewares/errorHandler.middleware";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import categoriasRoutes from "./routes/categorias.routes";
import cartoesRoutes from "./routes/cartoes.routes";
import gastosRoutes from "./routes/gastos.routes";
import parcelasRoutes from "./routes/parcelas.routes";
import rendaRoutes from "./routes/renda.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));

// Health check
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

// Swagger UI
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Gerenciar Gastos — API Docs",
  }),
);
// Expose raw OpenAPI JSON (used pelo frontend swagger-ui-react)
app.get("/api/docs-json", (_req, res) => res.json(swaggerSpec));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/cartoes", cartoesRoutes);
app.use("/api/gastos", gastosRoutes);
app.use("/api/parcelas", parcelasRoutes);
app.use("/api/renda", rendaRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

export default app;
