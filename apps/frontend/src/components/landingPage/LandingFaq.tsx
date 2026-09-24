"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { reveal, SectionHeading } from "./marketing";
import analyticsArt from "../../assets/banner2.png";

// Answers match the product (weeklyReset.ts, marketHours.ts) and the Privacy Policy.
const faqs = [
  { q: "Is Tradexcel really free?", a: "Yes. It's free to play, and no real money is involved at any point. There's nothing to deposit and no card to add." },
  { q: "Do I need to know how to trade?", a: "No. Tradexcel is built for beginners. Start with a single stock, see what happens, and learn as you go with nothing at stake." },
  { q: "Are the prices real?", a: "Yes. Trades use live NSE prices during market hours (Monday to Friday, 9:15 AM to 3:30 PM IST) and the last traded price when the market is closed." },
  { q: "What happens every Monday?", a: "At 5:30 AM IST your holdings are sold at market price, your result for the week is saved to your profile, and your cash resets to ₹1,00,000." },
  { q: "Can I compete with friends?", a: "Yes. Create a private league with your own stocks and schedule, then share the invite code. Everyone starts with the same cash." },
  { q: "What do you do with my data?", a: "We use it to run your account, the game and the leaderboards. We don't sell your personal data." },
];

function LandingFaq() {
  return (
    // scroll-mt clears the sticky header when arriving from the footer's FAQ link.
    <section id="faq" className="scroll-mt-24 bg-grey px-6 py-20 md:px-12 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_1.3fr]">
        <motion.div {...reveal()} className="lg:sticky lg:top-28">
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title="Questions, answered"
            subtitle={
              <>
                Something else on your mind?{" "}
                <Link href="/contactus" className="font-semibold text-blue-700 hover:underline">
                  Ask us
                </Link>
                .
              </>
            }
          />
          <Image src={analyticsArt} alt="" sizes="(min-width: 1024px) 40vw, 100vw" className="mt-8 hidden h-auto w-full max-w-md rounded-3xl lg:block" />
        </motion.div>

        <motion.div {...reveal(0.08)} className="divide-y divide-gray-200 overflow-hidden rounded-3xl bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-pop font-semibold text-gray-900 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-xl font-normal text-gray-400 transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 leading-relaxed text-gray-600">{f.a}</p>
            </details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default LandingFaq;
