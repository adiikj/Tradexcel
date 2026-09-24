"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { hasSession } from "../../utils/sessionFlag";
import { useBrowserValue } from "../../hooks/useBrowserValue";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import FollowButton from "./FollowButton";
import ShareButton from "./ShareButton";
import UserList from "./UserList";
import { getPublicProfile, getFollowers, getFollowing } from "../../api/api";
import { formatInr, formatPercent } from "../../utils/format";
import { changeGlyph, changeTextClass } from "../market/marketColors";
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
    <div className={`flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center md:p-6 ${SURFACE}`}>
      <div className="flex-1">
        <p className="font-semibold">Think you can beat @{username}?</p>
        <p className="mt-1 text-sm text-gray-500">Start with ₹1,00,000 in virtual cash. Real market prices, no risk.</p>
      </div>
      <Link href="/signup" onClick={handleClick} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
        Sign up and play
      </Link>
    </div>
  );
}

const SURFACE = "rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Stat({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{children}</dd>
      {hint && <dd className="text-xs text-gray-500 dark:text-gray-400">{hint}</dd>}
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
      setError(apiErrorMessage(err, "We couldn't load this profile. Please try again."));
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, [username]);

  // For buttons/handlers: show the loading state, then load.
  const fetchProfile = useCallback(() => {
    setIsLoading(true);
    setError("");
    return loadProfile();
  }, [loadProfile]);

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
      setError(apiErrorMessage(err, "We couldn't load this list. Please try again."));
    } finally {
      setListLoading(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://tradexcel.app/u/${username}`;

  const countButton = (kind: "followers" | "following", count: number) => {
    const label = kind === "followers" ? "Followers" : "Following";
    const content = (
      <>
        <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{count}</span> {label}
      </>
    );
    return isAuthenticated ? (
      <button
        type="button"
        onClick={() => openTab(kind)}
        aria-pressed={tab === kind}
        className={`rounded-lg px-2 py-1 transition-colors ${tab === kind ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        {content}
      </button>
    ) : (
      <span className="px-2 py-1">{content}</span>
    );
  };

  const page = (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      {isAuthenticated ? <Header /> : <PublicNavBar />}
      <div className="flex">
        {isAuthenticated && <Vheader />}
        <main className={`mb-20 min-w-0 flex-1 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10`}>
          <div className={`mx-auto space-y-4 ${isAuthenticated ? "max-w-4xl" : "max-w-3xl"}`}>
            {isLoading ? (
              <>
                <div className={`h-48 animate-pulse ${SURFACE}`} />
                <div className={`h-40 animate-pulse ${SURFACE}`} />
              </>
            ) : error && !profile ? (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                <span className="flex-1">{error}</span>
                <button type="button" onClick={fetchProfile} className="font-medium underline">
                  Retry
                </button>
              </div>
            ) : profile ? (
              <>
                {/* Identity + headline numbers */}
                <section className={SURFACE}>
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center md:p-6">
                    <Avatar src={profile.avatar} size={96} className="h-20 w-20 shrink-0 rounded-full ring-1 ring-gray-200 dark:ring-gray-700" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-2xl font-bold">{profile.name}</h1>
                        {profile.title && (
                          <span
                            title="Current standing, updates as net worth and rank change"
                            className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                          >
                            {profile.title.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{profile.username}
                        {profile.memberSince && <> · Joined {new Date(profile.memberSince).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</>}
                      </p>
                      <div className="-ml-2 mt-2 flex flex-wrap gap-1 text-sm text-gray-500 dark:text-gray-400">
                        {countButton("followers", profile.followersCount)}
                        {countButton("following", profile.followingCount)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.isSelf && isAuthenticated && (
                        <Link
                          href="/your-profile"
                          className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
                        >
                          Edit profile
                        </Link>
                      )}
                      {isAuthenticated && !profile.isSelf && (
                        <FollowButton
                          username={profile.username}
                          initialIsFollowing={profile.isFollowing}
                          onChange={(nowFollowing) =>
                            setProfile((prev) =>
                              prev && {
                                ...prev,
                                isFollowing: nowFollowing,
                                followersCount: prev.followersCount + (nowFollowing ? 1 : -1),
                              }
                            )
                          }
                        />
                      )}
                      {!isAuthenticated && (
                        <Link
                          href="/signup"
                          onClick={() => {
                            if (typeof window !== "undefined") localStorage.setItem("pendingFollow", profile.username);
                          }}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Follow
                        </Link>
                      )}
                      <ShareButton url={shareUrl} title={`${profile.name} on Tradexcel`} text={`Check out @${profile.username}'s trading profile on Tradexcel`} />
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-4 border-t border-gray-100 p-5 dark:border-gray-800 sm:grid-cols-4 md:px-6">
                    <Stat label="Net worth">{formatInr(profile.netWorth)}</Stat>
                    <Stat label="Return">
                      <span className={changeTextClass(profile.totalPnlPercent)}>
                        {changeGlyph(profile.totalPnlPercent)} {formatPercent(profile.totalPnlPercent)}
                      </span>
                    </Stat>
                    <Stat label="Rank">{profile.rank ? `#${profile.rank}` : "—"}</Stat>
                    <Stat label="Login streak" hint={`Best ${profile.longestStreak} ${profile.longestStreak === 1 ? "day" : "days"}`}>
                      {profile.currentStreak} {profile.currentStreak === 1 ? "day" : "days"}
                    </Stat>
                  </dl>
                </section>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>
                )}

                {isAuthenticated && tab && (
                  <section className={`p-5 md:p-6 ${SURFACE}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-base font-semibold capitalize">{tab}</h2>
                      <button type="button" onClick={() => setTab(null)} className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        Close
                      </button>
                    </div>
                    {listLoading ? <div className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" /> : <UserList users={listUsers} emptyLabel={`No ${tab} yet.`} />}
                  </section>
                )}

                <div className={`grid gap-4 ${profile.badges?.length > 0 && profile.weeklyPerformance?.length > 0 ? "lg:grid-cols-2" : ""}`}>
                  {profile.badges?.length > 0 && (
                    <section className={`p-5 md:p-6 ${SURFACE}`}>
                      <div className="mb-4 flex items-baseline justify-between">
                        <h2 className="text-base font-semibold">Achievements</h2>
                        <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{profile.badges.length} unlocked</span>
                      </div>
                      <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                        {profile.badges.map((badge) => {
                          const iconSrc = getBadgeIconSrc(badge.id);
                          return (
                            <li
                              key={badge.id}
                              title={badge.earnedAt ? `${badge.description} Earned ${new Date(badge.earnedAt).toLocaleDateString("en-IN")}.` : badge.description}
                              className="flex flex-col items-center gap-2 text-center"
                            >
                              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                                {iconSrc ? <Image src={iconSrc} alt="" className="h-full w-full object-cover" /> : null}
                              </span>
                              <span className="text-xs font-medium leading-tight">{badge.name}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  )}

                  {profile.weeklyPerformance?.length > 0 && (
                    <section className={`p-5 md:p-6 ${SURFACE}`}>
                      <h2 className="mb-2 text-base font-semibold">Weekly results</h2>
                      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {profile.weeklyPerformance.map((week) => (
                          <li key={week.weekStart} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              {shortDate(week.weekStart)} – {shortDate(week.weekEnd)}
                            </span>
                            <span className="flex items-center gap-4">
                              <span className="tabular-nums">{formatInr(week.endNetWorth)}</span>
                              <span className={`w-20 text-right font-semibold tabular-nums ${changeTextClass(week.pnlPercent)}`}>
                                {changeGlyph(week.pnlPercent)} {formatPercent(week.pnlPercent)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                {!isAuthenticated && <PlaySignupCta username={profile.username} />}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );

  // Logged-out visitors always get the light design, whatever the saved theme.
  return <LightThemeScope enabled={!isAuthenticated}>{page}</LightThemeScope>;
}

export default PublicProfile;
