"use client";
import React from "react";
import { motion } from "framer-motion";

export interface LegalSection {
  heading: string;
  body: string[];
}

interface LegalPageProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <>
      {/* Hero */}
      <section className="bg-grey w-full px-6 md:px-16 lg:px-24 pt-16 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="font-pop font-semibold text-4xl md:text-5xl">{title}</h1>
          <p className="text-gray-500 text-sm mt-4">Last updated: {updated}</p>
        </motion.div>
      </section>

      {/* Body */}
      <section className="bg-white w-full px-6 md:px-16 lg:px-24 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-600 leading-relaxed">{intro}</p>
          <div className="mt-10 space-y-10">
            {sections.map((s, i) => (
              <motion.div
                key={s.heading}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl md:text-2xl font-semibold font-pop">
                  {i + 1}. {s.heading}
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} className="text-gray-600 leading-relaxed mt-3">
                    {p}
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default LegalPage;
