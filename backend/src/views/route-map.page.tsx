import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RouteMapItem } from "../utils/route-map";

interface RouteMapPageProps {
  generatedAt: string;
  routes: RouteMapItem[];
}

function RouteMapPage({ generatedAt, routes }: RouteMapPageProps) {
  const methods = Array.from(
    new Set(routes.map((route) => route.method)),
  ).sort();

  const groups = Array.from(new Set(routes.map((route) => route.group))).sort();

  const routesByGroup = groups.map((group) => ({
    group,
    routes: routes.filter((route) => route.group === group),
  }));

  const pageScript = `
    (() => {
      const searchInput = document.getElementById("routeSearch");
      const methodSelect = document.getElementById("methodFilter");
      const authSelect = document.getElementById("authFilter");
      const cards = Array.from(document.querySelectorAll("[data-api-card='true']"));
      const groupSections = Array.from(document.querySelectorAll("[data-group-section='true']"));
      const navButtons = Array.from(document.querySelectorAll("[data-nav-route='true']"));
      const visibleCount = document.getElementById("visibleCount");
      const totalCount = document.getElementById("totalCount");
      const noResults = document.getElementById("noResults");

      if (!searchInput || !methodSelect || !authSelect) {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const q = params.get("q") || "";
      const method = params.get("method") || "";
      const auth = params.get("auth") || "";

      searchInput.value = q;
      methodSelect.value = method;
      authSelect.value = auth;

      function normalize(text) {
        return (text || "").toLowerCase();
      }

      function applyFilters() {
        const query = normalize(searchInput.value);
        const selectedMethod = methodSelect.value;
        const selectedAuth = authSelect.value;

        let shown = 0;
        for (const card of cards) {
          const method = card.getAttribute("data-method") || "";
          const path = card.getAttribute("data-path") || "";
          const auth = card.getAttribute("data-auth") || "";
          const middleware = card.getAttribute("data-middleware") || "";
          const summary = card.getAttribute("data-summary") || "";

          const matchesMethod = !selectedMethod || method === selectedMethod;
          const matchesAuth = !selectedAuth || auth === selectedAuth;
          const haystack = normalize(
            method + " " + path + " " + middleware + " " + summary,
          );
          const matchesQuery = !query || haystack.includes(query);

          const visible = matchesMethod && matchesAuth && matchesQuery;
          card.style.display = visible ? "" : "none";
          if (visible) shown++;
        }

        for (const section of groupSections) {
          const visibleCards = section.querySelectorAll("[data-api-card='true']:not([style*='display: none'])");
          section.style.display = visibleCards.length > 0 ? "" : "none";
        }

        if (visibleCount) visibleCount.textContent = String(shown);
        if (totalCount) totalCount.textContent = String(cards.length);
        if (noResults) noResults.style.display = shown === 0 ? "" : "none";

        const newParams = new URLSearchParams();
        if (query) newParams.set("q", query);
        if (selectedMethod) newParams.set("method", selectedMethod);
        if (selectedAuth) newParams.set("auth", selectedAuth);

        const nextUrl = newParams.toString()
          ? window.location.pathname + "?" + newParams.toString()
          : window.location.pathname;
        window.history.replaceState({}, "", nextUrl);
      }

      for (const button of navButtons) {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          const routePath = button.getAttribute("data-route-path") || "";
          const routeMethod = button.getAttribute("data-route-method") || "";
          searchInput.value = routePath;
          methodSelect.value = routeMethod;
          applyFilters();
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
      }

      searchInput.addEventListener("input", applyFilters);
      methodSelect.addEventListener("change", applyFilters);
      authSelect.addEventListener("change", applyFilters);

      applyFilters();
    })();
  `;

  const methodBadgeClasses: Record<string, string> = {
    GET: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40",
    POST: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/40",
    PUT: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/40",
    PATCH: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/40",
    DELETE: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/40",
  };

  function getMethodClass(method: string): string {
    return (
      methodBadgeClasses[method] ||
      "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/40"
    );
  }

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Mapa de Rotas da API</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          @keyframes float-blob {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(24px, -18px) scale(1.08); }
            100% { transform: translate(0, 0) scale(1); }
          }
          .blob-a { animation: float-blob 12s ease-in-out infinite; }
          .blob-b { animation: float-blob 16s ease-in-out infinite reverse; }
          .blob-c { animation: float-blob 20s ease-in-out infinite; }
        `}</style>
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="blob-a absolute -top-24 -left-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="blob-b absolute top-1/3 -right-12 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"></div>
          <div className="blob-c absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
        </div>

        <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-6 lg:grid-cols-[320px,1fr]">
          <aside className="h-fit rounded-2xl border border-slate-800/80 bg-slate-900/85 p-4 backdrop-blur lg:sticky lg:top-4">
            <h2 className="text-lg font-semibold text-slate-100">
              Navegacao de Topicos
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Use os topicos para expandir e localizar rapidamente cada rota.
            </p>

            <div className="mt-4 space-y-2">
              {routesByGroup.map((groupBlock) => (
                <details
                  className="rounded-lg border border-slate-800/80 bg-slate-950/60"
                  key={groupBlock.group}
                >
                  <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-wide">
                        {groupBlock.group}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {groupBlock.routes.length}
                      </span>
                    </div>
                  </summary>
                  <div className="space-y-1 border-t border-slate-800/80 p-2">
                    {groupBlock.routes.map((route) => (
                      <button
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-slate-300 transition hover:bg-slate-800/70 hover:text-slate-100"
                        data-nav-route="true"
                        data-route-method={route.method}
                        data-route-path={route.path}
                        key={`nav-${route.method}-${route.path}`}
                        type="button"
                      >
                        <span className="truncate pr-2">{route.path}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getMethodClass(route.method)}`}
                        >
                          {route.method}
                        </span>
                      </button>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </aside>

          <section>
            <header className="rounded-2xl border border-slate-800/80 bg-slate-900/85 p-5 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold">
                    Mapa de Rotas da Aplicacao
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    React SSR no backend. Atualizado em {generatedAt}
                  </p>
                </div>
                <form action="/api/route-map/logout" method="post">
                  <button
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
                    type="submit"
                  >
                    Sair
                  </button>
                </form>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                Endpoint JSON:{" "}
                <a
                  className="text-cyan-400 hover:text-cyan-300"
                  href="/api/route-map/data"
                >
                  /api/route-map/data
                </a>
              </p>

              <section className="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label
                    className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
                    htmlFor="routeSearch"
                  >
                    Busca
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    id="routeSearch"
                    placeholder="Buscar por metodo, rota, middleware ou descricao"
                    type="text"
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
                    htmlFor="methodFilter"
                  >
                    Metodo
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    id="methodFilter"
                  >
                    <option value="">Todos</option>
                    {methods.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
                    htmlFor="authFilter"
                  >
                    Autenticacao
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    id="authFilter"
                  >
                    <option value="">Todas</option>
                    <option value="sim">Protegida</option>
                    <option value="nao">Publica</option>
                  </select>
                </div>
              </section>

              <div className="mt-3 text-sm text-slate-400">
                Exibindo{" "}
                <span className="font-medium text-slate-100" id="visibleCount">
                  0
                </span>{" "}
                de{" "}
                <span className="font-medium text-slate-100" id="totalCount">
                  {routes.length}
                </span>{" "}
                rotas
              </div>
            </header>

            <div className="mt-4 space-y-5">
              {routesByGroup.map((groupBlock) => (
                <section
                  className="space-y-3"
                  data-group-section="true"
                  data-group={groupBlock.group}
                  key={`section-${groupBlock.group}`}
                >
                  <h3 className="rounded-lg border border-slate-800/80 bg-slate-900/70 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
                    {groupBlock.group}
                  </h3>

                  {groupBlock.routes.map((route) => {
                    const middlewareText = route.middlewares.join(" | ");
                    return (
                      <article
                        className="rounded-2xl border border-slate-800/80 bg-slate-900/75 p-4 shadow-lg shadow-black/20 backdrop-blur"
                        data-api-card="true"
                        data-auth={route.authRequired ? "sim" : "nao"}
                        data-method={route.method}
                        data-middleware={middlewareText}
                        data-path={route.path}
                        data-summary={route.summary}
                        key={`${route.method}-${route.path}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-1 text-xs font-semibold ${getMethodClass(route.method)}`}
                            >
                              {route.method}
                            </span>
                            <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">
                              {route.authRequired ? "Protegida" : "Publica"}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            grupo: {route.group}
                          </span>
                        </div>

                        <div className="mt-3 font-mono text-xs text-cyan-300">
                          {route.path}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">
                          {route.summary}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1">
                          {route.middlewares.length > 0 ? (
                            route.middlewares.map((middleware) => (
                              <span
                                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300"
                                key={`${route.method}-${route.path}-${middleware}`}
                              >
                                {middleware}
                              </span>
                            ))
                          ) : (
                            <span className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-500">
                              sem middlewares especificos
                            </span>
                          )}
                        </div>

                        <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                          <summary className="cursor-pointer text-sm font-medium text-slate-200">
                            Forma de utilizacao (headers, request e response)
                          </summary>

                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div>
                              <h4 className="text-xs uppercase tracking-wide text-slate-400">
                                Headers
                              </h4>
                              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                {(route.usage?.headers || []).length > 0 ? (
                                  (route.usage?.headers || []).map(
                                    (line, index) => (
                                      <li
                                        className="rounded border border-slate-800 bg-slate-900 px-2 py-1"
                                        key={`${route.path}-h-${index}`}
                                      >
                                        {line}
                                      </li>
                                    ),
                                  )
                                ) : (
                                  <li className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-slate-500">
                                    Sem headers especificos
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-xs uppercase tracking-wide text-slate-400">
                                Request
                              </h4>
                              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                {(route.usage?.request || []).length > 0 ? (
                                  (route.usage?.request || []).map(
                                    (line, index) => (
                                      <li
                                        className="rounded border border-slate-800 bg-slate-900 px-2 py-1"
                                        key={`${route.path}-rq-${index}`}
                                      >
                                        {line}
                                      </li>
                                    ),
                                  )
                                ) : (
                                  <li className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-slate-500">
                                    Sem detalhes de request
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-xs uppercase tracking-wide text-slate-400">
                                Response
                              </h4>
                              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                {(route.usage?.response || []).length > 0 ? (
                                  (route.usage?.response || []).map(
                                    (line, index) => (
                                      <li
                                        className="rounded border border-slate-800 bg-slate-900 px-2 py-1"
                                        key={`${route.path}-rs-${index}`}
                                      >
                                        {line}
                                      </li>
                                    ),
                                  )
                                ) : (
                                  <li className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-slate-500">
                                    Sem detalhes de response
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </details>
                      </article>
                    );
                  })}
                </section>
              ))}

              <div
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-8 text-center text-slate-400"
                id="noResults"
                style={{ display: "none" }}
              >
                Nenhuma rota encontrada para os filtros aplicados.
              </div>
            </div>
          </section>
        </main>
        <script dangerouslySetInnerHTML={{ __html: pageScript }}></script>
      </body>
    </html>
  );
}

export function renderRouteMapPage(props: RouteMapPageProps): string {
  return `<!doctype html>${renderToStaticMarkup(<RouteMapPage {...props} />)}`;
}
