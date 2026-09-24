"use client";
import React from "react";
import { PageHero } from "../landingPage/marketing";

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

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Terms and Privacy: the shared page header, then the text with an
// "On this page" list that stays in view on wide screens.
function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <>
      <PageHero eyebrow={`Last updated ${updated}`} title={title} />

      <section className="bg-white px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[14rem_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">On this page</p>
              <ol className="mt-4 space-y-2 text-sm">
                {sections.map((s, i) => (
                  <li key={s.heading}>
                    <a href={`#${slug(s.heading)}`} className="text-gray-600 hover:text-blue-600">
                      {i + 1}. {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="max-w-3xl">
            <p className="text-lg leading-relaxed text-gray-700">{intro}</p>
            <div className="mt-12 space-y-12">
              {sections.map((s, i) => (
                <div key={s.heading} id={slug(s.heading)} className="scroll-mt-28">
                  <h2 className="font-pop text-xl font-semibold md:text-2xl">
                    <span className="mr-2 text-gray-400">{i + 1}.</span>
                    {s.heading}
                  </h2>
                  {s.body.map((p, j) => (
                    <p key={j} className="mt-3 leading-relaxed text-gray-600">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LegalPage;
