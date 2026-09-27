"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrowserFrame from "./BrowserFrame";

import portfolio from "../../assets/tradexcel/dash-portfolio.png";
import wallet from "../../assets/tradexcel/dash-wallet.png";
import market from "../../assets/tradexcel/dash-market-live.png";
import analytics from "../../assets/tradexcel/dash-analytics.png";
import learn from "../../assets/tradexcel/dash-learn.png";
import home from "../../assets/tradexcel/dash-home-live.png";
import contests from "../../assets/tradexcel/dash-contests.png";
import leaderboard from "../../assets/tradexcel/dash-leaderboard.png";
import achievements from "../../assets/tradexcel/dash-achievements.png";
import news from "../../assets/tradexcel/dash-news.png";
import profile from "../../assets/tradexcel/dash-profile.png";

const tabs = [
  {
    key: "home",
    label: "Home",
    img: home,
    heading: "Your day at a glance",
    desc: "Net worth, rank and today's biggest movers, plus a daily call: will NIFTY 50 close up or down next session?",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    img: portfolio,
    heading: "Track every holding, live",
    desc: "Net worth, invested amount, cash on hand, and a full allocation breakdown across every position you hold.",
  },
  {
    key: "wallet",
    label: "Wallet",
    img: wallet,
    heading: "A clear ledger of every trade",
    desc: "Your cash balance, this season's cash flow day by day, and every buy and sell with its charges itemised.",
  },
  {
    key: "analytics",
    label: "Analytics",
    img: analytics,
    heading: "Know what's actually working",
    desc: "Your season charted against NIFTY 50, realized P&L and win rate, sector exposure and a journal for every trade.",
  },
  {
    key: "market",
    label: "Market",
    img: market,
    heading: "Real prices, real movement",
    desc: "Browse 250+ NSE stocks with live prices, detailed charts and a heatmap of the whole market, and star the ones you want to watch.",
  },
  {
    key: "learn",
    label: "Learn",
    img: learn,
    heading: "Learn by doing",
    desc: "Short quests that each end with something to try, and replays of real market moments like the 2020 crash to trade through day by day.",
  },
  {
    key: "contests",
    label: "Contests",
    img: contests,
    heading: "Compete in public or private leagues",
    desc: "Join a live public contest, host a private league with its own stocks and rules, or challenge a friend to a 1v1 duel.",
  },
  {
    key: "leaderboard",
    label: "Leaderboard",
    img: leaderboard,
    heading: "See where you rank",
    desc: "A global leaderboard ranked by net worth, with weekly champions and contest winners called out.",
  },
  {
    key: "achievements",
    label: "Achievements",
    img: achievements,
    heading: "Unlock badges as you trade",
    desc: "19 achievements track everything from your first trade to reaching the top of the leaderboard.",
  },
  {
    key: "news",
    label: "News",
    img: news,
    heading: "Market news that matters to you",
    desc: "The latest Indian market headlines, with stories about the stocks you hold flagged for you.",
  },
  {
    key: "profile",
    label: "Profile",
    img: profile,
    heading: "Your trading identity, all in one place",
    desc: "Net worth, rank, login streak, and every badge you've earned, plus a weekly performance breakdown.",
  },
];

// Long enough to read the heading, the line under it and glance at the screen.
const AUTO_ADVANCE_MS = 6000;

function DashboardShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeTab = tabs[active];

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = setTimeout(() => {
      setActive((prev) => (prev + 1) % tabs.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(id);
  }, [active, paused]);

  return (
    <div
      className="bg-white w-full relative overflow-hidden px-6 sm:px-10 md:px-12 lg:px-20 py-16 md:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <h6 className="font-pop text-sm font-semibold uppercase tracking-widest text-blue-600">
          Inside Tradexcel
        </h6>
        <p className="mt-3 font-pop text-3xl font-semibold leading-tight md:text-4xl">
          Everything you&apos;d expect from a real trading platform
        </p>
        <p className="mt-4 text-lg text-gray-600">
          Every screen below is the actual product, not a mockup. Explore what your
          account looks like from day one.
        </p>
      </div>

      {/* Tab bar */}
      <div className="relative z-10 mt-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center">
        {tabs.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              className={`relative overflow-hidden shrink-0 px-4 py-2.5 rounded-full text-sm font-medium font-pop transition-colors duration-200 ${
                isActive
                  ? "bg-btn-blue text-white"
                  : "bg-grey text-gray-600 hover:text-blue-600"
              }`}
            >
              {isActive && (
                <span
                  key={active}
                  className="absolute inset-0 bg-white/25 origin-left"
                  style={{
                    animation: `showcase-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="relative z-10 mt-10 max-w-5xl mx-auto rounded-3xl bg-grey p-4 sm:p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-6"
          >
            <h3 className="text-xl md:text-2xl font-semibold font-pop">
              {activeTab.heading}
            </h3>
            <p className="text-gray-600 mt-2 max-w-xl mx-auto">{activeTab.desc}</p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.key + "-img"}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.3 }}
          >
            <BrowserFrame
              src={activeTab.img}
              alt={activeTab.label}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DashboardShowcase;
