"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { reveal, SectionHeading } from "./marketing";
import learnerArt from "../../assets/card1.png";
import studentArt from "../../assets/person.png";
import builderArt from "../../assets/card3.png";

const audiences = [
  {
    art: learnerArt,
    title: "First-time investors",
    desc: "Learn how the market really behaves before you put your savings anywhere near it.",
  },
  {
    art: studentArt,
    title: "Students",
    desc: "Turn what you read about markets into practice, with real prices and zero cost.",
  },
  {
    art: builderArt,
    title: "Anyone testing a strategy",
    desc: "Try an idea for a week, see the result, and start fresh on Monday with a new one.",
  },
];

// Who Tradexcel is for, each with one of the illustrations.
function WhoItsFor() {
  return (
    <section className="bg-white px-6 py-20 md:px-12 md:py-24">
      <motion.div {...reveal()}>
        <SectionHeading eyebrow="Who it's for" title="Built for anyone curious about the market" />
      </motion.div>
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
        {audiences.map((a, i) => (
          <motion.div key={a.title} {...reveal(i * 0.08)} className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
            <div className="bg-[#eef1f8]">
              <Image src={a.art} alt="" sizes="(min-width: 768px) 33vw, 100vw" className="block h-auto w-full" />
            </div>
            <div className="p-6">
              <h3 className="font-pop text-xl font-semibold">{a.title}</h3>
              <p className="mt-2 text-gray-600">{a.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default WhoItsFor;
