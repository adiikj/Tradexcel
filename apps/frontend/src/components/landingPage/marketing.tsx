"use client";
import React from "react";
import { motion, type MotionProps } from "framer-motion";

// Shared building blocks for the public marketing pages, so every page uses
// the same headings, spacing and entrance animation as the landing page.

// Every section fades up once as it enters the viewport and then stays put
// (without `once`, content re-hid whenever it scrolled out of view).
export const reveal = (delay = 0): MotionProps => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, delay },
});

export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow: string; title: React.ReactNode; subtitle?: React.ReactNode; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="font-pop text-sm font-semibold uppercase tracking-widest text-blue-600">{eyebrow}</p>
      <h2 className="mt-3 font-pop text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-gray-600">{subtitle}</p>}
    </div>
  );
}

// Top of every marketing page: eyebrow, one strong headline, a line of
// context, and optional actions or visuals underneath.
export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="bg-grey px-6 pb-16 pt-14 md:px-12 md:pb-20 md:pt-20">
      <motion.div className="mx-auto max-w-3xl text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="inline-flex rounded-full bg-white px-3 py-1.5 font-pop text-sm font-medium text-gray-700 ring-1 ring-gray-200">{eyebrow}</p>
        <h1 className="mt-6 font-pop text-4xl font-semibold !leading-[1.15] text-balance md:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">{subtitle}</p>}
      </motion.div>
      {children && <div className="mx-auto mt-10 max-w-6xl">{children}</div>}
    </section>
  );
}
