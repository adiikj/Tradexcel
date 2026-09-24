"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { reveal } from "./marketing";
import marketShot from "../../assets/tradexcel/dash-market.png";
import competeArt from "../../assets/card2.png";

// A feature tile: title and one line, plus either a cropped product screenshot
// or a small piece of real UI, so the grid shows the product instead of icons.
// `side` puts the visual beside the text (for the wide tiles), so a
// screenshot stays small instead of stretching across the whole tile.
function Feature({ title, desc, children, className = "", side = false }: { title: string; desc: string; children?: React.ReactNode; className?: string; side?: boolean }) {
  return (
    <motion.div
      {...reveal()}
      className={`overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 md:p-8 ${side ? "grid items-center gap-6 md:grid-cols-[1fr_1.15fr]" : "flex flex-col"} ${className}`}
    >
      <div>
        <h3 className="font-pop text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-gray-600">{desc}</p>
      </div>
      {children && <div className={side ? "" : "mt-6 flex-1"}>{children}</div>}
    </motion.div>
  );
}

// An illustration, shown whole.
function Art({ src }: { src: typeof competeArt }) {
  return <Image src={src} alt="" sizes="(min-width: 1024px) 380px, 100vw" className="mx-auto block h-auto w-full max-w-sm rounded-2xl" />;
}

// The whole screenshot, scaled to the tile's width (never cropped).
function Shot({ src, alt }: { src: typeof marketShot; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <Image src={src} alt={alt} sizes="(min-width: 1024px) 380px, 100vw" className="block h-auto w-full" />
    </div>
  );
}

// The product's main features as a bento grid (landing page and Why Us).
function FeatureGrid() {
  return (
    <div className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-3">
      <Feature side className="lg:col-span-2" title="Live NSE prices" desc="Every trade fills at the real market price. Study any of 250+ stocks with charts from one day to five years.">
        <Shot src={marketShot} alt="The Market page with a live stock chart" />
      </Feature>
      <Feature title="Weekly seasons" desc="Every Monday your cash resets to ₹1,00,000 and your result is saved. A bad week never follows you.">
        <div className="rounded-2xl bg-grey p-5">
          <p className="text-xs text-gray-500">Season resets in</p>
          <p className="font-pop text-3xl font-semibold tabular-nums">3d 14h</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Last week</span>
              <span className="font-semibold text-green-600">▲ +4.21%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Week before</span>
              <span className="font-semibold text-red-600">▼ −1.35%</span>
            </div>
          </div>
        </div>
      </Feature>
      <Feature title="Contests and private leagues" desc="Join timed public contests, or create a league with its own stocks and invite your friends with a code.">
        <div className="rounded-2xl bg-grey p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-pop font-semibold">Friday Night League</p>
            <span className="shrink-0 rounded-full bg-green-600/10 px-2 py-0.5 text-xs font-semibold text-green-700">● Live</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">8 players · Ends in 2h 15m</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full w-2/3 rounded-full bg-green-500" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-sm">
            <span className="text-gray-500">Invite code</span>
            <span className="rounded-md bg-white px-2.5 py-1 font-mono font-semibold tracking-widest">X7K2QP</span>
          </div>
        </div>
      </Feature>
      <Feature side className="lg:col-span-2" title="Leaderboards and achievements" desc="Climb the weekly leaderboard, follow other traders and unlock 18 badges, from your first trade to King of the Hill.">
        <Art src={competeArt} />
      </Feature>
      <Feature title="Price alerts" desc="Set a target and get notified the moment a stock crosses it.">
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-2xl bg-grey px-4 py-3 text-sm">
            <span className="font-semibold">RELIANCE above ₹1,250</span>
            <span className="text-xs font-medium text-green-700">Triggered</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-grey px-4 py-3 text-sm">
            <span className="font-semibold">TCS below ₹2,000</span>
            <span className="text-xs font-medium text-gray-500">Watching</span>
          </div>
        </div>
      </Feature>
      <Feature
        side
        className="lg:col-span-2"
        title="Clear feedback"
        desc="See how your money is split, what each stock returned and every weekly result, so you know what worked and why."
      >
        {/* A small version of the portfolio allocation view */}
        <div className="rounded-2xl bg-grey p-5">
          <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
            <span className="w-[38%] bg-blue-500" />
            <span className="w-[22%] bg-amber-500" />
            <span className="w-[15%] bg-green-500" />
            <span className="w-[25%] bg-gray-300" />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["bg-blue-500", "RELIANCE", "38%", "▲ +3.2%", "text-green-700"],
              ["bg-amber-500", "TCS", "22%", "▼ −1.1%", "text-red-600"],
              ["bg-green-500", "INFY", "15%", "▲ +0.8%", "text-green-700"],
              ["bg-gray-300", "Cash", "25%", "", ""],
            ].map(([dot, name, share, ret, tone]) => (
              <li key={name} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${dot}`} aria-hidden="true" />
                <span className="flex-1 font-medium">{name}</span>
                <span className="w-16 text-right tabular-nums text-gray-500">{share}</span>
                <span className={`w-16 text-right text-xs font-semibold tabular-nums ${tone}`}>{ret}</span>
              </li>
            ))}
          </ul>
        </div>
      </Feature>
    </div>
  );
}

export default FeatureGrid;
