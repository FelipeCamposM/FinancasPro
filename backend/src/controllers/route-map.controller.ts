import { Request, Response } from "express";
import { buildRouteMap } from "../utils/route-map";
import { renderRouteMapPage } from "../views/route-map.page";

function parseAuthFilter(value: unknown): boolean | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (["sim", "true", "1", "auth", "protegida"].includes(normalized)) {
    return true;
  }
  if (["nao", "não", "false", "0", "publica", "pública"].includes(normalized)) {
    return false;
  }
  return null;
}

export const getRouteMapData = (_req: Request, res: Response): void => {
  const routeMap = buildRouteMap();
  const methodFilter =
    typeof _req.query.method === "string"
      ? _req.query.method.trim().toUpperCase()
      : "";
  const pathFilter =
    typeof _req.query.path === "string"
      ? _req.query.path.trim().toLowerCase()
      : "";
  const authFilter = parseAuthFilter(_req.query.auth);

  const filteredRoutes = routeMap.routes.filter((route) => {
    if (methodFilter && route.method !== methodFilter) {
      return false;
    }
    if (pathFilter && !route.path.toLowerCase().includes(pathFilter)) {
      return false;
    }
    if (authFilter !== null && route.authRequired !== authFilter) {
      return false;
    }
    return true;
  });

  res.json({
    data: filteredRoutes,
    meta: {
      generatedAt: routeMap.generatedAt,
      total: filteredRoutes.length,
      totalUnfiltered: routeMap.routes.length,
      filters: {
        method: methodFilter || null,
        path: pathFilter || null,
        authRequired: authFilter,
      },
    },
  });
};

export const getRouteMapPage = (_req: Request, res: Response): void => {
  const routeMap = buildRouteMap();

  const html = renderRouteMapPage({
    generatedAt: routeMap.generatedAt,
    routes: routeMap.routes,
  });

  res.type("html").send(html);
};
