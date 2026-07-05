"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiTarget, FiShield, FiUsers, FiTrendingUp } from "react-icons/fi";
import Newsletter from "../landingPage/Newsletter";

const values = [
  {
    icon: FiShield,
    title: "Risk-Free by Design",
    desc: "Every rupee on Tradexcel is virtual. Learn how markets move, make mistakes, and build conviction without ever risking real money.",
  },
  {
    icon: FiTrendingUp,
    title: "Real Market Data",
    desc: "Prices, gainers and losers mirror the live market, so the habits you build here translate to the real thing.",
  },
  {
    icon: FiUsers,
    title: "Built for Competition",
    desc: "Leaderboards and contests turn practice into a game. Climb the ranks and prove your strategy against everyone else.",
  },
  {
    icon: FiTarget,
    title: "Beginner Friendly",
    desc: "A clean, focused interface that gets out of your way, whether it's your first trade or your thousandth.",
  },
];

const stats = [
  { value: "₹1,00,000", label: "Virtual starting balance" },
  { value: "Real-time", label: "Market price updates" },
  { value: "0", label: "Rupees of real risk" },
];

function About() {
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
          <p className="text-blue-500 font-pop text-lg font-semibold">About Tradexcel</p>
          <h1 className="py-4 font-pop font-semibold text-4xl md:text-5xl lg:leading-tight">
            Learn to trade by <span className="text-blue-500">actually trading</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Tradexcel is a gamified stock-trading simulator. Buy and sell real stocks with
            virtual money, track your portfolio, and compete on the leaderboard, all the
            thrill of the market with none of the financial risk.
          </p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="bg-white w-full px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-blue-500 font-pop font-semibold">OUR MISSION</p>
            <h2 className="text-3xl md:text-4xl font-semibold font-pop mt-2 mb-4">
              Make market confidence accessible to everyone
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Most people never start investing because the first trade feels intimidating
              and expensive. Tradexcel removes that barrier. You get a virtual portfolio, live
              market conditions, and a playful, competitive environment to sharpen your
              instincts. By the time you trade for real, the mechanics are second nature.
            </p>
            <Link href="/signup">
              <button className="mt-8 px-10 py-4 rounded-lg bg-btn-blue text-white text-sm font-medium">
                Start Trading Free
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-6"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-grey rounded-2xl p-6 text-center md:text-left"
              >
                <div className="text-3xl font-semibold font-pop text-blue-500">{s.value}</div>
                <div className="text-gray-600 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 py-16 md:py-20">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold font-pop">What we stand for</h2>
          <p className="text-gray-600 mt-3">The principles behind every feature we build.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-6 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 text-2xl">
                    <Icon />
                  </div>
                  <h3 className="text-lg font-semibold font-pop mt-5">{v.title}</h3>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}

export default About;
