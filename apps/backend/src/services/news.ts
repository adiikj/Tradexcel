import fetch from "node-fetch";

export interface NewsArticle {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: number;
  thumbnail: string | null;
  relatedTickers: string[];
}

// Longer TTL than pricing.ts since news moves slower than quotes.
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { articles: NewsArticle[]; expiresAt: number }>();

// Fallback for users with no holdings yet.
const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"];

async function fetchNewsForSymbol(symbol: string): Promise<NewsArticle[]> {
  const key = symbol.toUpperCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.articles;
  }

  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    key
  )}&newsCount=10&quotesCount=0&listsCount=0`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

  if (!response.ok) {
    throw new Error(`Yahoo Finance news error for ${key}: ${response.statusText}`);
  }

  const data: any = await response.json();
  const articles: NewsArticle[] = (data?.news ?? [])
    .filter((item: any) => item?.title && item?.link)
    .map((item: any) => ({
      id: item.uuid,
      title: item.title,
      publisher: item.publisher ?? "Unknown",
      link: item.link,
      publishedAt: (item.providerPublishTime ?? 0) * 1000,
      thumbnail: item.thumbnail?.resolutions?.[0]?.url ?? null,
      relatedTickers: item.relatedTickers ?? [],
    }));

  cache.set(key, { articles, expiresAt: Date.now() + CACHE_TTL_MS });
  return articles;
}

// Merges news across symbols, deduped by article id.
export async function getNewsForSymbols(symbols: string[]): Promise<{ articles: NewsArticle[]; personalized: boolean }> {
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const personalized = uniqueSymbols.length > 0;
  const querySymbols = personalized ? uniqueSymbols : DEFAULT_SYMBOLS;

  const results = await Promise.all(
    querySymbols.map(async (symbol) => {
      try {
        return await fetchNewsForSymbol(symbol);
      } catch (error: any) {
        console.error(`Failed to fetch news for ${symbol}:`, error.message);
        return [];
      }
    })
  );

  const seen = new Set<string>();
  const merged: NewsArticle[] = [];
  for (const article of results.flat()) {
    if (seen.has(article.id)) continue;
    seen.add(article.id);
    merged.push(article);
  }

  merged.sort((a, b) => b.publishedAt - a.publishedAt);

  return { articles: merged, personalized };
}
