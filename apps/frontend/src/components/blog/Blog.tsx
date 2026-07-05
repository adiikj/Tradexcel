"use client";
import React from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiClock } from "react-icons/fi";
import Newsletter from "../landingPage/Newsletter";

const featured = {
  category: "Getting Started",
  title: "Your first week on Tradexcel: a simple plan",
  excerpt:
    "New to trading? Here's a day-by-day plan to go from your first virtual trade to a diversified portfolio, without the overwhelm.",
  date: "June 24, 2026",
  read: "6 min read",
};

const posts = [
  {
    category: "Strategy",
    title: "Reading top gainers and losers like a pro",
    excerpt:
      "The daily movers list is more than noise. Learn how to spot momentum and avoid chasing the wrong stocks.",
    date: "June 20, 2026",
    read: "5 min read",
  },
  {
    category: "Basics",
    title: "What is a portfolio, really?",
    excerpt:
      "Holdings, returns, balance, broken down in plain language so the numbers on your dashboard finally make sense.",
    date: "June 14, 2026",
    read: "4 min read",
  },
  {
    category: "Mindset",
    title: "Why practising with virtual money works",
    excerpt:
      "The psychology of risk-free trading and how it builds the habits that matter before real money is on the line.",
    date: "June 8, 2026",
    read: "7 min read",
  },
  {
    category: "Product",
    title: "Contests are coming to Tradexcel",
    excerpt:
      "A first look at leaderboards and timed trading contests, and how they'll make practice a lot more fun.",
    date: "June 2, 2026",
    read: "3 min read",
  },
  {
    category: "Strategy",
    title: "Diversification for beginners",
    excerpt:
      "Don't put all your virtual eggs in one basket. A practical guide to spreading risk across your holdings.",
    date: "May 27, 2026",
    read: "6 min read",
  },
  {
    category: "Basics",
    title: "Market orders vs limit orders",
    excerpt:
      "Two ways to buy and sell, and when each one makes sense. The difference matters more than you'd think.",
    date: "May 21, 2026",
    read: "5 min read",
  },
];

function Blog() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-blue-500 font-pop text-lg font-semibold">The Tradexcel Blog</p>
          <h1 className="py-4 font-pop font-semibold text-4xl md:text-5xl lg:leading-tight">
            Insights to make you a <span className="text-blue-500">sharper trader</span>
          </h1>
          <p className="text-gray-600 text-lg">
            Strategy, basics and product updates, written for people learning the market.
          </p>
        </motion.div>
      </section>

      {/* Featured */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto bg-white rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 min-h-[220px] md:min-h-full flex items-center justify-center p-10">
            <span className="text-white/90 font-pop font-semibold text-xl text-center">
              Featured
            </span>
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <span className="text-blue-500 font-pop font-semibold text-sm">
              {featured.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold font-pop mt-3">
              {featured.title}
            </h2>
            <p className="text-gray-600 mt-4 leading-relaxed">{featured.excerpt}</p>
            <div className="flex items-center gap-4 text-gray-500 text-sm mt-6">
              <span>{featured.date}</span>
              <span className="flex items-center gap-1">
                <FiClock /> {featured.read}
              </span>
            </div>
            <button className="mt-6 inline-flex items-center gap-2 text-btn-blue font-medium text-sm w-fit">
              Read article <FiArrowRight />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Grid */}
      <section className="bg-white w-full px-6 md:px-16 lg:px-24 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {posts.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="group cursor-pointer rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-grey flex items-center justify-center">
                <span className="text-blue-300 font-pop font-semibold text-sm">
                  {p.category}
                </span>
              </div>
              <div className="p-6">
                <span className="text-blue-500 font-pop font-semibold text-xs">
                  {p.category}
                </span>
                <h3 className="text-lg font-semibold font-pop mt-2 group-hover:text-blue-500 transition-colors">
                  {p.title}
                </h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{p.excerpt}</p>
                <div className="flex items-center gap-3 text-gray-500 text-xs mt-4">
                  <span>{p.date}</span>
                  <span className="flex items-center gap-1">
                    <FiClock /> {p.read}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <Newsletter />
    </>
  );
}

export default Blog;
