"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAchievements } from "../../api/api";

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 5h3a2 2 0 0 1-2 4h-1" />
    <path d="M7 5H4a2 2 0 0 0 2 4h1" />
  </svg>
);

interface AchievementsBadgeProps {
  darkMode: boolean;
}

// Lives in the header (not the sidebar) deliberately - achievements are meant
// to be noticed, the same reasoning the Alerts bell already gets prominent
// placement here rather than being tucked into a menu.
function AchievementsBadge({ darkMode }: AchievementsBadgeProps) {
  const [earnedCount, setEarnedCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    getAchievements()
      .then((response) => {
        setEarnedCount(response?.data?.earnedCount ?? null);
        setTotalCount(response?.data?.totalCount ?? null);
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/achievements"
      title="Achievements"
      className={`relative flex items-center p-2 rounded-md transition-all duration-300 ${
        darkMode ? "text-white hover:bg-gray-700" : "text-black hover:bg-gray-200"
      }`}
    >
      <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      {earnedCount !== null && totalCount !== null && (
        <span
          className={`absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-semibold leading-none ${
            earnedCount > 0 ? "bg-blue-500" : "bg-gray-400"
          }`}
        >
          {earnedCount}
        </span>
      )}
    </Link>
  );
}

export default AchievementsBadge;
