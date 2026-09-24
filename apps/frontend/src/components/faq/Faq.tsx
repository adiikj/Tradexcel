"use client";
import React, { useId, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PiCaretDown, PiChatCircleText, PiMagnifyingGlass } from "react-icons/pi";
import Header from "../dashboard/Header";
import Vheader from "../dashboard/Vheader";
import { formatInr } from "../../utils/format";
import { STARTING_BALANCE } from "../../utils/season";

type FaqEntry = { question: string; answer: string };
type Topic = { title: string; faqs: FaqEntry[] };

const START = formatInr(STARTING_BALANCE);

const TOPICS: Topic[] = [
  {
    title: "Getting started",
    faqs: [
      {
        question: "What is Tradexcel?",
        answer:
          "Tradexcel is a stock-trading game. You trade real NSE stocks at real market prices, but with virtual money, so you can learn and practise without risking anything.",
      },
      { question: "Is Tradexcel free?", answer: "Yes. Tradexcel is completely free, and no real money is ever involved." },
      {
        question: "How much money do I start with?",
        answer: `Every player gets ${START} in virtual cash at the start of each weekly season. Your Wallet page shows how much is left and when the next reset happens.`,
      },
    ],
  },
  {
    title: "Trading",
    faqs: [
      {
        question: "Which stocks can I trade?",
        answer: "Any stock listed on the Market page. Search by name or symbol, open its chart, and buy or sell from there.",
      },
      {
        question: "When do prices update?",
        answer:
          "Prices follow NSE trading hours: Monday to Friday, 9:15 AM to 3:30 PM IST. When the market is closed you'll see prices from the last trading day, and a banner tells you when it opens next.",
      },
      {
        question: "Can I get notified when a stock hits a price?",
        answer: "Yes. Set a target price on the Alerts page, and you'll get a notification when the stock reaches it.",
      },
    ],
  },
  {
    title: "Seasons & leaderboard",
    faqs: [
      {
        question: "What happens every Monday?",
        answer: `Seasons run for one week. At Monday 00:00 UTC (5:30 AM IST), your net worth for the week is recorded, your holdings are sold at market price, and your wallet resets to ${START} for the new season.`,
      },
      {
        question: "How is the leaderboard ranked?",
        answer: "By net worth: your cash plus the current market value of everything you hold. The more you grow your starting cash, the higher you rank.",
      },
      {
        question: "What are achievements?",
        answer: "Badges you earn for milestones, like your first trade, holding five or more stocks at once, or logging in several days in a row. They show on your public profile.",
      },
    ],
  },
  {
    title: "Contests",
    faqs: [
      {
        question: "How do contests work?",
        answer:
          "Contests are separate competitions with a fixed start and end time and their own starting cash, so they don't touch your weekly wallet. Players are ranked by net worth when the contest ends.",
      },
      {
        question: "Why do some contests use old prices?",
        answer: "Some contests replay real past trading days, so everyone trades the same historical market at the same pace.",
      },
    ],
  },
  {
    title: "Profile & friends",
    faqs: [
      {
        question: "Can other players see my profile?",
        answer: "Yes. Your public profile shows your name, net worth, rank and achievements. You can share its link with anyone.",
      },
      {
        question: "What is the Activity page?",
        answer: "It shows the trades and contest results of the players you follow. Follow someone from their profile or from the leaderboard.",
      },
    ],
  },
];

function FaqItem({ faq, open, onToggle }: { faq: FaqEntry; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-gray-800/60 md:px-5 md:text-[15px]"
        >
          {faq.question}
          <PiCaretDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:px-5">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Faq() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const topics = TOPICS.map((topic) => ({
    ...topic,
    faqs: topic.faqs.filter((f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
  })).filter((topic) => topic.faqs.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 font-pop text-gray-900 transition-colors duration-300 dark:bg-gray-800 dark:text-white">
      <Header />
      <div className="flex">
        <Vheader />
        <main className="mb-20 min-w-0 flex-1 md:mb-0 px-5 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Frequently asked questions</h1>
              <div className="mt-1 h-0.5 w-24 rounded-full bg-blue-600 dark:bg-blue-400 animate-line" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">How Tradexcel works, from your first trade to weekly resets.</p>
            </div>

            <label className="relative block">
              <span className="sr-only">Search questions</span>
              <PiMagnifyingGlass aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions"
                className="w-full rounded-xl bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800"
              />
            </label>

            {topics.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No questions match &ldquo;{query.trim()}&rdquo;. Try another word, or ask us below.
              </p>
            ) : (
              topics.map((topic) => (
                <section key={topic.title} aria-label={topic.title}>
                  <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {topic.title}
                  </h2>
                  <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:divide-gray-800 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                    {topic.faqs.map((faq) => (
                      <FaqItem
                        key={faq.question}
                        faq={faq}
                        open={openQuestion === faq.question}
                        onToggle={() => setOpenQuestion((prev) => (prev === faq.question ? null : faq.question))}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}

            <div className="flex flex-col items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800 sm:flex-row sm:items-center">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <PiChatCircleText aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-medium">Still stuck?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send us a message and we&apos;ll get back to you.</p>
              </div>
              <Link href="/support" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Contact support
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Faq;
