"use client";

import { useEffect, useRef } from "react";
import { fetchFaturasStatus } from "@/components/ui/fatura-pendente-dialog";
import { fetchPreferencias } from "@/lib/preferencias";

/**
 * Mês em que as telas devem abrir.
 *
 * Enquanto a fatura do mês anterior não fecha, os lançamentos daquele mês ainda
 * estão sendo cobrados — abrir no mês corrente esconde justamente o período que
 * o usuário precisa conferir. O backend decide isso em `/cartoes/faturas-status`
 * (`mes_sugerido`), respeitando o dia de fechamento de cada cartão.
 *
 * Só age uma vez, na montagem, e nunca depois: a partir daí quem manda é a
 * navegação do usuário. Respeita a preferência `abrir_mes_apos_fechamento`.
 *
 * @param aplicar recebe o mês no formato `YYYY-MM`.
 */
export function useMesSugerido(aplicar: (mesRef: string) => void) {
  const aplicarRef = useRef(aplicar);
  aplicarRef.current = aplicar;

  const jaRodou = useRef(false);

  useEffect(() => {
    if (jaRodou.current) return;
    jaRodou.current = true;

    Promise.all([fetchPreferencias(), fetchFaturasStatus()]).then(
      ([prefs, status]) => {
        if (!prefs.abrir_mes_apos_fechamento) return;
        if (!status?.aguardando_fechamento) return;
        aplicarRef.current(status.mes_sugerido);
      },
    );
  }, []);
}

/** `"2026-07"` → `Date(2026, 6, 1)`, para as telas que guardam o mês como Date. */
export function mesRefParaDate(mesRef: string): Date {
  const [ano, mes] = mesRef.split("-").map(Number);
  return new Date(ano, mes - 1, 1);
}
