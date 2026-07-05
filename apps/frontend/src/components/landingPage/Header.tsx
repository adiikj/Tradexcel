"use client";
import React, { useState } from "react";
import Link from "next/link";
import logo from "../../assets/logo-icon-transparent.png";
import wordmark from "../../assets/tradexcel-wordmark-light.png";

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
            <img className="h-8 w-8 md:w-9 md:h-9" src={((logo)?.src || (logo)) as string} alt="" />
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
          className="text-gray-400 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={`w-6 h-6 transition-transform duration-300 ${isMenuOpen ? "rotate-45" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed top-0 right-0 w-full h-screen bg-white z-50 transition-transform duration-500 ease-in-out ${
          isMenuOpen ? "transform translate-x-0" : "transform translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="flex justify-end mr-16 p-4">
          <button onClick={toggleMenu} aria-label="Close navigation menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col items-center space-y-6 mt-8 text-gray-400">
          <li>
            <Link href="/about" onClick={closeMenu}>
              About Us
            </Link>
          </li>
          <li>
            <Link href="/why-us" onClick={closeMenu}>
              Why Us?
            </Link>
          </li>
          <li>
            <Link href="/blog" onClick={closeMenu}>
              Blog
            </Link>
          </li>
          <li>
            <Link href="/contactus" onClick={closeMenu}>
              Contact Us
            </Link>
          </li>
          <li className="my-2">
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-lg font-semibold text-sm text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200 active:scale-95"
              onClick={closeMenu}
            >
              Sign Up
            </Link>
          </li>
          <li className="my-2">
            <Link
              href="/signin"
              className="px-6 py-2.5 rounded-lg font-semibold text-sm text-white bg-btn-blue hover:bg-blue-600 transition-colors duration-200 active:scale-95"
              onClick={closeMenu}
            >
              Sign In
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default Header;
