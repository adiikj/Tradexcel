"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiTrendingUp,
  FiAward,
  FiPieChart,
  FiZap,
  FiShield,
  FiBarChart2,
  FiCheck,
  FiX,
} from "react-icons/fi";

const features = [
  {
    icon: FiShield,
    title: "Zero financial risk",
    desc: "Trade with ₹1,00,000 of virtual cash. Experiment with bold strategies you'd never try with real savings.",
  },
  {
    icon: FiTrendingUp,
    title: "Live market prices",
    desc: "Real-time quotes, top gainers and losers so your decisions are grounded in what the market is actually doing.",
  },
  {
    icon: FiPieChart,
    title: "Portfolio tracking",
    desc: "See holdings, returns and balance at a glance, with the analytics to understand why your portfolio moves.",
  },
  {
    icon: FiAward,
    title: "Leaderboards & contests",
    desc: "Compete with other traders, climb the rankings, and turn learning into a game worth winning.",
  },
  {
    icon: FiZap,
    title: "Fast and focused",
    desc: "A clean interface with no clutter. Place a trade in seconds and get back to strategy.",
  },
  {
    icon: FiBarChart2,
    title: "Built to learn",
    desc: "Every screen is designed to teach. Build real market intuition before you ever risk a rupee.",
  },
];

const compareRows = [
  { label: "Real money at risk", tradexcel: false, real: true, paper: false },
  { label: "Live market prices", tradexcel: true, real: true, paper: false },
  { label: "Portfolio analytics", tradexcel: true, real: true, paper: false },
  { label: "Leaderboards & contests", tradexcel: true, real: false, paper: false },
  { label: "Free to use", tradexcel: true, real: false, paper: true },
  { label: "Beginner friendly", tradexcel: true, real: false, paper: true },
];

function Cell({ on }: { on: boolean }) {
  return on ? (
    <FiCheck className="mx-auto text-green-500 text-xl" />
  ) : (
    <FiX className="mx-auto text-gray-300 text-xl" />
  );
}

function WhyUs() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 pt-16 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-blue-500 font-pop text-lg font-semibold">Why Tradexcel</p>
          <h1 className="py-4 font-pop font-semibold text-4xl md:text-5xl lg:leading-tight">
            The smartest way to <span className="text-blue-500">practice the market</span>
          </h1>
          <p className="text-gray-600 text-lg">
            All the realism of live trading, none of the risk. Here's why thousands choose
            Tradexcel to build their confidence.
          </p>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="bg-white w-full px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 text-2xl">
                  <Icon />
                </div>
                <h3 className="text-lg font-semibold font-pop mt-5">{f.title}</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold font-pop text-center">
            How Tradexcel compares
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mt-10 bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="grid grid-cols-4 bg-blue-500 text-white font-pop text-sm md:text-base">
              <div className="p-4 font-semibold">Feature</div>
              <div className="p-4 font-semibold text-center">Tradexcel</div>
              <div className="p-4 font-semibold text-center">Real-money app</div>
              <div className="p-4 font-semibold text-center">Pen &amp; paper</div>
            </div>
            {compareRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 items-center text-sm md:text-base ${
                  i % 2 ? "bg-grey" : "bg-white"
                }`}
              >
                <div className="p-4 text-gray-700">{row.label}</div>
                <div className="p-4">
                  <Cell on={row.tradexcel} />
                </div>
                <div className="p-4">
                  <Cell on={row.real} />
                </div>
                <div className="p-4">
                  <Cell on={row.paper} />
                </div>
              </div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link href="/signup">
              <button className="px-10 py-4 rounded-lg bg-btn-blue text-white text-sm font-medium">
                Get Started Free
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default WhyUs;
