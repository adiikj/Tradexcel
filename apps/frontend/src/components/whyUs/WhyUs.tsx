"use client";
import React from "react";
import { motion } from "framer-motion";
import FeatureGrid from "../landingPage/FeatureGrid";
import FinalCta from "../landingPage/FinalCta";
import { PageHero, SectionHeading, reveal } from "../landingPage/marketing";

const compareRows = [
  { label: "Real money at risk", tradexcel: false, real: true, paper: false, downside: true },
  { label: "Live market prices", tradexcel: true, real: true, paper: false },
  { label: "Portfolio analytics", tradexcel: true, real: true, paper: false },
  { label: "Leaderboards and contests", tradexcel: true, real: false, paper: false },
  { label: "Weekly fresh start", tradexcel: true, real: false, paper: false },
  { label: "Free to use", tradexcel: true, real: false, paper: true },
  { label: "Beginner friendly", tradexcel: true, real: false, paper: true },
];

// The glyph says yes or no; the colour says whether that's good for you
// (for a downside like "real money at risk", no is the win).
function Mark({ yes, downside = false }: { yes: boolean; downside?: boolean }) {
  const good = downside ? !yes : yes;
  return (
    <span className={good ? "font-semibold text-green-600" : yes ? "font-semibold text-red-500" : "text-gray-300"}>
      <span aria-hidden="true">{yes ? "✓" : "✕"}</span>
      <span className="sr-only">{yes ? "Yes" : "No"}</span>
    </span>
  );
}

function WhyUs() {
  return (
    <>
      <PageHero
        eyebrow="Why Tradexcel"
        title={
          <>
            The smartest way to <span className="text-blue-500">practise the market</span>
          </>
        }
        subtitle="All the realism of live trading, none of the risk. Here's what makes Tradexcel different from a real brokerage account or a spreadsheet."
      />

      <section className="bg-white px-6 pb-20 pt-4 md:px-12 md:pb-24">
        <FeatureGrid />
      </section>

      {/* Comparison */}
      <section className="bg-grey px-6 py-20 md:px-12 md:py-24">
        <motion.div {...reveal()}>
          <SectionHeading eyebrow="Compared" title="How Tradexcel stacks up" subtitle="Real market conditions like a brokerage app, the safety of paper trading, and competition neither of them has." />
        </motion.div>
        <motion.div {...reveal(0.1)} className="mx-auto mt-12 max-w-4xl overflow-x-auto rounded-3xl bg-white">
          <table className="w-full min-w-[34rem] text-left">
            <thead>
              <tr className="text-sm">
                <th scope="col" className="px-6 py-5 font-medium text-gray-500">
                  Feature
                </th>
                <th scope="col" className="bg-blue-50 px-6 py-5 text-center font-pop font-semibold text-blue-700">
                  Tradexcel
                </th>
                <th scope="col" className="px-6 py-5 text-center font-medium text-gray-700">
                  Real-money app
                </th>
                <th scope="col" className="px-6 py-5 text-center font-medium text-gray-700">
                  Pen and paper
                </th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row.label} className="border-t border-gray-100">
                  <th scope="row" className="px-6 py-4 text-sm font-medium text-gray-800">
                    {row.label}
                  </th>
                  <td className="bg-blue-50 px-6 py-4 text-center text-lg">
                    <Mark yes={row.tradexcel} downside={row.downside} />
                  </td>
                  <td className="px-6 py-4 text-center text-lg">
                    <Mark yes={row.real} downside={row.downside} />
                  </td>
                  <td className="px-6 py-4 text-center text-lg">
                    <Mark yes={row.paper} downside={row.downside} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>

      <FinalCta />
    </>
  );
}

export default WhyUs;
