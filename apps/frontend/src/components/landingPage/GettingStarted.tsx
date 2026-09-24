"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";

const STEP_MS = 4500;

const STEPS = [
  { title: "Sign up free", desc: "Create an account in under a minute. No payment details, ever.", path: "signup" },
  { title: "Get ₹1,00,000", desc: "Your wallet is funded with virtual cash the moment you join.", path: "wallet" },
  { title: "Place your first trade", desc: "Buy any of 250+ NSE stocks at the live market price.", path: "market" },
  { title: "Climb the ranks", desc: "Every week is a fresh season. Finish on top of the leaderboard.", path: "leaderboard" },
];

// Types text in character by character.
function Typed({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) return;
    const controls = animate(0, text.length, { duration: text.length * 0.06, delay, ease: "linear", onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [text, delay, reduced]);
  return <>{text.slice(0, n) || " "}</>;
}

function SignUpPreview() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="font-pop text-lg font-semibold">Create your account</p>
      {[
        ["Name", "Aditya Sharma", 0.1],
        ["Email", "aditya@example.com", 1],
      ].map(([label, value, delay]) => (
        <div key={label as string}>
          <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
          <div className="rounded-xl bg-grey px-4 py-3 text-sm">
            <Typed text={value as string} delay={delay as number} />
          </div>
        </div>
      ))}
      <motion.div
        className="rounded-xl bg-btn-blue py-3 text-center text-sm font-semibold text-white"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1, scale: [1, 0.97, 1] }}
        transition={{ delay: 2.4, duration: 0.4 }}
      >
        Create account
      </motion.div>
    </div>
  );
}

function WalletPreview() {
  const reduced = useReducedMotion();
  const [v, setV] = useState(reduced ? 100000 : 0);
  useEffect(() => {
    if (reduced) return;
    const c = animate(0, 100000, { duration: 1.8, delay: 0.3, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [reduced]);
  return (
    <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 text-white">
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Cash balance</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Virtual · INR</span>
      </div>
      <p className="mt-3 font-pop text-4xl font-semibold tabular-nums">₹{Math.round(v).toLocaleString("en-IN")}</p>
      <motion.p
        className="mt-4 inline-flex rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9 }}
      >
        Wallet funded
      </motion.p>
    </div>
  );
}

function TradePreview() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-pop text-lg font-semibold">RELIANCE</p>
            <p className="text-sm text-gray-500">Reliance Industries</p>
          </div>
          <span className="rounded-lg bg-green-600/10 px-2.5 py-1 text-xs font-bold text-green-700">BUY</span>
        </div>
        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity</span>
            <span className="font-semibold tabular-nums">
              <Typed text="5" delay={0.3} />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Market price</span>
            <span className="font-semibold tabular-nums">₹1,219.20</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold tabular-nums">₹6,096.00</span>
          </div>
        </div>
        <motion.div
          className="mt-5 rounded-xl bg-green-600 py-3 text-center text-sm font-semibold text-white"
          animate={{ scale: [1, 0.97, 1] }}
          transition={{ delay: 1.1, duration: 0.35 }}
        >
          Buy 5 shares
        </motion.div>
      </div>
      <motion.div
        className="absolute -bottom-4 -right-3 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-xl"
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.5, type: "spring", damping: 18 }}
      >
        <span className="font-semibold text-green-400">Order filled</span> · 5 × RELIANCE
      </motion.div>
    </div>
  );
}

function RankPreview() {
  const others = [
    { name: "Ananya I.", ret: "+6.12%" },
    { name: "Vikram R.", ret: "+4.87%" },
    { name: "Priya N.", ret: "+3.05%" },
    { name: "Rohan M.", ret: "+1.44%" },
  ];
  const [climbed, setClimbed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setClimbed(true), 900);
    return () => clearTimeout(t);
  }, []);
  // You start 5th and climb to 2nd.
  const rows = climbed ? [others[0], { name: "You", ret: "+5.40%" }, ...others.slice(1)] : [...others, { name: "You", ret: "+0.80%" }];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">This week</p>
      <ul>
        {rows.map((r, i) => (
          <motion.li
            layout
            key={r.name}
            transition={{ type: "spring", damping: 22, stiffness: 180 }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${r.name === "You" ? "bg-blue-50 font-semibold text-blue-700" : ""}`}
          >
            <span className="w-5 tabular-nums text-gray-400">{i + 1}</span>
            <span className="flex-1">{r.name}</span>
            <span className="tabular-nums text-green-700">▲ {r.ret}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const PREVIEWS = [SignUpPreview, WalletPreview, TradePreview, RankPreview];

// "Getting started": the four steps on one side, a live animated preview of
// the current step on the other. Advances on its own; hover pauses it, and
// each step can be picked directly.
function GettingStarted({ showHeading = true }: { showHeading?: boolean }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const Preview = PREVIEWS[active];

  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, paused, reduced]);

  return (
    <section className="bg-grey px-6 py-20 md:px-12 md:py-24" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {showHeading && (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="font-pop text-sm font-semibold uppercase tracking-widest text-blue-600">Getting started</p>
          <h2 className="mt-3 font-pop text-3xl font-semibold leading-tight md:text-4xl">From sign-up to your first trade in minutes</h2>
        </div>
      )}

      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white lg:grid-cols-[0.85fr_1.15fr]">
        {/* Steps: a vertical timeline; the active one opens up */}
        <ol className="p-6 md:p-10">
          {STEPS.map((s, i) => {
            const isActive = i === active;
            const done = i < active;
            const last = i === STEPS.length - 1;
            return (
              <li key={s.title} className="relative flex gap-4 pb-2">
                {/* Line down to the next step */}
                {!last && <span aria-hidden="true" className={`absolute left-[19px] top-11 h-[calc(100%-2.25rem)] w-0.5 ${done ? "bg-btn-blue" : "bg-gray-200"}`} />}
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? "step" : undefined}
                  className="group flex w-full items-start gap-4 rounded-2xl py-2 text-left"
                >
                  <span
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-pop text-sm font-semibold transition-colors duration-300 ${
                      isActive ? "bg-btn-blue text-white" : done ? "bg-blue-100 text-blue-700" : "bg-white text-gray-400 ring-1 ring-gray-200 group-hover:text-gray-700"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="min-w-0 flex-1 pt-2">
                    <span className={`block font-pop font-semibold transition-colors ${isActive ? "text-lg text-gray-900" : "text-gray-500 group-hover:text-gray-800"}`}>{s.title}</span>
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          className="block overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <span className="mt-1 block text-sm text-gray-600">{s.desc}</span>
                          <span className="mt-3 block h-1 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
                            {!reduced && !paused && (
                              <motion.span
                                key={active}
                                className="block h-full rounded-full bg-btn-blue"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                              />
                            )}
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
              </li>
            );
          })}
          <li className="mt-6 pl-14">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-btn-blue px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-600"
            >
              Create your free account
            </Link>
          </li>
        </ol>

        {/* Stage: the step playing inside a small app window */}
        <div className="relative flex min-h-[420px] items-center justify-center border-t border-gray-200 bg-grey bg-[radial-gradient(#d4d9de_1px,transparent_1px)] p-6 [background-size:18px_18px] md:p-10 lg:border-l lg:border-t-0">
          <span className="absolute left-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
            Step {active + 1} of {STEPS.length}
          </span>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
              </span>
              <span className="flex-1 truncate rounded-lg bg-grey px-3 py-1 text-center text-xs text-gray-500">tradexcel.app/{STEPS[active].path}</span>
            </div>
            <div className="flex min-h-[300px] items-center justify-center p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  className="flex w-full justify-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <Preview />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GettingStarted;
