"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { IconType } from "react-icons";
import {
  PiChartLineUp,
  PiChartLineUpFill,
  PiChartPieSlice,
  PiChartPieSliceFill,
  PiHouse,
  PiHouseFill,
  PiLifebuoy,
  PiLifebuoyFill,
  PiList,
  PiNewspaper,
  PiNewspaperFill,
  PiQuestion,
  PiQuestionFill,
  PiRanking,
  PiRankingFill,
  PiSquaresFour,
  PiSquaresFourFill,
  PiTrophy,
  PiTrophyFill,
  PiUsersThree,
  PiUsersThreeFill,
  PiWallet,
  PiWalletFill,
} from "react-icons/pi";
import { notifyBrowserValueChange, useBrowserValue } from "../../hooks/useBrowserValue";

// Outline icon normally, filled icon for the current page.
type NavItem = { name: string; path: string; icon: IconType; activeIcon: IconType };

const MENU_ITEMS: NavItem[] = [
  { name: "Home", path: "/dashboard", icon: PiHouse, activeIcon: PiHouseFill },
  { name: "Portfolio", path: "/portfolio", icon: PiChartPieSlice, activeIcon: PiChartPieSliceFill },
  { name: "Wallet", path: "/wallet", icon: PiWallet, activeIcon: PiWalletFill },
  { name: "Contest", path: "/contest", icon: PiTrophy, activeIcon: PiTrophyFill },
  { name: "Market", path: "/market", icon: PiChartLineUp, activeIcon: PiChartLineUpFill },
  { name: "Leaderboard", path: "/leaderboard", icon: PiRanking, activeIcon: PiRankingFill },
  { name: "Activity", path: "/activity", icon: PiUsersThree, activeIcon: PiUsersThreeFill },
  { name: "News", path: "/news", icon: PiNewspaper, activeIcon: PiNewspaperFill },
  { name: "FAQ", path: "/faq", icon: PiQuestion, activeIcon: PiQuestionFill },
  { name: "Support", path: "/support", icon: PiLifebuoy, activeIcon: PiLifebuoyFill },
];

// Help pages sit below a divider in the sidebar.
const HELP_PATHS = ["/faq", "/support"];

// Only the highest-frequency actions get a permanent slot on the mobile bar; the rest live behind "More".
const PRIMARY_MOBILE_PATHS = ["/dashboard", "/portfolio", "/wallet", "/market"];

// Active for the page itself and anything nested under it (e.g. /contest/123).
const isActivePath = (pathname: string | null, path: string) =>
  !!pathname && (pathname === path || pathname.startsWith(`${path}/`));

// The selected item: a flat, softly tinted pill.
const ACTIVE_PILL = "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";

const COLLAPSED_KEY = "sidebarCollapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function Vheader() {
  const pathname = usePathname();
  // Remembered across pages and reloads.
  const collapsed = useBrowserValue(readCollapsed, false);
  const [moreOpen, setMoreOpen] = useState(false);
  // The clicked item lights up at once instead of waiting for the next page to
  // render. Each page mounts its own Vheader, so this resets on arrival.
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const activePath = pendingPath ?? pathname;
  const markPending = (path: string) => (e: React.MouseEvent) => {
    // Opening in a new tab or window leaves this page as it is.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    setPendingPath(path);
  };

  const toggleCollapsed = () => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(!collapsed));
    } catch {}
    notifyBrowserValueChange();
  };

  const primaryMobileItems = MENU_ITEMS.filter((item) => PRIMARY_MOBILE_PATHS.includes(item.path));
  const moreMobileItems = MENU_ITEMS.filter((item) => !PRIMARY_MOBILE_PATHS.includes(item.path));
  const moreActive = moreMobileItems.some((item) => isActivePath(activePath, item.path));

  const renderSidebarItem = (item: NavItem) => {
    const isActive = isActivePath(activePath, item.path);
    const Icon = isActive ? item.activeIcon : item.icon;
    return (
      <li key={item.path}>
        <Link
          href={item.path}
          onClick={markPending(item.path)}
          data-tour={`nav-${item.path.slice(1)}`}
          aria-current={isActive ? "page" : undefined}
          aria-label={collapsed ? item.name : undefined}
          className={`group relative flex items-center rounded-2xl p-2.5 text-[15px] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            collapsed ? "justify-center" : "gap-3"
          } ${
            isActive
              ? ACTIVE_PILL
              : "text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          }`}
        >
          <Icon
            aria-hidden="true"
            className={`h-6 w-6 shrink-0 transition-transform duration-300 ${isActive ? "" : "group-hover:-translate-y-0.5"}`}
          />
          {!collapsed && <span className="truncate">{item.name}</span>}
          {collapsed && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full z-50 ml-3 -translate-x-1 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 dark:bg-gray-700"
            >
              {item.name}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Desktop: sticky vertical menu under the top bar */}
      <nav
        aria-label="Main"
        className={`hidden md:flex sticky top-16 h-[calc(100vh-4rem)] self-start shrink-0 flex-col bg-grey font-pop transition-[width] duration-500 ease-out dark:bg-gray-900 ${
          collapsed ? "w-[76px]" : "w-52"
        }`}
      >
        <div className={`flex px-3 pt-3 ${collapsed ? "justify-center" : ""}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="rounded-2xl p-2.5 text-gray-600 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <PiList aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>

        <ul className="mt-3 flex-1 space-y-1.5 px-3">
          {MENU_ITEMS.filter((item) => !HELP_PATHS.includes(item.path)).map(renderSidebarItem)}
        </ul>
        <ul className="mx-3 space-y-1.5 border-t border-gray-300/70 py-4 dark:border-gray-700/70">
          {MENU_ITEMS.filter((item) => HELP_PATHS.includes(item.path)).map(renderSidebarItem)}
        </ul>
      </nav>

      {/* Mobile: 4 primary items + a "More" sheet for the rest */}
      <nav
        aria-label="Main"
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-gray-200/80 bg-grey/95 pb-[env(safe-area-inset-bottom)] font-pop backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95"
      >
        <ul className="flex items-center justify-around px-1 py-2">
          {primaryMobileItems.map((item) => {
            const isActive = isActivePath(activePath, item.path);
            const Icon = isActive ? item.activeIcon : item.icon;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={markPending(item.path)}
                  data-tour={`nav-${item.path.slice(1)}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors duration-150 ${
                    isActive ? ACTIVE_PILL : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-6 w-6" />
                  <span className="text-[11px] font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              data-tour="nav-more"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors duration-150 ${
                moreActive ? ACTIVE_PILL : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {moreActive ? <PiSquaresFourFill aria-hidden="true" className="h-6 w-6" /> : <PiSquaresFour aria-hidden="true" className="h-6 w-6" />}
              <span className="text-[11px] font-medium">More</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* "More" bottom sheet - everything not on the primary mobile bar */}
      <AnimatePresence>
        {moreOpen && (
          <React.Fragment key="more-sheet">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="More pages"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-grey px-4 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))] font-pop text-gray-900 dark:bg-gray-900 dark:text-white"
            >
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="mx-auto mb-5 block h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700"
              />
              <ul className="grid grid-cols-3 gap-3">
                {moreMobileItems.map((item) => {
                  const isActive = isActivePath(activePath, item.path);
                  const Icon = isActive ? item.activeIcon : item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        onClick={(e) => {
                          markPending(item.path)(e);
                          setMoreOpen(false);
                        }}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex flex-col items-center gap-2 rounded-2xl py-4 transition-colors duration-200 ${
                          isActive ? ACTIVE_PILL : "bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Icon aria-hidden="true" className="h-7 w-7" />
                        <span className="text-center text-xs font-medium">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  );
}

export default Vheader;
