import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import {
  getRouteMapData,
  getRouteMapPage,
} from "../controllers/route-map.controller";
import { authenticate } from "../middlewares/auth.middleware";
import pool from "../config/database";
import { renderRouteMapLoginPage } from "../views/route-map-login.page";

const router = Router();
const ROUTE_MAP_SESSION_COOKIE = "route_map_session";

const routeMapCspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
  "frame-ancestors 'none'",
].join("; ");

router.use((_req, res, next) => {
  // Helmet aplica CSP global; aqui sobrescrevemos apenas para a área interna do route-map.
  res.setHeader("Content-Security-Policy", routeMapCspDirectives);
  next();
});

function parseCookies(headerValue: string | undefined): Record<string, string> {
  if (!headerValue) {
    return {};
  }

  return headerValue
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, item) => {
      const separatorIndex = item.indexOf("=");
      if (separatorIndex <= 0) {
        return acc;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();
      if (!key) {
        return acc;
      }

      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function hasRouteMapSession(req: Request): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[ROUTE_MAP_SESSION_COOKIE] === "1";
}

/**
 * @swagger
 * /route-map/login:
 *   get:
 *     tags: [RouteMap]
 *     summary: Pagina de login interno do route-map
 *     security: []
 *     responses:
 *       200:
 *         description: Pagina HTML de login
 *   post:
 *     tags: [RouteMap]
 *     summary: Autentica no route-map com credenciais internas
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string, example: admin }
 *               password: { type: string, example: admin }
 *     responses:
 *       302:
 *         description: Login aceito e redireciona para /api/route-map
 *
 * /route-map/logout:
 *   post:
 *     tags: [RouteMap]
 *     summary: Finaliza sessao interna do route-map
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       302:
 *         description: Sessao encerrada e redireciona para /api/route-map/login
 */
router.get("/login", (req, res) => {
  if (hasRouteMapSession(req)) {
    res.redirect("/api/route-map");
    return;
  }

  const html = renderRouteMapLoginPage({
    error:
      typeof req.query.error === "string" && req.query.error.trim().length > 0
        ? req.query.error.trim()
        : undefined,
  });

  res.type("html").send(html);
});

router.post("/login", (req, res) => {
  const username =
    typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password.trim() : "";

  if (username !== "admin" || password !== "admin") {
    const html = renderRouteMapLoginPage({
      error: "Credenciais invalidas.",
    });
    res.status(401).type("html").send(html);
    return;
  }

  const cookieParts = [
    `${ROUTE_MAP_SESSION_COOKIE}=1`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=28800",
  ];
  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
  res.redirect("/api/route-map");
});

const authenticateInternalRouteMap = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (hasRouteMapSession(req)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    authenticate(req, res, next);
    return;
  }

  const apiKeyFromHeader =
    typeof req.headers["x-api-key"] === "string"
      ? req.headers["x-api-key"].trim()
      : null;

  const apiKeyFromAuthorization = authHeader?.startsWith("ApiKey ")
    ? authHeader.slice(7).trim()
    : null;

  const routeMapApiKey = apiKeyFromHeader || apiKeyFromAuthorization;
  if (!routeMapApiKey) {
    res.status(401).json({ error: "Autenticacao requerida para route-map" });
    return;
  }

  const staticInternalKey = process.env.ROUTE_MAP_API_KEY?.trim();
  if (staticInternalKey && routeMapApiKey === staticInternalKey) {
    next();
    return;
  }

  try {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE api_key = $1 LIMIT 1",
      [routeMapApiKey],
    );

    if (!rows[0]) {
      res.status(401).json({ error: "API key invalida" });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};

router.use(authenticateInternalRouteMap);

router.post("/logout", (_req, res) => {
  const cookieParts = [
    `${ROUTE_MAP_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  res.setHeader("Set-Cookie", cookieParts.join("; "));
  res.redirect("/api/route-map/login");
});

/**
 * @swagger
 * tags:
 *   name: RouteMap
 *   description: Mapa de rotas da API
 */

/**
 * @swagger
 * /route-map:
 *   get:
 *     tags: [RouteMap]
 *     summary: Pagina React SSR com mapa de rotas
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Pagina HTML do mapa de rotas
 */
router.get("/", getRouteMapPage);

/**
 * @swagger
 * /route-map/data:
 *   get:
 *     tags: [RouteMap]
 *     summary: Retorna dados do mapa de rotas em JSON
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: method
 *         schema: { type: string, example: GET }
 *       - in: query
 *         name: path
 *         schema: { type: string, example: /api/gastos }
 *       - in: query
 *         name: auth
 *         schema: { type: string, enum: [sim, nao] }
 *     responses:
 *       200:
 *         description: Lista de rotas da API
 */
router.get("/data", getRouteMapData);

export default router;
