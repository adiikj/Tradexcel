"use client";
import React, { useCallback, useState } from "react";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { getAchievements } from "../../api/api";
import { getBadgeIconSrc } from "./badgeIcons";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import Image from "next/image";
import { apiErrorMessage } from "../../api/http";
import type { Badge } from "@tradexcel/shared";

function Achievements() {

  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // State is only set after the first await, so effects can call this directly.
  const loadAchievements = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await getAchievements();
      if (!isActive()) return;
      setBadges(response?.data?.badges || []);
      setEarnedCount(response?.data?.earnedCount || 0);
      setTotalCount(response?.data?.totalCount || 0);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "Failed to load achievements."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // For buttons/handlers: show the loading state, then load.
  const fetchAchievements = useCallback(
    () => {
      setIsLoading(true);
      setError("");
      return loadAchievements();
    },
    [loadAchievements]
  );

  useAsyncEffect((isActive) => loadAchievements(isActive), [loadAchievements]);

  const cardBg = "bg-gray-50 dark:bg-gray-900";

  return (
    <>
      <div
        className={
          "bg-white text-black min-h-screen transition-colors duration-300 font-pop dark:bg-gray-800 dark:text-white"
        }
      >
        <Header />
        <div className="flex flex-col lg:flex-row">
          <Vheader />
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
                <div className={`h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}>
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
                          <Image
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
