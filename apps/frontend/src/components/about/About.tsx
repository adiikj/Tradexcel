"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BrowserFrame from "../landingPage/BrowserFrame";
import FinalCta from "../landingPage/FinalCta";
import { PageHero, SectionHeading, reveal } from "../landingPage/marketing";
import dashboard from "../../assets/dashboard.png";

const story = [
  { title: "Most people never make the first trade", desc: "Investing feels intimidating and expensive, so the first step keeps getting postponed." },
  { title: "Real money makes mistakes costly", desc: "The fastest way to learn is by doing, but with real savings every mistake hurts." },
  { title: "So we took the money out", desc: "Tradexcel gives you the real market with virtual cash. Make the mistakes here, keep the lessons." },
];

const values = [
  { title: "Risk-free by design", desc: "Every rupee on Tradexcel is virtual. Learn how markets move, make mistakes, and build conviction without ever risking real money." },
  { title: "Real market data", desc: "Prices, gainers and losers mirror the live NSE, so the habits you build here carry over to the real thing." },
  { title: "Built for competition", desc: "Weekly seasons, leaderboards and contests turn practice into a game. Prove your strategy against everyone else." },
  { title: "Beginner friendly", desc: "A clean, focused interface that gets out of your way, whether it's your first trade or your thousandth." },
];

function About() {
  return (
    <>
      <PageHero
        eyebrow="About Tradexcel"
        title={
          <>
            Learn to trade by <span className="text-blue-500">actually trading</span>
          </>
        }
        subtitle="Tradexcel is a stock-trading simulator. Buy and sell real NSE stocks with virtual money, track your portfolio, and compete every week, with all the thrill of the market and none of the risk."
      >
        <motion.div className="mx-auto max-w-5xl" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          <BrowserFrame src={dashboard} alt="The Tradexcel dashboard" />
        </motion.div>
      </PageHero>

      {/* Why it exists */}
      <section className="bg-white px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <motion.div {...reveal()}>
            <SectionHeading
              align="left"
              eyebrow="Our mission"
              title="Make market confidence accessible to everyone"
              subtitle="By the time you trade for real, the mechanics should feel like second nature."
            />
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-btn-blue px-8 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-600"
            >
              Start trading free
            </Link>
          </motion.div>
          <ol className="space-y-4">
            {story.map((s, i) => (
              <motion.li key={s.title} {...reveal(i * 0.08)} className="flex gap-5 rounded-3xl border border-gray-200 bg-white p-6">
                <span className="font-pop text-3xl font-semibold tabular-nums text-blue-600">0{i + 1}</span>
                <span>
                  <span className="block font-pop text-lg font-semibold">{s.title}</span>
                  <span className="mt-1 block text-gray-600">{s.desc}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-grey px-6 py-20 md:px-12 md:py-24">
        <motion.div {...reveal()}>
          <SectionHeading eyebrow="What we stand for" title="The principles behind every feature" />
        </motion.div>
        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2">
          {values.map((v, i) => (
            <motion.div key={v.title} {...reveal((i % 2) * 0.08)} className="rounded-3xl bg-white p-8">
              <p className="font-pop text-sm font-semibold tabular-nums text-gray-400">0{i + 1}</p>
              <h3 className="mt-3 font-pop text-2xl font-semibold">{v.title}</h3>
              <p className="mt-3 leading-relaxed text-gray-600">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who's behind it */}
      <section className="bg-white px-6 py-20 md:px-12">
        <motion.div {...reveal()} className="mx-auto grid max-w-6xl items-center gap-8 rounded-3xl border border-gray-200 p-8 md:grid-cols-[auto_1fr_auto] md:p-10">
          <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 font-pop text-2xl font-semibold text-blue-700">
            A
          </span>
          <div>
            <p className="font-pop text-sm font-semibold uppercase tracking-widest text-blue-600">Who&apos;s behind it</p>
            <p className="mt-2 font-pop text-xl font-semibold">An independent project, designed and built by Aditya in New Delhi.</p>
            <p className="mt-2 text-gray-600">Have an idea, found a bug, or just want to say hi? Messages go straight to the person who built it.</p>
          </div>
          <Link
            href="/contactus"
            className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-base font-semibold text-gray-800 transition-colors duration-200 hover:border-blue-300 hover:text-blue-600"
          >
            Get in touch
          </Link>
        </motion.div>
      </section>

      <FinalCta />
    </>
  );
}

export default About;
