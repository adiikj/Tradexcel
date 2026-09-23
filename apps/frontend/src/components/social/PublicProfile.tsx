"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { hasSession } from "../../utils/sessionFlag";
import { useBrowserValue } from "../../hooks/useBrowserValue";
import { FiUserPlus } from "react-icons/fi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import FollowButton from "./FollowButton";
import ShareButton from "./ShareButton";
import UserList from "./UserList";
import { getPublicProfile, getFollowers, getFollowing } from "../../api/api";
import { formatInr, formatPercent } from "../../utils/format";
import logo from "../../assets/logo-icon-transparent.png";
import wordmarkLight from "../../assets/tradexcel-wordmark-light.png";
import wordmarkDark from "../../assets/tradexcel-wordmark-dark.png";
import { getBadgeIconSrc } from "../achievements/badgeIcons";
import { useAsyncEffect } from "../../hooks/useAsyncEffect";
import Image from "next/image";
import { apiErrorMessage } from "../../api/http";
import type { ListedUser, PublicProfile as PublicProfileData } from "@tradexcel/shared";
import Avatar from "../ui/Avatar";
import ThemedImage from "../ui/ThemedImage";
import { LightThemeScope } from "../../context/ThemeContext";

interface PublicProfileProps {
  username: string;
  // From the session cookie on the server, so the first render already matches.
  viewerLoggedIn: boolean;
}

function PublicNavBar() {
  return (
    <div className={`w-full h-16 flex items-center justify-between px-4 md:px-8 bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-b-0`}>
      <Link href="/" className="flex items-center gap-2">
        <Image className="h-7 w-7" src={logo} alt="" />
        <span className="hidden sm:contents">
          <ThemedImage className="h-4 w-auto" light={wordmarkLight} dark={wordmarkDark} alt="Tradexcel" />
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/signin" className={`px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800`}>
          Sign In
        </Link>
        <Link href="/signup" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

function PlaySignupCta({ username }: { username: string }) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingFollow", username);
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 mt-6 text-center ${
        "bg-gradient-to-b from-blue-50 to-white border border-blue-100 dark:from-blue-900/30 dark:to-gray-900 dark:border-0"
      }`}
    >
      <p className="text-lg font-bold">Think you can beat @{username}?</p>
      <p className="text-sm text-gray-400 mt-1">
        Join Tradexcel and start trading with ₹1,00,000 in virtual cash, no risk, real market prices.
      </p>
      <Link
        href="/signup"
        onClick={handleClick}
        className="inline-block mt-4 px-8 py-3 rounded-full font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
      >
        Sign Up & Play
      </Link>
    </div>
  );
}

function PublicProfile({ username, viewerLoggedIn }: PublicProfileProps) {

  const isAuthenticated = useBrowserValue(hasSession, viewerLoggedIn);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"followers" | "following" | null>(null);
  const [listUsers, setListUsers] = useState<ListedUser[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // State is only set after the first await, so effects can call this directly.
  const loadProfile = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await getPublicProfile(username);
      if (!isActive()) return;
      setProfile(response?.data || null);
    } catch (err) {
      if (!isActive()) return;
      setError(apiErrorMessage(err, "Failed to load profile."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, [username]);

  // For buttons/handlers: show the loading state, then load.
  const fetchProfile = useCallback(
    () => {
      setIsLoading(true);
      setError("");
      return loadProfile();
    },
    [loadProfile]
  );

  useAsyncEffect((isActive) => loadProfile(isActive), [loadProfile]);

  const openTab = async (nextTab: "followers" | "following") => {
    if (!isAuthenticated) return;
    if (tab === nextTab) {
      setTab(null);
      return;
    }
    setTab(nextTab);
    setListLoading(true);
    try {
      const response = nextTab === "followers" ? await getFollowers(username) : await getFollowing(username);
      setListUsers(response?.data?.users || []);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load list."));
    } finally {
      setListLoading(false);
    }
  };

  const cardBg = "bg-gray-100 dark:bg-gray-900";
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://tradexcel.app/u/${username}`;

  const page = (
    <>
      <div
        className={
          "bg-white text-black min-h-screen transition-colors duration-300 font-pop dark:bg-gray-800 dark:text-white"
        }
      >
        {isAuthenticated ? <Header /> : <PublicNavBar />}
        <div className="flex flex-col md:flex-row">
          {isAuthenticated && <Vheader />}
          <main className={`flex-1 min-w-0 p-4 m-4 md:m-10 mb-20 md:mb-10 ${isAuthenticated ? "" : "max-w-2xl md:mx-auto"}`}>
            {isLoading ? (
              <div className={`h-64 rounded-2xl animate-pulse ${cardBg}`} />
            ) : error ? (
              <div className="flex items-center gap-3">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchProfile} className="text-sm text-blue-500 underline">
                  Retry
                </button>
              </div>
            ) : profile ? (
              <>
                <div className={`rounded-2xl p-6 ${cardBg}`}>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <Avatar src={profile.avatar} size={96} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-2xl font-bold">{profile.name}</h1>
                      <p className="text-gray-400">@{profile.username}</p>
                      {profile.title && (
                        <div className="flex justify-center sm:justify-start mt-2">
                          <span
                            title="Current standing - updates as net worth and rank change"
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            }`}
                          >
                            <span>{profile.title.icon}</span>
                            {profile.title.name}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-center sm:justify-start gap-6 mt-4 text-sm">
                        {isAuthenticated ? (
                          <>
                            <button onClick={() => openTab("followers")} className="hover:underline">
                              <span className="font-bold tabular-nums">{profile.followersCount}</span>{" "}
                              <span className="text-gray-400">Followers</span>
                            </button>
                            <button onClick={() => openTab("following")} className="hover:underline">
                              <span className="font-bold tabular-nums">{profile.followingCount}</span>{" "}
                              <span className="text-gray-400">Following</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <span>
                              <span className="font-bold tabular-nums">{profile.followersCount}</span>{" "}
                              <span className="text-gray-400">Followers</span>
                            </span>
                            <span>
                              <span className="font-bold tabular-nums">{profile.followingCount}</span>{" "}
                              <span className="text-gray-400">Following</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      {isAuthenticated && !profile.isSelf && (
                        <FollowButton
                          username={profile.username}
                          initialIsFollowing={profile.isFollowing}
                          onChange={(nowFollowing) =>
                            setProfile((prev) => prev && ({
                              ...prev,
                              isFollowing: nowFollowing,
                              followersCount: prev.followersCount + (nowFollowing ? 1 : -1),
                            }))
                          }
                        />
                      )}
                      {!isAuthenticated && (
                        <Link
                          href="/signup"
                          onClick={() => {
                            if (typeof window !== "undefined") localStorage.setItem("pendingFollow", profile.username);
                          }}
                          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                        >
                          <FiUserPlus /> Follow
                        </Link>
                      )}
                      <ShareButton
                        url={shareUrl}
                        title={`${profile.name} on Tradexcel`}
                        text={`Check out @${profile.username}'s trading profile on Tradexcel`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div>
                      <p className="text-xs text-gray-400">Net Worth</p>
                      <p className="font-bold tabular-nums">{formatInr(profile.netWorth)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total P&amp;L</p>
                      <p className={`font-bold tabular-nums ${profile.totalPnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {formatPercent(profile.totalPnlPercent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Rank</p>
                      <p className="font-bold tabular-nums">{profile.rank ? `#${profile.rank}` : "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Login Streak</p>
                      <p className="font-bold tabular-nums">
                        {profile.currentStreak} day{profile.currentStreak === 1 ? "" : "s"}
                        <span className="text-xs text-gray-400 font-normal"> (best {profile.longestStreak})</span>
                      </p>
                    </div>
                  </div>
                </div>

                {profile.badges?.length > 0 && (
                  <div className={`rounded-2xl p-6 mt-6 ${cardBg}`}>
                    <h2 className="font-bold mb-4">Achievements</h2>
                    <div className="flex flex-wrap gap-5">
                      {profile.badges.map((badge) => {
                        const iconSrc = getBadgeIconSrc(badge.id);
                        return (
                          <div
                            key={badge.id}
                            title={badge.earnedAt ? `${badge.description} - earned ${new Date(badge.earnedAt).toLocaleDateString()}` : badge.description}
                            className="flex flex-col items-center text-center gap-2 w-20"
                          >
                            <div
                              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm ${
                                "bg-white dark:bg-gray-800"
                              }`}
                            >
                              {iconSrc ? (
                                <Image src={iconSrc} alt={badge.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-4xl">{badge.icon}</span>
                              )}
                            </div>
                            <p className="text-xs font-semibold leading-tight">{badge.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {profile.weeklyPerformance?.length > 0 && (
                  <div className={`rounded-2xl p-6 mt-6 ${cardBg}`}>
                    <h2 className="font-bold mb-4">Weekly Performance</h2>
                    <ul className="space-y-2">
                      {profile.weeklyPerformance.map((week) => {
                        const start = new Date(week.weekStart);
                        const end = new Date(week.weekEnd);
                        const dateRange = `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
                        const positive = week.pnlPercent >= 0;
                        return (
                          <li
                            key={week.weekStart}
                            className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                              "bg-white dark:bg-gray-800"
                            }`}
                          >
                            <span className="text-sm text-gray-400">{dateRange}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm tabular-nums">{formatInr(week.endNetWorth)}</span>
                              <span className={`text-sm font-semibold tabular-nums ${positive ? "text-green-500" : "text-red-500"}`}>
                                {formatPercent(week.pnlPercent)}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {!isAuthenticated && <PlaySignupCta username={profile.username} />}

                {isAuthenticated && tab && (
                  <div className={`rounded-2xl p-6 mt-6 ${cardBg}`}>
                    <h2 className="font-bold capitalize mb-2">{tab}</h2>
                    {listLoading ? (
                      <div className="h-24 animate-pulse rounded-lg bg-gray-500/10" />
                    ) : (
                      <UserList users={listUsers} emptyLabel={`No ${tab} yet.`} />
                    )}
                  </div>
                )}
              </>
            ) : null}
          </main>
        </div>
      </div>
    </>
  );

  // Logged-out visitors always get the light design, whatever the saved theme.
  return <LightThemeScope enabled={!isAuthenticated}>{page}</LightThemeScope>;
}

export default PublicProfile;
