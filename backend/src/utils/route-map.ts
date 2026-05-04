import { swaggerSpec } from "../config/swagger";
import fs from "fs";
import path from "path";

interface SwaggerParameter {
  in?: string;
  name?: string;
  required?: boolean;
  schema?: { type?: string };
}

interface SwaggerRequestBody {
  required?: boolean;
  content?: Record<string, { schema?: { required?: string[] } }>;
}

interface SwaggerResponse {
  description?: string;
  content?: Record<string, unknown>;
}

interface SwaggerOperation {
  summary?: string;
  security?: unknown[];
  parameters?: SwaggerParameter[];
  requestBody?: SwaggerRequestBody;
  responses?: Record<string, SwaggerResponse>;
}

interface SwaggerSpecLite {
  paths?: Record<string, Record<string, SwaggerOperation>>;
  security?: unknown[];
}

export interface RouteMapUsage {
  headers: string[];
  request: string[];
  response: string[];
}

export interface RouteMapItem {
  method: string;
  path: string;
  summary: string;
  authRequired: boolean;
  middlewares: string[];
  group: string;
  usage: RouteMapUsage;
}

interface RouteMapResult {
  generatedAt: string;
  routes: RouteMapItem[];
}

interface RouterMount {
  mountPath: string;
  fileName: string;
}

const ROUTER_MOUNTS: RouterMount[] = [
  { mountPath: "/api/auth", fileName: "auth.routes" },
  { mountPath: "/api/users", fileName: "users.routes" },
  { mountPath: "/api/categorias", fileName: "categorias.routes" },
  { mountPath: "/api/cartoes", fileName: "cartoes.routes" },
  { mountPath: "/api/gastos", fileName: "gastos.routes" },
  { mountPath: "/api/parcelas", fileName: "parcelas.routes" },
  { mountPath: "/api/renda", fileName: "renda.routes" },
  { mountPath: "/api/dashboard", fileName: "dashboard.routes" },
  { mountPath: "/api/assinaturas", fileName: "assinaturas.routes" },
  { mountPath: "/api/route-map", fileName: "route-map.routes" },
];

function ensureApiPrefix(pathname: string): string {
  if (pathname.startsWith("/api")) {
    return pathname;
  }
  if (pathname.startsWith("/")) {
    return `/api${pathname}`;
  }
  return `/api/${pathname}`;
}

function extractGroupFromPath(pathname: string): string {
  const parts = normalizePath(pathname).split("/").filter(Boolean);
  if (parts.length < 2) {
    return "geral";
  }
  return parts[1] || "geral";
}

function mergeUnique(items: string[]): string[] {
  return Array.from(
    new Set(items.filter((item) => item && item.trim().length > 0)),
  );
}

function collectSecurityHeaders(
  operationSecurity: unknown[] | undefined,
  globalSecurity: unknown[] | undefined,
): string[] {
  const effectiveSecurity =
    Array.isArray(operationSecurity) && operationSecurity.length > 0
      ? operationSecurity
      : Array.isArray(operationSecurity) && operationSecurity.length === 0
        ? []
        : (globalSecurity ?? []);

  if (!Array.isArray(effectiveSecurity) || effectiveSecurity.length === 0) {
    return [];
  }

  const headers: string[] = [];
  for (const securityEntry of effectiveSecurity) {
    if (!securityEntry || typeof securityEntry !== "object") {
      continue;
    }

    const schemes = Object.keys(securityEntry as Record<string, unknown>);
    for (const scheme of schemes) {
      if (scheme === "bearerAuth") {
        headers.push("Authorization: Bearer <token>");
      } else if (scheme === "apiKeyAuth") {
        headers.push("x-api-key: <api_key>");
      } else {
        headers.push(`Auth scheme: ${scheme}`);
      }
    }
  }

  return mergeUnique(headers);
}

function collectRequestDetails(operation: SwaggerOperation | undefined): {
  headerParams: string[];
  requestLines: string[];
} {
  if (!operation) {
    return { headerParams: [], requestLines: [] };
  }

  const headerParams: string[] = [];
  const requestLines: string[] = [];

  const parameters = Array.isArray(operation.parameters)
    ? operation.parameters
    : [];
  for (const param of parameters) {
    const location = param.in || "query";
    const name = param.name || "param";
    const required = param.required ? "obrigatorio" : "opcional";
    const type = param.schema?.type ? ` (${param.schema?.type})` : "";

    if (location === "header") {
      headerParams.push(`${name}${type} - ${required}`);
      continue;
    }

    requestLines.push(`${location}: ${name}${type} - ${required}`);
  }

  if (operation.requestBody) {
    const contentTypes = Object.keys(operation.requestBody.content || {});
    if (contentTypes.length > 0) {
      requestLines.push(`body content-type: ${contentTypes.join(", ")}`);
    }

    const requiredFields = mergeUnique(
      contentTypes.flatMap(
        (contentType) =>
          operation.requestBody?.content?.[contentType]?.schema?.required || [],
      ),
    );
    if (requiredFields.length > 0) {
      requestLines.push(
        `body campos obrigatorios: ${requiredFields.join(", ")}`,
      );
    }
  }

  return {
    headerParams: mergeUnique(headerParams),
    requestLines: mergeUnique(requestLines),
  };
}

function collectResponseDetails(
  operation: SwaggerOperation | undefined,
): string[] {
  if (!operation?.responses) {
    return ["Sem resposta documentada"];
  }

  const lines: string[] = [];
  for (const [statusCode, response] of Object.entries(operation.responses)) {
    const description = response?.description || "Sem descricao";
    const contentTypes = Object.keys(response?.content || {});
    if (contentTypes.length > 0) {
      lines.push(`${statusCode}: ${description} [${contentTypes.join(", ")}]`);
    } else {
      lines.push(`${statusCode}: ${description}`);
    }
  }

  return mergeUnique(lines);
}

function normalizePath(pathname: string): string {
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+/g, "/");
}

function joinPaths(base: string, segment: string): string {
  if (segment === "/") {
    return normalizePath(base);
  }
  return normalizePath(`${base}/${segment}`);
}

function splitTopLevelArgs(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === "(") depthParen++;
    if (char === ")") depthParen--;
    if (char === "[") depthBracket++;
    if (char === "]") depthBracket--;
    if (char === "{") depthBrace++;
    if (char === "}") depthBrace--;

    if (
      char === "," &&
      depthParen === 0 &&
      depthBracket === 0 &&
      depthBrace === 0
    ) {
      const trimmed = current.trim();
      if (trimmed) args.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) args.push(tail);

  return args;
}

function compactExpression(expression: string): string {
  return expression.replace(/\s+/g, " ").trim();
}

function resolveRouteFilePath(
  routesDir: string,
  fileName: string,
): string | null {
  const tsPath = path.join(routesDir, `${fileName}.ts`);
  if (fs.existsSync(tsPath)) {
    return tsPath;
  }

  const jsPath = path.join(routesDir, `${fileName}.js`);
  if (fs.existsSync(jsPath)) {
    return jsPath;
  }

  return null;
}

function extractMiddlewareMapFromRouteFile(
  filePath: string,
): Map<string, string[]> {
  const source = fs.readFileSync(filePath, "utf8");
  const map = new Map<string, string[]>();

  const globalMiddlewares: string[] = [];
  const routerUseRegex = /router\.use\(([^;]+)\);/g;
  for (const match of source.matchAll(routerUseRegex)) {
    const expr = compactExpression(match[1] ?? "");
    if (expr) {
      globalMiddlewares.push(expr);
    }
  }

  const routeRegex =
    /router\.(get|post|put|patch|delete|options|head)\(\s*["'`]([^"'`]+)["'`]\s*,([\s\S]*?)\);/g;

  for (const match of source.matchAll(routeRegex)) {
    const method = (match[1] ?? "").toUpperCase();
    const routePath = normalizePath(match[2] ?? "/");
    const handlersChunk = match[3] ?? "";

    const handlers = splitTopLevelArgs(handlersChunk).map(compactExpression);
    const routeMiddlewares = handlers.slice(
      0,
      Math.max(handlers.length - 1, 0),
    );

    map.set(`${method}:${routePath}`, [
      ...globalMiddlewares,
      ...routeMiddlewares,
    ]);
  }

  return map;
}

function collectMiddlewaresByRoute(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const routesDir = path.resolve(__dirname, "..", "routes");

  for (const mount of ROUTER_MOUNTS) {
    const routeFilePath = resolveRouteFilePath(routesDir, mount.fileName);
    if (!routeFilePath) {
      continue;
    }

    const localMap = extractMiddlewareMapFromRouteFile(routeFilePath);
    for (const [key, middlewares] of localMap.entries()) {
      const [method, localPath] = key.split(":");
      const fullPath = joinPaths(mount.mountPath, localPath);
      result.set(`${method}:${fullPath}`, middlewares);
    }
  }

  return result;
}

function extractSwaggerRoutes(): RouteMapItem[] {
  const middlewaresByRoute = collectMiddlewaresByRoute();
  const spec = swaggerSpec as SwaggerSpecLite;

  if (!spec.paths) {
    return [];
  }

  const httpMethods = new Set([
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
  ]);

  const routes: RouteMapItem[] = [];

  for (const [rawPath, operations] of Object.entries(spec.paths)) {
    const path = ensureApiPrefix(rawPath);

    for (const [method, operation] of Object.entries(operations)) {
      const normalizedMethod = method.toUpperCase();
      if (!httpMethods.has(method.toLowerCase())) {
        continue;
      }

      const hasOperationSecurity = Array.isArray(operation?.security);
      const authRequired = hasOperationSecurity
        ? (operation.security?.length ?? 0) > 0
        : true;

      const requestDetails = collectRequestDetails(operation);
      const securityHeaders = collectSecurityHeaders(
        operation.security,
        spec.security,
      );
      const responseDetails = collectResponseDetails(operation);

      routes.push({
        method: normalizedMethod,
        path,
        summary: operation?.summary ?? "Sem descricao",
        authRequired,
        middlewares:
          middlewaresByRoute.get(`${normalizedMethod}:${path}`) ?? [],
        group: extractGroupFromPath(path),
        usage: {
          headers: mergeUnique([
            ...securityHeaders,
            ...requestDetails.headerParams,
          ]),
          request: requestDetails.requestLines,
          response: responseDetails,
        },
      });
    }
  }

  return routes;
}

function manualRoutes(): RouteMapItem[] {
  return [
    {
      method: "GET",
      path: "/api/healthz",
      summary: "Health check",
      authRequired: false,
      middlewares: [],
      group: "healthz",
      usage: {
        headers: [],
        request: ["Sem body"],
        response: ["200: status ok"],
      },
    },
    {
      method: "GET",
      path: "/api/docs",
      summary: "Swagger UI",
      authRequired: false,
      middlewares: ["swaggerUi.serve", "swaggerUi.setup(swaggerSpec)"],
      group: "docs",
      usage: {
        headers: [],
        request: ["Sem body"],
        response: ["200: HTML Swagger"],
      },
    },
    {
      method: "GET",
      path: "/api/docs-json",
      summary: "OpenAPI JSON",
      authRequired: false,
      middlewares: [],
      group: "docs",
      usage: {
        headers: [],
        request: ["Sem body"],
        response: ["200: application/json"],
      },
    },
    {
      method: "GET",
      path: "/api/route-map/login",
      summary: "Pagina de login interno do route map",
      authRequired: false,
      middlewares: [],
      group: "route-map",
      usage: {
        headers: [],
        request: ["Sem body"],
        response: ["200: HTML login"],
      },
    },
    {
      method: "POST",
      path: "/api/route-map/login",
      summary: "Autentica com credenciais internas do route map",
      authRequired: false,
      middlewares: [],
      group: "route-map",
      usage: {
        headers: ["Content-Type: application/x-www-form-urlencoded"],
        request: ["body: username, password"],
        response: ["302: redireciona para /api/route-map"],
      },
    },
    {
      method: "POST",
      path: "/api/route-map/logout",
      summary: "Finaliza sessao interna do route map",
      authRequired: true,
      middlewares: ["authenticateInternalRouteMap"],
      group: "route-map",
      usage: {
        headers: ["Cookie: route_map_session=1 (ou Bearer/API key)"],
        request: ["Sem body"],
        response: ["302: redireciona para /api/route-map/login"],
      },
    },
    {
      method: "GET",
      path: "/api/route-map",
      summary: "Pagina React (SSR) com mapa de rotas",
      authRequired: true,
      middlewares: ["authenticateInternalRouteMap"],
      group: "route-map",
      usage: {
        headers: ["Cookie: route_map_session=1 (ou Bearer/API key)"],
        request: ["Sem body"],
        response: ["200: HTML do mapa de rotas"],
      },
    },
    {
      method: "GET",
      path: "/api/route-map/data",
      summary: "Dados JSON do mapa de rotas",
      authRequired: true,
      middlewares: ["authenticateInternalRouteMap"],
      group: "route-map",
      usage: {
        headers: ["Cookie: route_map_session=1 (ou Bearer/API key)"],
        request: ["query: method, path, auth"],
        response: ["200: application/json"],
      },
    },
  ];
}

function mergeRouteItems(a: RouteMapItem, b: RouteMapItem): RouteMapItem {
  return {
    method: a.method,
    path: a.path,
    summary: a.summary !== "Sem descricao" ? a.summary : b.summary,
    authRequired: a.authRequired || b.authRequired,
    middlewares: Array.from(new Set([...a.middlewares, ...b.middlewares])),
    group: a.group || b.group,
    usage: {
      headers: mergeUnique([
        ...(a.usage?.headers || []),
        ...(b.usage?.headers || []),
      ]),
      request: mergeUnique([
        ...(a.usage?.request || []),
        ...(b.usage?.request || []),
      ]),
      response: mergeUnique([
        ...(a.usage?.response || []),
        ...(b.usage?.response || []),
      ]),
    },
  };
}

export function buildRouteMap(): RouteMapResult {
  const byKey = new Map<string, RouteMapItem>();

  for (const route of [...extractSwaggerRoutes(), ...manualRoutes()]) {
    const key = `${route.method}:${route.path}`;
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, mergeRouteItems(existing, route));
      continue;
    }
    byKey.set(key, route);
  }

  const routes = Array.from(byKey.values()).sort((a, b) => {
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });

  return {
    generatedAt: new Date().toISOString(),
    routes,
  };
}
