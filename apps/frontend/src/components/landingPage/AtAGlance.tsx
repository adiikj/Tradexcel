"use client";
import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import LiveTicker, { useTickerQuotes } from "./LiveTicker";

// Counts from 0 to `to` once the element scrolls into view.
function CountUp({ to, prefix = "", format = (n: number) => Math.round(n).toLocaleString("en-IN") }: { to: number; prefix?: string; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: setValue });
    return () => controls.stop();
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {format(reduced ? to : value)}
    </span>
  );
}

// A real 30-day close series, drawn in as it comes into view.
function DrawnSparkline({ values, up }: { values: number[]; up: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const W = 280;
  const H = 90;
  if (values.length < 2) return <div className="h-[90px]" />;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 6 - ((v - min) / span) * (H - 12)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const stroke = up ? "#16a34a" : "#dc2626";
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-[90px] w-full" aria-hidden="true" preserveAspectRatio="none">
      <motion.path d={`${d} L${W},${H} L0,${H} Z`} fill={stroke} initial={{ opacity: 0 }} animate={inView ? { opacity: 0.08 } : {}} transition={{ duration: 0.6, delay: 1 }} />
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
    </svg>
  );
}

const tile = "overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 md:p-7";

// The "at a glance" bento: the four promises of the product, each with
// something moving and real (live quotes, a real chart) instead of plain text.
function AtAGlance() {
  const quotes = useTickerQuotes();
  // Feature the stock with the strongest real 30-day trend we have data for.
  const trend = (c: number[]) => c[c.length - 1] / c[0] - 1;
  const featured = [...quotes].filter((q) => q.closes.length > 1).sort((a, b) => trend(b.closes) - trend(a.closes))[0];

  return (
    <section className="bg-white px-6 py-16 md:px-12 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-4">
        {/* Virtual cash */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 md:col-span-2 md:row-span-2 md:p-9"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Every week</p>
          <p className="mt-3 font-pop text-5xl font-semibold text-gray-900 md:text-6xl">
            <CountUp to={100000} prefix="₹" />
          </p>
          <p className="mt-3 max-w-sm text-lg text-gray-600">in virtual cash to invest. It resets every Monday, so every week is a fresh shot at the top.</p>
          {/* A tiny wallet card that floats gently */}
          <motion.div
            className="mt-8 w-full max-w-xs rounded-2xl bg-gray-900 p-5 text-white shadow-xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Cash balance</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Virtual · INR</span>
            </div>
            <p className="mt-2 font-pop text-2xl font-semibold">₹1,00,000.00</p>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-3 text-xs text-gray-400">
              <span>Season resets</span>
              <span className="font-semibold text-white">Monday</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stocks + live tape */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className={`${tile} flex flex-col justify-between md:col-span-2`}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-pop text-4xl font-semibold">
                <CountUp to={250} />+
              </p>
              <p className="mt-1 text-gray-600">NSE stocks to trade, from blue chips to mid caps</p>
            </div>
          </div>
          <div className="-mx-6 mt-6 border-y border-gray-100 bg-grey/60 py-3 md:-mx-7">
            <LiveTicker quotes={quotes} />
          </div>
        </motion.div>

        {/* Live prices */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className={tile}
        >
          <div className="flex items-center justify-between">
            <p className="font-pop text-xl font-semibold">Live prices</p>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live
            </span>
          </div>
          {featured ? (
            <>
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{featured.name}</span> · 30 days
              </p>
              <div className="mt-2">
                <DrawnSparkline values={featured.closes} up={(featured.closes.at(-1) ?? 0) >= featured.closes[0]} />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-600">Every trade fills at the real NSE price.</p>
          )}
        </motion.div>

        {/* Zero risk */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-gray-900 p-6 text-white md:p-7"
        >
          <p className="font-pop text-5xl font-semibold">₹0</p>
          <div>
            <p className="font-pop text-xl font-semibold">Real-money risk</p>
            <p className="mt-1 text-sm text-gray-300">No deposits, no card, no catch.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default AtAGlance;
