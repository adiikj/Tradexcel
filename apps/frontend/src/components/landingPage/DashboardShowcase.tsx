"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBriefcase,
  FiCreditCard,
  FiAward,
  FiBarChart2,
  FiUsers,
  FiFileText,
} from "react-icons/fi";
import BrowserFrame from "./BrowserFrame";

import portfolio from "../../assets/tradexcel/dash-portfolio.png";
import wallet from "../../assets/tradexcel/dash-wallet.png";
import market from "../../assets/tradexcel/dash-market.png";
import contests from "../../assets/tradexcel/dash-contests.png";
import leaderboard from "../../assets/tradexcel/dash-leaderboard.png";
import achievements from "../../assets/tradexcel/dash-achievements.png";
import news from "../../assets/tradexcel/dash-news.png";
import profile from "../../assets/tradexcel/dash-profile-public.png";

const tabs = [
  {
    key: "portfolio",
    label: "Portfolio",
    icon: FiBriefcase,
    img: portfolio,
    heading: "Track every holding, live",
    desc: "Net worth, invested amount, cash on hand, and a full allocation breakdown across every position you hold.",
  },
  {
    key: "wallet",
    label: "Wallet",
    icon: FiCreditCard,
    img: wallet,
    heading: "A clear ledger of every trade",
    desc: "Your virtual cash balance and a running history of every buy and sell, timestamped and itemized.",
  },
  {
    key: "market",
    label: "Market",
    icon: FiBarChart2,
    img: market,
    heading: "Real prices, real movement",
    desc: "Browse gainers, losers, and your own holdings with live sparklines pulled from the real market.",
  },
  {
    key: "contests",
    label: "Contests",
    icon: FiAward,
    img: contests,
    heading: "Compete in public or private leagues",
    desc: "Join a live public contest or host your own private room with a custom stock universe and invite code.",
  },
  {
    key: "leaderboard",
    label: "Leaderboard",
    icon: FiUsers,
    img: leaderboard,
    heading: "See where you rank",
    desc: "A global leaderboard ranked by net worth, with weekly champions and contest winners called out.",
  },
  {
    key: "achievements",
    label: "Achievements",
    icon: FiAward,
    img: achievements,
    heading: "Unlock badges as you trade",
    desc: "18 achievements track everything from your first trade to reaching the top of the leaderboard.",
  },
  {
    key: "news",
    label: "News",
    icon: FiFileText,
    img: news,
    heading: "Market news, personalized",
    desc: "A live feed of market headlines tagged to the tickers you actually hold or follow.",
  },
  {
    key: "profile",
    label: "Profile",
    icon: FiUsers,
    img: profile,
    heading: "A shareable public profile",
    desc: "Every trader gets a public profile with rank, badges, and weekly performance — shareable in one click.",
  },
];

function DashboardShowcase() {
  const [active, setActive] = useState(0);
  const activeTab = tabs[active];

  return (
    <div className="bg-white w-full relative overflow-hidden px-6 sm:px-10 md:px-12 lg:px-20 py-16 md:py-20">
      {/* decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-blue-50 blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <h6 className="text-blue-500 font-pop text-lg font-semibold">
          Inside Tradexcel
        </h6>
        <p className="text-3xl md:text-4xl pt-2 font-semibold font-pop">
          Everything you'd expect from a real trading platform
        </p>
        <p className="text-gray-600 mt-4">
          Every screen below is the actual product, not a mockup. Explore what your
          account looks like from day one.
        </p>
      </div>

      {/* Tab bar */}
      <div className="relative z-10 mt-10 flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const isActive = i === active;
          return (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-full text-sm font-medium font-pop transition-colors duration-200 ${
                isActive
                  ? "bg-btn-blue text-white"
                  : "bg-grey text-gray-600 hover:text-blue-600"
              }`}
            >
              <Icon className="text-base" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="relative z-10 mt-10 max-w-5xl mx-auto rounded-3xl bg-gradient-to-b from-blue-50 to-grey/60 p-4 sm:p-6 md:p-10">
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
              src={((activeTab.img)?.src || (activeTab.img)) as string}
              alt={activeTab.label}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DashboardShowcase;
