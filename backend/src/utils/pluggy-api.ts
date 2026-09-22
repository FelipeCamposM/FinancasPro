// Client HTTP da API da Pluggy. Usa o fetch global do Node — nenhuma
// dependência nova.

const BASE_URL = process.env.PLUGGY_BASE_URL ?? "https://api.pluggy.ai";

export type PluggyCreditData = {
  brand: string | null;
  creditLimit: number | null;
  availableCreditLimit: number | null;
  balanceDueDate: string | null;
  balanceCloseDate: string | null;
};

export type PluggyAccount = {
  id: string;
  type: "BANK" | "CREDIT";
  subtype: string;
  name: string;
  marketingName: string | null;
  number: string | null;
  balance: number;
  currencyCode: string;
  creditData: PluggyCreditData | null;
};

export type PluggyTransaction = {
  id: string;
  description: string;
  descriptionRaw: string | null;
  amount: number;
  date: string;
  category: string | null;
  status: "PENDING" | "POSTED";
  type: "DEBIT" | "CREDIT";
  accountId: string;
  merchant: { name?: string; businessName?: string } | null;
  operationType: string | null;
  creditCardMetadata: {
    // Competência da fatura no formato 'YYYY-MM'. É o que define em qual
    // fatura a compra entra — não a data da compra. Vem '0001-01' quando a
    // fatura daquela parcela ainda não foi gerada.
    billForecastDate?: string | null;
    cardNumber?: string | null;
    // Data da compra original; numa parcela difere de `date`.
    purchaseDate?: string | null;
    installmentNumber?: number | null;
    totalInstallments?: number | null;
    billId?: string | null;
  } | null;
};

// A apiKey vale ~2h. Guardar em memória evita um POST /auth por requisição;
// em serverless o cache morre junto com a instância, o que é aceitável.
let cache: { apiKey: string; expiraEm: number } | null = null;

export const getApiKey = async (): Promise<string> => {
  if (cache && Date.now() < cache.expiraEm) return cache.apiKey;

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não configurados");
  }

  const resp = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!resp.ok) {
    throw new Error(`Pluggy /auth falhou: ${resp.status} ${await resp.text()}`);
  }

  const { apiKey } = (await resp.json()) as { apiKey: string };
  // Margem de 10min antes das 2h nominais.
  cache = { apiKey, expiraEm: Date.now() + 110 * 60 * 1000 };
  return apiKey;
};

const get = async <T>(caminho: string): Promise<T> => {
  const apiKey = await getApiKey();
  const resp = await fetch(`${BASE_URL}${caminho}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!resp.ok) {
    throw new Error(
      `Pluggy ${caminho} falhou: ${resp.status} ${await resp.text()}`,
    );
  }
  return resp.json() as Promise<T>;
};

export const listAccounts = async (itemId: string): Promise<PluggyAccount[]> => {
  const { results } = await get<{ results: PluggyAccount[] }>(
    `/accounts?itemId=${encodeURIComponent(itemId)}`,
  );
  return results;
};

/**
 * Pagina por cursor. A doc é explícita: usar o `next` devolvido pela resposta,
 * nunca montar o cursor na mão. `pageSize` não é aceito (400).
 *
 * Sem `desde` puxa todo o histórico disponível — é o comportamento da carga
 * inicial.
 */
export const listTransactions = async (
  accountId: string,
  desde?: Date,
): Promise<PluggyTransaction[]> => {
  const params = new URLSearchParams({ accountId });
  // O filtro chama `dateFrom` — `from` é recusado com 400 "property from
  // should not exist". Só aparece a partir do segundo sync, quando há
  // last_sync_at para limitar a janela.
  if (desde) params.set("dateFrom", desde.toISOString().slice(0, 10));

  let caminho: string | null = `/v2/transactions?${params}`;
  const todas: PluggyTransaction[] = [];

  // Trava de segurança: 100 páginas x 500 = 50k transações.
  for (let i = 0; caminho && i < 100; i++) {
    const pagina: { results: PluggyTransaction[]; next: string | null } =
      await get(caminho);
    todas.push(...pagina.results);
    caminho = pagina.next ? `/v2/transactions${pagina.next}` : null;
  }

  return todas;
};
