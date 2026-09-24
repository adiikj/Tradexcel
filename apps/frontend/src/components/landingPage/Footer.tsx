import React from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/logo-icon-transparent.png";
import wordmark from "../../assets/tradexcel-wordmark-light.png";

// Only public pages: the in-app FAQ and Support need an account, so visitors
// get the landing page FAQ and the contact page instead.
const linkGroups = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Why Tradexcel", href: "/why-us" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contactus" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-grey font-pop text-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Tradexcel home">
              <Image className="h-8 w-8" src={logo} alt="" />
              <Image className="h-5 w-auto" src={wordmark} alt="" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Learn to trade the real NSE market with virtual money. Compete every week, climb the leaderboard, risk nothing.
            </p>
            <a href="mailto:contact@tradexcel.site" className="mt-4 inline-block text-sm font-medium text-gray-800 hover:text-blue-600">
              contact@tradexcel.site
            </a>
            <div className="mt-6">
              <Link href="/signup" className="inline-flex rounded-xl bg-btn-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600">
                Get started free
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 lg:contents">
            {linkGroups.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-900">{group.heading}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-gray-600 transition-colors hover:text-blue-600">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-12 max-w-4xl text-xs leading-relaxed text-gray-500">
          Tradexcel is an educational stock-market simulator. All trading uses virtual money and nothing on this site is investment, financial or trading
          advice. Market data comes from third-party sources and may be delayed or inaccurate. Past performance in the game says nothing about real-world
          results.
        </p>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-gray-500 sm:flex-row md:px-12">
          <span>© {new Date().getFullYear()} Tradexcel. Virtual trading only.</span>
          <span>
            Designed and developed by{" "}
            <a href="https://adiikj.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-700 transition-colors hover:text-blue-600">
              Aditya
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
