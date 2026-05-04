import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

interface RouteMapLoginPageProps {
  error?: string;
}

function RouteMapLoginPage({ error }: RouteMapLoginPageProps) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Login Interno - Route Map</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-8">
          <section className="w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h1 className="text-2xl font-semibold">Login Interno</h1>
            <p className="mt-2 text-sm text-slate-400">
              Acesse o mapa de rotas interno.
            </p>

            {error ? (
              <div className="mt-4 rounded-md border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            ) : null}

            <form
              action="/api/route-map/login"
              className="mt-5 space-y-4"
              method="post"
            >
              <div>
                <label
                  className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
                  htmlFor="username"
                >
                  Login
                </label>
                <input
                  autoComplete="username"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  id="username"
                  name="username"
                  placeholder="admin"
                  required
                  type="text"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-xs uppercase tracking-wide text-slate-400"
                  htmlFor="password"
                >
                  Senha
                </label>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500"
                  id="password"
                  name="password"
                  placeholder="admin"
                  required
                  type="password"
                />
              </div>

              <button
                className="w-full rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
                type="submit"
              >
                Entrar
              </button>
            </form>
          </section>
        </main>
      </body>
    </html>
  );
}

export function renderRouteMapLoginPage(
  props: RouteMapLoginPageProps = {},
): string {
  return `<!doctype html>${renderToStaticMarkup(<RouteMapLoginPage {...props} />)}`;
}
