"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../assets/logo-icon-transparent.png";
import wordmark from "../../assets/tradexcel-wordmark-light.png";
import { FiMenu, FiX, FiChevronRight } from "react-icons/fi";
import Image from "next/image";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/why-us", label: "Why us" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contactus", label: "Contact" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = () => setIsMenuOpen(false);

  return (
    // Sticky, so sign-up is always one click away while reading.
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/90 font-pop backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20 md:px-12">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 py-2" aria-label="Tradexcel home">
            <Image className="h-8 w-8" src={logo} alt="" priority />
            <Image className="hidden h-5 w-auto md:block" src={wordmark} alt="" priority />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex gap-1">
              {navLinks.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-grey text-gray-900" : "text-gray-600 hover:bg-grey hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/signin" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-xl bg-btn-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-600">
            Get started free
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="-mr-2 rounded-lg p-2 text-gray-600 lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
        >
          <FiMenu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-white transition-transform duration-300 ease-in-out lg:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-6">
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5" aria-label="Tradexcel home">
            <Image className="h-7 w-7" src={logo} alt="" />
            <Image className="h-4 w-auto" src={wordmark} alt="" />
          </Link>
          <button type="button" onClick={closeMenu} className="-mr-2 p-2 text-gray-500 hover:text-gray-800" aria-label="Close navigation menu">
            <FiX className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="flex flex-col divide-y divide-gray-100">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`flex items-center justify-between py-4 text-lg font-medium transition-colors ${pathname === item.href ? "text-blue-600" : "text-gray-800 hover:text-blue-600"}`}
                >
                  {item.label}
                  <FiChevronRight className="text-gray-300" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 px-6 pb-8 pt-4">
          <Link href="/signup" onClick={closeMenu} className="w-full rounded-xl bg-btn-blue px-6 py-3.5 text-center text-sm font-semibold text-white hover:bg-blue-600">
            Get started free
          </Link>
          <Link href="/signin" onClick={closeMenu} className="w-full rounded-xl border-2 border-gray-200 px-6 py-3.5 text-center text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
