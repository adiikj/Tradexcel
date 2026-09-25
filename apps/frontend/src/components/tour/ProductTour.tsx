"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { OPEN_TEX_EVENT } from "../chat/texEvents";

// A guided walkthrough of the dashboard for new players. Each step spotlights
// an element marked with `data-tour="<target>"` and explains it in a sentence.
// Steps whose element isn't on screen (e.g. the desktop sidebar on a phone)
// try their fallback target, else are skipped.

type Step = { target?: string; fallback?: string; title: string; body: string };

const STEPS: Step[] = [
  {
    title: "Welcome to Tradexcel",
    body: "You trade real NSE stocks at live prices with ₹1,00,000 of virtual money. Here's a one-minute look around.",
  },
  { target: "networth", title: "Your net worth", body: "Cash plus the current value of your stocks. It updates live while the market is open." },
  {
    target: "season",
    title: "Weekly seasons",
    body: "Every Monday at 5:30 AM IST your holdings are sold and your cash resets to ₹1,00,000. Each week's result is saved to your profile.",
  },
  { target: "quick-trade", title: "Trade from anywhere", body: "Search any stock and buy or sell it right here, without leaving the page." },
  { target: "holdings", title: "Your holdings", body: "What you own, how each position is doing, and how your money is split between stocks and cash." },
  { target: "movers", title: "Today's market", body: "The day's biggest gainers and losers. Open one to see its chart." },
  { target: "search", title: "Search", body: "Find any stock or player by name." },
  { target: "nav-market", title: "Market", body: "Browse every stock, study its chart and add it to your watchlist." },
  { target: "nav-portfolio", title: "Portfolio", body: "Your full holdings, returns and past weekly results." },
  { target: "nav-contest", fallback: "nav-more", title: "Contests", body: "Timed competitions with their own starting cash. Join a public one or create a private league for friends." },
  { target: "nav-leaderboard", fallback: "nav-more", title: "Leaderboard", body: "See how your net worth ranks against every player this season." },
  { target: "alerts", title: "Alerts and notifications", body: "Get notified when a stock hits your target price, and when you unlock achievements." },
  { target: "account", title: "Your account", body: "Edit your profile, set a password or PIN, and sign out." },
  { target: "tour-button", title: "Need a refresher?", body: "Press this button anytime to take this tour again." },
];

const DONE_KEY = "tradexcel:tourDone";
const REQUEST_KEY = "tradexcel:tourRequested";
const PAD = 8; // px of breathing room around the spotlight
const GAP = 12; // px between spotlight and card
const CARD_W = 320;

// Ask the dashboard to show the tour (the "Take the tour" button in the header).
const START_EVENT = "tradexcel:start-tour";

export function requestTour() {
  try {
    sessionStorage.setItem(REQUEST_KEY, "1");
  } catch {}
  window.dispatchEvent(new Event(START_EVENT));
}

function visibleTarget(name?: string): HTMLElement | null {
  if (!name) return null;
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return all.find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  }) ?? null;
}

function resolve(step: Step) {
  return visibleTarget(step.target) ?? visibleTarget(step.fallback);
}

// Resolves once the page has finished loading: no loading placeholders left
// and the tour targets have stopped moving for two checks in a row. Gives up
// after `maxWait` so a slow network can't hold the tour back forever.
function whenPageSettled(maxWait = 8000): { promise: Promise<void>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  const started = Date.now();
  let lastLayout = "";
  let stableChecks = 0;
  const promise = new Promise<void>((resolveReady) => {
    const check = () => {
      if (cancelled) return;
      // Loading placeholders are bars and boxes; tiny pulsing dots are "live" indicators.
      const loading = Array.from(document.querySelectorAll<HTMLElement>("main .animate-pulse")).some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 12 && r.height > 12;
      });
      const layout = Array.from(document.querySelectorAll<HTMLElement>("[data-tour]"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)},${Math.round(r.height)}`;
        })
        .join("|");
      stableChecks = !loading && layout === lastLayout ? stableChecks + 1 : 0;
      lastLayout = layout;
      if (stableChecks >= 2 || Date.now() - started > maxWait) resolveReady();
      else timer = setTimeout(check, 150);
    };
    check();
  });
  return {
    promise,
    cancel: () => {
      cancelled = true;
      clearTimeout(timer);
    },
  };
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ProductTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [cardSize, setCardSize] = useState({ w: CARD_W, h: 180 });
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Steps that can be shown on this screen (targetless steps always can).
  const [steps, setSteps] = useState<Step[]>(STEPS);

  // Start on the first visit, or when asked from the header button (on this
  // page via the event, or after navigating here via sessionStorage).
  useEffect(() => {
    let pending: ReturnType<typeof whenPageSettled> | null = null;
    const start = () => {
      try {
        sessionStorage.removeItem(REQUEST_KEY);
      } catch {}
      pending?.cancel();
      // Wait for the dashboard's data to arrive, so cards don't move under the spotlight.
      pending = whenPageSettled();
      pending.promise.then(() => {
        setSteps(STEPS.filter((s) => !s.target || resolve(s)));
        setIndex(0);
        setOpen(true);
      });
    };

    let requested = false;
    let done = false;
    try {
      requested = sessionStorage.getItem(REQUEST_KEY) === "1";
      done = localStorage.getItem(DONE_KEY) === "1";
    } catch {}
    if (requested || !done) start();

    window.addEventListener(START_EVENT, start);
    return () => {
      pending?.cancel();
      window.removeEventListener(START_EVENT, start);
    };
  }, []);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) return;
    const el = resolve(step);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Bring the step's element into view, then track it on scroll/resize.
  useEffect(() => {
    if (!open || !step) return;
    const el = resolve(step);
    if (el) {
      const r = el.getBoundingClientRect();
      const offscreen = r.top < 72 || r.bottom > window.innerHeight - 16;
      if (offscreen) el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
    let frame = requestAnimationFrame(measure);
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);
    // Late content (live prices, a list growing) can still shift the layout.
    const observer = new ResizeObserver(onChange);
    observer.observe(document.body);
    if (el) observer.observe(el);
    // Smooth scrolling settles after a moment.
    const settle = setTimeout(measure, 450);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
      observer.disconnect();
    };
  }, [open, step, measure]);

  useLayoutEffect(() => {
    if (!open || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setCardSize((prev) => (prev.w === r.width && prev.h === r.height ? prev : { w: r.width, h: r.height }));
  }, [open, index, rect]);

  useEffect(() => {
    if (open) nextRef.current?.focus({ preventScroll: true });
  }, [open, index]);

  const finish = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {}
  }, []);

  // Opening Tex means the user has something to ask; the tour's overlay
  // would sit on top of the chat and swallow its clicks, so step aside.
  useEffect(() => {
    if (!open) return;
    window.addEventListener(OPEN_TEX_EVENT, finish);
    return () => window.removeEventListener(OPEN_TEX_EVENT, finish);
  }, [open, finish]);

  const next = useCallback(() => (index >= steps.length - 1 ? finish() : setIndex((i) => i + 1)), [index, steps.length, finish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, next, back, finish]);

  if (!open || !step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(CARD_W, vw - 32);

  // Card position: beside the spotlight where there's room, else centered.
  let cardStyle: React.CSSProperties = { width: w, left: (vw - w) / 2, top: (vh - cardSize.h) / 2 };
  if (rect) {
    const spot = { top: rect.top - PAD, left: rect.left - PAD, right: rect.right + PAD, bottom: rect.bottom + PAD };
    const clampX = (x: number) => Math.max(16, Math.min(x, vw - w - 16));
    const clampY = (y: number) => Math.max(16, Math.min(y, vh - cardSize.h - 16));
    if (spot.right + GAP + w <= vw - 16 && rect.width < vw / 3) {
      cardStyle = { width: w, left: spot.right + GAP, top: clampY(rect.top + rect.height / 2 - cardSize.h / 2) };
    } else if (spot.bottom + GAP + cardSize.h <= vh - 16) {
      cardStyle = { width: w, left: clampX(rect.left + rect.width / 2 - w / 2), top: spot.bottom + GAP };
    } else if (spot.top - GAP - cardSize.h >= 16) {
      cardStyle = { width: w, left: clampX(rect.left + rect.width / 2 - w / 2), top: spot.top - GAP - cardSize.h };
    } else {
      cardStyle = { width: w, left: clampX(rect.left + rect.width / 2 - w / 2), top: vh - cardSize.h - 16 };
    }
  }

  const animate = prefersReducedMotion() ? "" : "transition-all duration-300 ease-out";

  return (
    <div className="fixed inset-0 z-[60] font-pop">
      {/* Dimmed page with a cut-out around the current element. Clicks on the page are blocked while touring. */}
      {rect ? (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed rounded-2xl ring-2 ring-white/90 ${animate}`}
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(17, 24, 39, 0.6)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-gray-900/60" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={`fixed rounded-2xl bg-white p-5 text-gray-900 shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-700 ${animate}`}
        style={cardStyle}
      >
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {index + 1} of {steps.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-base font-semibold">
          {step.title}
        </h2>
        <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {step.body}
        </p>

        {/* Progress */}
        <div aria-hidden="true" className="mt-4 flex gap-1">
          {steps.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= index ? "bg-blue-600 dark:bg-blue-400" : "bg-gray-200 dark:bg-gray-700"}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={finish} className="mr-auto text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            {index === steps.length - 1 ? "Close" : "Skip tour"}
          </button>
          {index > 0 && (
            <button
              type="button"
              onClick={back}
              className="rounded-xl px-3.5 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 dark:ring-gray-700 dark:hover:bg-gray-800"
            >
              Back
            </button>
          )}
          <button ref={nextRef} type="button" onClick={next} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {index === 0 ? "Show me around" : index === steps.length - 1 ? "Start trading" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductTour;
