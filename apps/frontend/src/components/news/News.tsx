"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { getNews } from "../../api/api";
import { timeAgo } from "../../utils/format";

function NewsCard({ article, darkMode }: { article: any; darkMode: boolean }) {
  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex gap-4 rounded-xl p-4 transition-colors duration-200 ${cardBg} ${
        darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
      }`}
    >
      {article.thumbnail && (
        <img src={article.thumbnail} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0 hidden sm:block" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug line-clamp-2">{article.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
          <span>{article.publisher}</span>
          <span>•</span>
          <span className="tabular-nums">{timeAgo(article.publishedAt)}</span>
        </div>
        {article.relatedTickers?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {article.relatedTickers.slice(0, 5).map((ticker: string) => (
              <span
                key={ticker}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}
              >
                {ticker}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function News() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [articles, setArticles] = useState<any[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getNews();
      setArticles(response?.data?.articles || []);
      setPersonalized(Boolean(response?.data?.personalized));
    } catch (err: any) {
      setError(err.message || "Failed to load news.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  return (
    <>
      <Helmet>
        <title>News</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-colors duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-colors duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col md:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 min-w-0 p-4 m-4 md:m-10 mb-20 md:mb-10">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold">News</h1>
              {!isLoading && personalized && (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Personalized
                </span>
              )}
            </div>
            <div className="h-2 w-32 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchNews} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-28 rounded-xl animate-pulse ${cardBg}`} />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <p className="text-gray-400 text-center py-10">No news available right now - try again later.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {articles.map((article) => (
                  <NewsCard key={article.id} article={article} darkMode={darkMode} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default News;
