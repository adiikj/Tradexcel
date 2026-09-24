"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import LiveTicker, { useTickerQuotes } from "./LiveTicker";

// Small product notifications that drift gently beside the headline.
function FloatingCard({ children, delay, className }: { children: React.ReactNode; delay: number; className: string }) {
  return (
    <motion.div
      className={`rounded-2xl bg-white p-4 text-gray-900 shadow-lg ring-1 ring-gray-200 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FinalCta() {
  const quotes = useTickerQuotes();
  return (
    <section className="bg-white px-6 py-20 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200 bg-grey"
      >
        {/* Live tape along the top edge */}
        <div className="border-b border-gray-200 bg-white py-3">
          <LiveTicker quotes={quotes} speed={55} />
        </div>

        <div className="grid items-center gap-12 px-6 py-14 md:px-14 md:py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-pop text-sm font-semibold uppercase tracking-widest text-blue-600">Ready when you are</p>
            <h2 className="mt-4 font-pop text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
              Your first trade is <span className="text-blue-500">one minute</span> away
            </h2>
            <p className="mt-5 max-w-lg text-lg text-gray-600">
              Sign up, get ₹1,00,000 in virtual cash and buy your first stock at today&apos;s real price. All of the learning, none of the risk.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-btn-blue px-8 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-600"
              >
                Start trading free
                <FiArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/why-us"
                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-800 transition-colors duration-200 hover:border-blue-300 hover:text-blue-600"
              >
                Why Tradexcel?
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">Free forever · No credit card · Virtual money only</p>
          </div>

          {/* Product moments */}
          <div className="relative hidden h-72 lg:block" aria-hidden="true">
            <FloatingCard delay={0.2} className="absolute left-0 top-2 w-64">
              <p className="text-xs font-medium text-gray-500">Order filled</p>
              <p className="mt-1 font-pop font-semibold">Bought 5 × RELIANCE</p>
              <p className="mt-1 text-sm text-gray-500">at the live market price</p>
            </FloatingCard>
            <FloatingCard delay={0.5} className="absolute right-0 top-28 w-56">
              <p className="text-xs font-medium text-gray-500">This week</p>
              <p className="mt-1 font-pop text-2xl font-semibold text-green-600">▲ +5.40%</p>
              <p className="text-sm text-gray-500">You moved up to #2</p>
            </FloatingCard>
            <FloatingCard delay={0.8} className="absolute -bottom-2 left-0 w-52">
              <p className="text-xs font-medium text-gray-500">Badge unlocked</p>
              <p className="mt-1 font-pop font-semibold">Diversified</p>
              <p className="text-sm text-gray-500">5 different stocks at once</p>
            </FloatingCard>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default FinalCta;
