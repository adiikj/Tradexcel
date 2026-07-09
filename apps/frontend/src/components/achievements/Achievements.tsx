"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import ThemeContext from "../../context/ThemeContext";
import { Helmet } from "react-helmet";
import { getAchievements } from "../../api/api";
import { getBadgeIconSrc } from "./badgeIcons";

function Achievements() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const [badges, setBadges] = useState<any[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await getAchievements();
      setBadges(response?.data?.badges || []);
      setEarnedCount(response?.data?.earnedCount || 0);
      setTotalCount(response?.data?.totalCount || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load achievements.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const cardBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  return (
    <>
      <Helmet>
        <title>Achievements</title>
      </Helmet>
      <div
        className={
          darkMode
            ? "bg-gray-800 text-white min-h-screen transition-colors duration-300 font-pop"
            : "bg-white text-black min-h-screen transition-colors duration-300 font-pop"
        }
      >
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col lg:flex-row">
          <Vheader darkMode={darkMode} />
          <main className="flex-1 min-w-0 pb-24 md:pb-0 p-6 m-2 md:m-12">
            <h1 className="text-xl md:text-2xl font-bold">Achievements</h1>
            <div className="h-2 w-32 md:w-36 bg-blue-500 rounded-full mb-6 animate-line"></div>

            {error && (
              <div className="mb-4 flex items-center gap-3">
                <p className="text-red-500 text-sm">{error}</p>
                <button onClick={fetchAchievements} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            )}

            {!isLoading && totalCount > 0 && (
              <div className={`rounded-2xl p-5 mb-6 ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Unlocked</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {earnedCount} / {totalCount}
                  </p>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-28 rounded-2xl animate-pulse ${cardBg}`} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => {
                  const iconSrc = getBadgeIconSrc(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-2xl p-5 flex items-start gap-4 transition-opacity duration-200 ${cardBg} ${
                        badge.earned ? "" : "opacity-60"
                      }`}
                    >
                      <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
                        {iconSrc ? (
                          <img
                            src={iconSrc}
                            alt={badge.name}
                            className={`w-full h-full object-cover ${badge.earned ? "" : "grayscale"}`}
                          />
                        ) : (
                          <span className="text-3xl" role="img" aria-label={badge.name}>
                            {badge.earned ? badge.icon : "🔒"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-sm text-gray-400">{badge.description}</p>
                        {badge.earned && badge.earnedAt && (
                          <p className="text-xs text-blue-400 mt-1">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default Achievements;
