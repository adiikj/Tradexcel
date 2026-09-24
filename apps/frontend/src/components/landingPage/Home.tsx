"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiPlayCircle } from "react-icons/fi";
import DashboardShowcase from "./DashboardShowcase";
import BrowserFrame from "./BrowserFrame";
import AtAGlance from "./AtAGlance";
import GettingStarted from "./GettingStarted";
import FinalCta from "./FinalCta";
import { useMinuteClock } from "../../hooks/useMinuteClock";
import { formatCountdown, nextReset } from "../../utils/season";
import FeatureGrid from "./FeatureGrid";
import WhoItsFor from "./WhoItsFor";
import LandingFaq from "./LandingFaq";
import { reveal, SectionHeading } from "./marketing";
import dashboard from "../../assets/dashboard.png";
import dashboard2 from "../../assets/dashboard2.png";

// PLACEHOLDER reviews for design and layout. Replace with real player
// feedback (with their permission) before a public launch.
const reviews = [
  {
    quote: "I'd been reading about the market for months without doing anything. Two weeks here taught me more than all of it, because losing virtual money still stings just enough.",
    name: "Aarav S.",
    meta: "Engineering student, Pune",
  },
  {
    quote: "The weekly reset is genius. A bad week doesn't haunt you, you just start fresh on Monday and try a different strategy.",
    name: "Priya N.",
    meta: "First-time investor, Kochi",
  },
  {
    quote: "Private leagues with my office friends turned into a proper rivalry. Loser buys chai on Friday.",
    name: "Rohan M.",
    meta: "Product designer, Bengaluru",
  },
  {
    quote: "Clean charts, real prices, no clutter. It feels like a real broker app, minus the fear.",
    name: "Sneha K.",
    meta: "CA aspirant, Jaipur",
  },
  {
    quote: "Price alerts plus the portfolio breakdown helped me see I was putting everything into one sector. Lesson learned for free.",
    name: "Vikram R.",
    meta: "Software engineer, Hyderabad",
  },
  {
    quote: "Chasing badges sounds silly, but Diversified actually pushed me to spread my money around. Sneaky good design.",
    name: "Ananya I.",
    meta: "MBA student, Delhi",
  },
];

const AVATAR_TINTS = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-sky-100 text-sky-700"];

function Home() {
  const now = useMinuteClock();
  return (
    <>
      {/* Hero Section */}
      <motion.div
        className="motion-container w-full pt-10 pb-12 md:py-20 lg:py-24 flex flex-col md:flex-row md:items-center bg-grey relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Left Side (Text) */}
        <motion.div
          className="relative z-10 h-auto w-full md:w-1/2 pl-6 md:pl-12 lg:pl-20 p-6 pt-12 pb-0"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Live countdown to the next weekly reset (the season is the hook) */}
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-pop text-sm font-medium text-gray-700 ring-1 ring-gray-200">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {now != null ? <>This season resets in {formatCountdown(nextReset(new Date(now)).getTime() - now)}</> : "Weekly trading seasons"}
          </p>
          <h1 className="pt-6 pb-5 font-pop font-semibold text-4xl md:text-5xl lg:text-[3.5rem] !leading-[1.12] text-balance">
            Every Monday, <span className="text-blue-500">₹1,00,000</span>. Can you top the leaderboard?
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-xl">
            Trade 250+ real NSE stocks at live prices with virtual cash. Every week is a new season: build your portfolio, climb the rankings, and start fresh the next Monday.
          </p>
          <div className="pt-9 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/signup"
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-btn-blue px-9 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-600 sm:w-auto"
            >
              Start this week&apos;s season
              <FiArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-it-works"
              className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-9 py-4 text-base font-semibold text-gray-700 transition-colors duration-200 hover:border-blue-300 hover:text-blue-600 sm:w-auto"
            >
              <FiPlayCircle aria-hidden="true" className="text-lg text-blue-500" />
              How it works
            </Link>
          </div>
          <p className="pt-5 text-sm text-gray-500">Free forever · No credit card · Real NSE prices</p>
        </motion.div>

        {/* Right Side (Dashboard Image): dark mode in front */}
        <motion.div
          className="relative z-10 w-full md:w-1/2 flex justify-center items-center py-12 md:py-0 px-4 md:pr-10 lg:pr-16"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Phones: the dark dashboard on its own */}
          <div className="w-full sm:hidden">
            <BrowserFrame src={dashboard} alt="Dashboard dark mode" priority />
          </div>
          <div className="hidden sm:block relative w-full aspect-[3/2]">
            <div className="absolute top-0 left-0 z-0 hover:z-20 w-[85%] transition-transform duration-300 hover:scale-[1.02]">
              <BrowserFrame
                src={dashboard2}
                alt="Dashboard light mode"
                priority
              />
            </div>
            <div className="absolute bottom-0 right-0 z-10 hover:z-20 w-[85%] transition-transform duration-300 hover:scale-[1.02]">
              <BrowserFrame
                src={dashboard}
                alt="Dashboard dark mode"
                priority
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AtAGlance />

      {/* Features */}
      <section className="bg-white px-6 pb-20 pt-8 md:px-12 md:pb-24">
        <motion.div {...reveal()}>
          <SectionHeading eyebrow="Why Tradexcel" title="Everything you need to learn by doing" subtitle="Real market data, real competition and clear feedback, without real money on the line." />
        </motion.div>
        <FeatureGrid />
      </section>

      <GettingStarted />

      {/* Product tour */}
      <motion.div {...reveal()}>
        <DashboardShowcase />
      </motion.div>

      <WhoItsFor />

      {/* Reviews */}
      <section className="bg-grey px-6 py-20 md:px-12 md:py-24">
        <motion.div {...reveal()}>
          <SectionHeading eyebrow="From our players" title="People are learning faster with Tradexcel" />
        </motion.div>
        <div className="mx-auto mt-12 max-w-6xl columns-1 gap-5 md:columns-2 lg:columns-3">
          {reviews.map((r, i) => (
            <motion.figure key={r.name} {...reveal((i % 3) * 0.08)} className="mb-5 break-inside-avoid rounded-3xl bg-white p-7">
              <blockquote className="leading-relaxed text-gray-800">&ldquo;{r.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-full font-pop font-semibold ${AVATAR_TINTS[i % AVATAR_TINTS.length]}`}>
                  {r.name.charAt(0)}
                </span>
                <span>
                  <span className="block font-pop text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-gray-500">{r.meta}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>

      <LandingFaq />

      <FinalCta />
    </>
  );
}

export default Home;
