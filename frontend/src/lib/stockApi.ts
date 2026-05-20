const BRAPI = "https://brapi.dev/api";
const CACHE_KEY = "valora_stock_quotes";

export interface StockQuote {
  ticker: string;
  price: number;
  name: string;
  fetchedAt: number;
}

export function getCachedQuotes(): Record<string, StockQuote> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCachedQuotes(data: Record<string, StockQuote>): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable (SSR, private mode quota)
  }
}

export async function fetchAndCacheQuotes(
  tickers: string[],
): Promise<Record<string, StockQuote>> {
  if (tickers.length === 0) return {};

  const joined = tickers.join(",");
  const res = await fetch(`${BRAPI}/quote/${joined}?fundamental=false`);
  if (!res.ok) throw new Error(`Brapi returned ${res.status}`);

  const json = await res.json();
  const results: Array<{ symbol: string; longName?: string; regularMarketPrice: number }> =
    json?.results ?? [];

  const existing = getCachedQuotes();
  const now = Date.now();

  for (const r of results) {
    existing[r.symbol] = {
      ticker: r.symbol,
      price: r.regularMarketPrice,
      name: r.longName ?? r.symbol,
      fetchedAt: now,
    };
  }

  setCachedQuotes(existing);
  return existing;
}
