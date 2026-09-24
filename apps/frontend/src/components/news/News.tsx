"use client";
import React, { useCallback, useMemo, useState } from "react";
import { PiArrowSquareOut, PiNewspaper } from "react-icons/pi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getNews } from "../../api/api";
import { timeAgo } from "../../utils/format";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import RemoteImage from "../ui/RemoteImage";
import { apiErrorMessage } from "../../api/http";
import type { NewsArticle } from "@tradexcel/shared";

const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";

// Most-mentioned tickers get a filter chip.
const MAX_TICKER_FILTERS = 8;

const INDEX_NAMES: Record<string, string> = { "^NSEI": "Nifty 50", NSEI: "Nifty 50", "^BSESN": "Sensex", BSESN: "Sensex" };

const tickerLabel = (ticker: string) => INDEX_NAMES[ticker] ?? ticker.replace(/\.(NS|BO)$/, "");

function Meta({ article }: { article: NewsArticle }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
      <span className="font-medium text-gray-700 dark:text-gray-300">{article.publisher}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">{timeAgo(article.publishedAt)}</span>
    </p>
  );
}

function Tickers({ tickers }: { tickers: string[] }) {
  if (!tickers?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tickers.slice(0, 4).map((ticker) => (
        <span key={ticker} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {tickerLabel(ticker)}
        </span>
      ))}
    </div>
  );
}

// The newest story with a picture, shown large at the top.
function LeadStory({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group grid overflow-hidden transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-gray-800/60 md:grid-cols-5 ${SURFACE}`}
    >
      {article.thumbnail && (
        <RemoteImage src={article.thumbnail} alt="" width={640} height={360} className="aspect-video h-full w-full object-cover md:col-span-2 md:aspect-auto" />
      )}
      <div className={`flex flex-col gap-3 p-5 md:p-6 ${article.thumbnail ? "md:col-span-3" : "md:col-span-5"}`}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Top story</span>
        <h2 className="text-lg font-semibold leading-snug group-hover:underline md:text-xl">{article.title}</h2>
        <Meta article={article} />
        <div className="mt-auto">
          <Tickers tickers={article.relatedTickers} />
        </div>
      </div>
    </a>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex gap-4 p-4 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-gray-800/60 ${SURFACE}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="line-clamp-3 font-semibold leading-snug group-hover:underline">{article.title}</p>
        <Meta article={article} />
        <div className="mt-auto pt-1">
          <Tickers tickers={article.relatedTickers} />
        </div>
      </div>
      {article.thumbnail ? (
        <RemoteImage src={article.thumbnail} alt="" width={96} height={96} className="hidden h-24 w-24 shrink-0 rounded-xl object-cover sm:block" />
      ) : (
        <PiArrowSquareOut aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-400" />
      )}
    </a>
  );
}

function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticker, setTicker] = useState<string | null>(null);

  // State is only set after the first await, so effects can call this directly.
  const loadNews = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await getNews();
      if (!isActive()) return;
      setArticles(response?.data?.articles || []);
      setPersonalized(Boolean(response?.data?.personalized));
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "We couldn't load the news. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchNews = useCallback(() => {
    setIsLoading(true);
    setError("");
    return loadNews();
  }, [loadNews]);

  useAsyncEffect((isActive) => loadNews(isActive), [loadNews]);

  const tickerFilters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) for (const t of a.relatedTickers ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TICKER_FILTERS)
      .map(([t]) => t);
  }, [articles]);

  const ordered = useMemo(
    () =>
      [...articles]
        .filter((a) => !ticker || a.relatedTickers?.includes(ticker))
        .sort((a, b) => b.publishedAt - a.publishedAt),
    [articles, ticker]
  );
  const lead = ordered.find((a) => a.thumbnail) ?? ordered[0];
  const rest = ordered.filter((a) => a !== lead);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
        : "bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800 dark:hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 space-y-4 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">News</h1>
              {!isLoading && personalized && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  For you
                </span>
              )}
            </div>
            <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {personalized ? "Indian market news, including stories about stocks you hold." : "The latest Indian market news."}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <span className="flex-1">{error}</span>
              <button type="button" onClick={fetchNews} className="font-medium underline">
                Retry
              </button>
            </div>
          )}

          {tickerFilters.length > 0 && (
            <div role="group" aria-label="Filter by stock" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              <button type="button" aria-pressed={ticker === null} onClick={() => setTicker(null)} className={chip(ticker === null)}>
                All
              </button>
              {tickerFilters.map((t) => (
                <button key={t} type="button" aria-pressed={ticker === t} onClick={() => setTicker(ticker === t ? null : t)} className={chip(ticker === t)}>
                  {tickerLabel(t)}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <div className={`h-56 animate-pulse ${SURFACE}`} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-32 animate-pulse ${SURFACE}`} />
                ))}
              </div>
            </div>
          ) : ordered.length === 0 ? (
            !error && (
              <div className={`flex flex-col items-center px-6 py-12 text-center ${SURFACE}`}>
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                  <PiNewspaper aria-hidden="true" className="h-6 w-6" />
                </span>
                <p className="font-medium">No news right now</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check back in a little while.</p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {lead && <LeadStory article={lead} />}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                  {rest.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default News;
