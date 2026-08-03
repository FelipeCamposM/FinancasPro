"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { fetchPreferencias, salvarPreferencias } from "@/lib/preferencias";
import { getToken } from "@/lib/api";

/** Aplica/remove a classe que borra os valores na tela inteira. */
function aplicarNoBody(ativo: boolean) {
  document.body.classList.toggle("ui-valores-ocultos", ativo);
}

/**
 * Botão de olho no topo — esconde os valores da tela.
 * O estado inicial vem das preferências e cada clique persiste a escolha.
 */
export function PrivacidadeToggle() {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    fetchPreferencias().then((p) => {
      setOculto(p.modo_privacidade);
      aplicarNoBody(p.modo_privacidade);
    });
    return () => aplicarNoBody(false);
  }, []);

  function alternar() {
    const novo = !oculto;
    setOculto(novo);
    aplicarNoBody(novo);
    salvarPreferencias({ modo_privacidade: novo }).catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={oculto}
      aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
      title={oculto ? "Mostrar valores" : "Ocultar valores"}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.10] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      {oculto ? (
        <EyeOff className="h-[18px] w-[18px]" />
      ) : (
        <Eye className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
