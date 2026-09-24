"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { PiCaretDown, PiGlobe, PiCompass, PiMoon, PiSignOut, PiSun, PiTrophy, PiUser } from "react-icons/pi";
import { logout } from "../../redux/authSlice";
import logo from "../../assets/logo-icon-transparent.png";
import wordmarkLight from "../../assets/tradexcel-wordmark-light.png";
import wordmarkDark from "../../assets/tradexcel-wordmark-dark.png";
import Alerts from "../alerts/Alerts";
import GlobalSearch from "../layout/GlobalSearch";
import AchievementsBadge from "../layout/AchievementsBadge";
import { getUserProfile, logoutUser } from "../../api/api";
import { clearSession } from "../../utils/sessionFlag";
import { useTheme } from "../../context/ThemeContext";
import { useMarketStatus } from "../../hooks/useMarketStatus";
import Avatar from "../ui/Avatar";
import ThemedImage from "../ui/ThemedImage";
import { HEADER_ICON_BUTTON } from "../layout/headerStyles";
import { requestTour } from "../tour/ProductTour";

function MarketStatusPill() {
  const { open } = useMarketStatus();
  if (open === null) return null;
  return (
    <span
      className={`hidden lg:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        open ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${open ? "bg-teal-500 animate-pulse" : "bg-gray-400"}`} />
      {open ? "Market open" : "Market closed"}
    </span>
  );
}

const Header = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{ name: string; username: string; avatar: string | null } | null>(null);

  const handleLogout = async () => {
    // The auth cookies are httpOnly, so only the backend can clear them.
    await logoutUser().catch(() => {});
    clearSession();
    dispatch(logout());
    // Full reload on purpose: drops in-memory app state (store, socket).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  };

  useEffect(() => {
    let active = true;
    getUserProfile()
      .then((res) => {
        if (active && res?.data) setProfile({ name: res.data.name, username: res.data.username, avatar: res.data.avatar });
      })
      .catch(() => {
        // Falls back to the default avatar with no name.
      });
    return () => {
      active = false;
    };
  }, []);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const menuLink =
    "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-3 border-b border-gray-200 bg-white/85 px-4 font-pop text-gray-900 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/85 dark:text-white md:gap-6 md:px-5">
      {/* Brand */}
      <Link href="/dashboard" aria-label="Tradexcel home" className="flex shrink-0 items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <Image className="h-7 w-7" src={logo} alt="" />
        <span className="hidden lg:contents">
          <ThemedImage className="h-4 w-auto" light={wordmarkLight} dark={wordmarkDark} alt="" />
        </span>
      </Link>

      {/* Search */}
      <div data-tour="search" className="flex flex-1 justify-end sm:justify-start">
        <GlobalSearch />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <MarketStatusPill />

        {/* Replays the walkthrough: in place on the dashboard, otherwise the dashboard picks up the request. */}
        <Link
          href="/dashboard"
          onClick={requestTour}
          data-tour="tour-button"
          aria-label="Take the tour"
          title="Take the tour"
          className={HEADER_ICON_BUTTON}
        >
          <PiCompass aria-hidden="true" className="h-5 w-5" />
        </Link>

        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className={HEADER_ICON_BUTTON}
        >
          {/* CSS picks the icon so it's right on first paint. */}
          <PiMoon aria-hidden="true" className="h-5 w-5 dark:hidden" />
          <PiSun aria-hidden="true" className="hidden h-5 w-5 dark:block" />
        </button>

        <AchievementsBadge />
        <div data-tour="alerts" className="flex">
          <Alerts />
        </div>

        <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

        {/* Account */}
        <div ref={menuRef} data-tour="account" className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full p-1 pr-1 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-gray-800 md:pr-2"
          >
            <Avatar src={profile?.avatar} size={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
            <span className="hidden max-w-[8rem] truncate text-sm font-medium md:block">{profile?.name ?? ""}</span>
            <PiCaretDown aria-hidden="true" className={`hidden h-4 w-4 text-gray-400 transition-transform md:block ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
              {profile && (
                <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800">
                  <p className="truncate text-sm font-semibold">{profile.name}</p>
                  {profile.username && <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{profile.username}</p>}
                </div>
              )}
              <ul role="menu" className="py-1">
                <li role="none">
                  <Link href="/your-profile" role="menuitem" className={menuLink} onClick={() => setMenuOpen(false)}>
                    <PiUser aria-hidden="true" className="h-4 w-4" /> Your profile
                  </Link>
                </li>
                {profile && (
                  <li role="none">
                    <Link href={`/u/${profile.username}`} role="menuitem" className={menuLink} onClick={() => setMenuOpen(false)}>
                      <PiGlobe aria-hidden="true" className="h-4 w-4" /> Public profile
                    </Link>
                  </li>
                )}
                <li role="none">
                  <Link href="/achievements" role="menuitem" className={menuLink} onClick={() => setMenuOpen(false)}>
                    <PiTrophy aria-hidden="true" className="h-4 w-4" /> Achievements
                  </Link>
                </li>
              </ul>
              <div className="border-t border-gray-100 py-1 dark:border-gray-800">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <PiSignOut aria-hidden="true" className="h-4 w-4" /> Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
