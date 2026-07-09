"use client";
import React, { useState } from "react";
import Link from "next/link";
import logo from "../../assets/logo-icon-transparent.png";
import wordmark from "../../assets/tradexcel-wordmark-light.png";
import { FiMenu, FiX, FiChevronRight } from "react-icons/fi";

const navLinks = [
  { href: "/about", label: "About Us" },
  { href: "/why-us", label: "Why Us?" },
  { href: "/blog", label: "Blog" },
  { href: "/contactus", label: "Contact Us" },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<any>(false);

  // Toggle menu for mobile view
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <section className="flex items-center justify-between w-full h-16 md:h-20 py-2 px-8 md:p-6 md:px-16 font-pop">
      {/* Left Section: Logo and Navigation Links */}
      <div className="flex items-center gap-12">
        <Link href="/">
          <div className="flex flex-row items-center gap-2.5 py-2">
            <img className="h-8 w-8 md:w-8 md:h-8" src={((logo)?.src || (logo)) as string} alt="" />
            <img className="hidden md:block h-5 w-auto" src={((wordmark)?.src || (wordmark)) as string} alt="Tradexcel" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex gap-8 text-gray-400">
          <li>
            <Link href="/about">About Us</Link>
          </li>
          <li>
            <Link href="/why-us">Why Us?</Link>
          </li>
          <li>
            <Link href="/blog">Blog</Link>
          </li>
          <li>
            <Link href="/contactus">Contact Us</Link>
          </li>
        </ul>
      </div>

      {/* Right Section: Sign Up and Sign In Buttons */}
      <div className="hidden lg:flex gap-3 items-center">
        <Link
          href="/signup"
          className="px-8 py-2.5 rounded-lg font-medium text-sm text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200"
        >
          Sign Up
        </Link>

        <Link
          href="/signin"
          className="px-8 py-2.5 rounded-lg font-medium text-sm text-white bg-btn-blue hover:bg-blue-600 transition-colors duration-200"
        >
          Sign In
        </Link>
      </div>

      {/* Mobile Hamburger Icon */}
      <div className="lg:hidden flex items-center">
        <button
          onClick={toggleMenu}
          className="text-gray-500 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <FiMenu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 w-full h-[100dvh] bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top bar: logo + close, matches header height */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 shrink-0">
          <Link href="/" onClick={closeMenu} className="flex items-center gap-2.5">
            <img className="h-7 w-7" src={((logo)?.src || (logo)) as string} alt="" />
            <img className="h-4 w-auto" src={((wordmark)?.src || (wordmark)) as string} alt="Tradexcel" />
          </Link>
          <button
            onClick={toggleMenu}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="Close navigation menu"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="flex flex-col divide-y divide-gray-100">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center justify-between py-4 text-lg font-medium font-pop text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  {item.label}
                  <FiChevronRight className="text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA buttons pinned to the bottom */}
        <div className="px-6 pt-4 pb-8 border-t border-gray-100 flex flex-col gap-3 shrink-0">
          <Link
            href="/signup"
            className="w-full text-center px-6 py-3.5 rounded-xl font-semibold text-sm text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200 active:scale-95"
            onClick={closeMenu}
          >
            Sign Up
          </Link>
          <Link
            href="/signin"
            className="w-full text-center px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-btn-blue hover:bg-blue-600 transition-colors duration-200 active:scale-95"
            onClick={closeMenu}
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Header;
