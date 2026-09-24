"use client";
import React, { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { motion } from "framer-motion";
import FinalCta from "../landingPage/FinalCta";
import { PageHero, reveal } from "../landingPage/marketing";
import dashboardShot from "../../assets/dashboard.png";
import marketShot from "../../assets/tradexcel/dash-market.png";
import portfolioShot from "../../assets/tradexcel/dash-portfolio.png";
import walletShot from "../../assets/tradexcel/dash-wallet.png";
import profileShot from "../../assets/tradexcel/dash-profile.png";

type Post = { category: string; title: string; excerpt: string; read: string };

// Articles are planned but not written yet, so cards say "Coming soon"
// instead of linking to pages that don't exist.
const featured: Post = {
  category: "Getting started",
  title: "Your first week on Tradexcel: a simple plan",
  excerpt: "New to trading? A day-by-day plan to go from your first virtual trade to a diversified portfolio, without the overwhelm.",
  read: "6 min read",
};

const posts: Post[] = [
  { category: "Strategy", title: "Reading top gainers and losers like a pro", excerpt: "The daily movers list is more than noise. Learn how to spot momentum and avoid chasing the wrong stocks.", read: "5 min read" },
  { category: "Basics", title: "What is a portfolio, really?", excerpt: "Holdings, returns and cash, broken down in plain language so the numbers on your dashboard finally make sense.", read: "4 min read" },
  { category: "Mindset", title: "Why practising with virtual money works", excerpt: "The psychology of risk-free trading and how it builds the habits that matter before real money is on the line.", read: "7 min read" },
  { category: "Product", title: "How contests and private leagues work", excerpt: "Timed competitions with their own cash, and how to start a league with friends using an invite code.", read: "3 min read" },
  { category: "Strategy", title: "Diversification for beginners", excerpt: "Don't put all your virtual eggs in one basket. A practical guide to spreading risk across your holdings.", read: "6 min read" },
  { category: "Basics", title: "Market orders vs limit orders", excerpt: "Two ways to buy and sell, and when each one makes sense. The difference matters more than you'd think.", read: "5 min read" },
];

// Each topic gets a real product screen as its cover.
const COVERS: Record<string, StaticImageData> = {
  "Getting started": dashboardShot,
  Strategy: marketShot,
  Basics: portfolioShot,
  Mindset: walletShot,
  Product: profileShot,
};

const CATEGORIES = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];

// Screenshots are 16:10, so a 16:10 box shows the whole screen, uncropped.
function Cover({ category, className = "" }: { category: string; className?: string }) {
  const src = COVERS[category] ?? COVERS["Getting started"];
  return (
    <div className={`aspect-[16/10] overflow-hidden bg-gray-900 ${className}`}>
      <Image src={src} alt="" sizes="(min-width: 1024px) 40vw, 100vw" className="block h-full w-full object-contain" />
    </div>
  );
}

function Meta({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-700">Coming soon</span>
      <span className="text-gray-500">{post.read}</span>
    </div>
  );
}

function Blog() {
  const [category, setCategory] = useState("All");
  const shown = category === "All" ? posts : posts.filter((p) => p.category === category);

  return (
    <>
      <PageHero
        eyebrow="The Tradexcel blog"
        title={
          <>
            Insights to make you a <span className="text-blue-500">sharper trader</span>
          </>
        }
        subtitle="Strategy, basics and product guides, written for people learning the market."
      >
        {/* Featured */}
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid items-center overflow-hidden rounded-3xl border border-gray-200 bg-white md:grid-cols-2"
        >
          <Cover category={featured.category} className="self-center" />
          <div className="flex flex-col justify-center p-8 md:p-10">
            <p className="font-pop text-sm font-semibold uppercase tracking-widest text-blue-600">{featured.category}</p>
            <h2 className="mt-3 font-pop text-2xl font-semibold leading-snug md:text-3xl">{featured.title}</h2>
            <p className="mt-3 text-gray-600">{featured.excerpt}</p>
            <div className="mt-6">
              <Meta post={featured} />
            </div>
          </div>
        </motion.article>
      </PageHero>

      <section className="bg-white px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === c ? "bg-gray-900 text-white" : "bg-grey text-gray-700 hover:text-gray-900"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((post, i) => (
              <motion.article key={post.title} {...reveal((i % 3) * 0.06)} className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white">
                <Cover category={post.category} />
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-pop text-xs font-semibold uppercase tracking-widest text-blue-600">{post.category}</p>
                  <h3 className="mt-2 font-pop text-lg font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                  <div className="mt-5">
                    <Meta post={post} />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

export default Blog;
