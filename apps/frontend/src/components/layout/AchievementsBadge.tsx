"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAchievements } from "../../api/api";
import { HEADER_BADGE, HEADER_ICON_BUTTON } from "./headerStyles";
import { PiTrophy } from "react-icons/pi";



// Lives in the header (not the sidebar) deliberately - achievements are meant
// to be noticed, the same reasoning the Alerts bell already gets prominent
// placement here rather than being tucked into a menu.
function AchievementsBadge() {
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
      aria-label={earnedCount !== null && totalCount !== null ? `Achievements (${earnedCount} of ${totalCount} earned)` : "Achievements"}
      className={`${HEADER_ICON_BUTTON} hidden sm:inline-flex`}
    >
      <PiTrophy aria-hidden="true" className="h-5 w-5" />
      {earnedCount !== null && totalCount !== null && (
        <span aria-hidden="true" className={`${HEADER_BADGE} ${earnedCount > 0 ? "bg-blue-600" : "bg-gray-400"}`}>
          {earnedCount}
        </span>
      )}
    </Link>
  );
}

export default AchievementsBadge;
