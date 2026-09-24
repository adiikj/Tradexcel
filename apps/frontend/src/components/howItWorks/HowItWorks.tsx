"use client";
import React from "react";
import { motion } from "framer-motion";
import GettingStarted from "../landingPage/GettingStarted";
import FinalCta from "../landingPage/FinalCta";
import { PageHero, SectionHeading, reveal } from "../landingPage/marketing";

// A week on Tradexcel, as it actually runs (see backend weeklyReset.ts and marketHours.ts).
const week = [
  { when: "Mon to Fri, 9:15 AM to 3:30 PM IST", title: "The market is live", desc: "Prices move with the NSE. Buy, sell and watch your net worth change in real time." },
  { when: "Any time", title: "Contests run alongside", desc: "Public contests and private leagues have their own cash and schedule, separate from your wallet." },
  { when: "Monday, 5:30 AM IST", title: "The week closes", desc: "Holdings are sold at market price, your result is saved, and the best return of the week becomes weekly champion." },
  { when: "Straight after", title: "A fresh season starts", desc: "Your wallet is back to ₹1,00,000 and everyone starts level again." },
];

const questions = [
  { q: "Is it really free?", a: "Yes. Tradexcel is free, and no real money is ever involved. There's nothing to deposit and no card to add." },
  { q: "Are the prices real?", a: "Yes. Every trade uses live NSE prices during market hours, and the last traded price when the market is closed." },
  { q: "What happens to my stocks on Monday?", a: "They're sold at market price, your result for the week is recorded, and you start again with ₹1,00,000." },
  { q: "Can I play with friends?", a: "Create a private league with your own stocks and schedule, then share the invite code with friends." },
];

function HowItWorks() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            From sign-up to your first trade <span className="text-blue-500">in minutes</span>
          </>
        }
        subtitle="Four steps stand between you and a smarter way to learn the market."
      />

      <GettingStarted showHeading={false} />

      {/* The weekly rhythm */}
      <section className="bg-white px-6 py-20 md:px-12 md:py-24">
        <motion.div {...reveal()}>
          <SectionHeading eyebrow="Your week" title="Every week is a new season" subtitle="Tradexcel runs on a weekly rhythm, so there's always a fresh chance to climb the leaderboard." />
        </motion.div>
        <ol className="relative mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-4">
          {week.map((w, i) => (
            <motion.li key={w.title} {...reveal(i * 0.08)} className="relative rounded-3xl border border-gray-200 bg-white p-6">
              <span className="font-pop text-sm font-semibold tabular-nums text-gray-400">0{i + 1}</span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-blue-600">{w.when}</p>
              <h3 className="mt-2 font-pop text-lg font-semibold">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{w.desc}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Quick answers */}
      <section className="bg-grey px-6 py-20 md:px-12 md:py-24">
        <motion.div {...reveal()}>
          <SectionHeading eyebrow="Quick answers" title="Before you start" />
        </motion.div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          {questions.map((item, i) => (
            <motion.div key={item.q} {...reveal((i % 2) * 0.08)} className="rounded-3xl bg-white p-7">
              <h3 className="font-pop text-lg font-semibold">{item.q}</h3>
              <p className="mt-2 leading-relaxed text-gray-600">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <FinalCta />
    </>
  );
}

export default HowItWorks;
