import React from 'react';
import logo from '../../assets/logo-icon-transparent.png';
import wordmark from '../../assets/tradexcel-wordmark-light.png';

export default function App({ bgColor = 'bg-white' }) {
  return (
    <footer className={`${bgColor} text-center text-black font-pop`}>
      <div className="py-10 text-center md:text-left flex flex-col md:flex-row justify-between px-6 md:px-20">
        {/* Logo and Description */}
        <div className="mb-8 md:mb-0 pr-12">
          <div className="flex flex-row items-center gap-2.5 py-2">
            <img className="w-9 h-9 md:w-10 md:h-10" src={((logo)?.src || (logo)) as string} alt="" />
            <img className="h-7 md:h-8 w-auto" src={((wordmark)?.src || (wordmark)) as string} alt="Tradexcel" />
          </div>
          <p className="text-gray-600 w-64 pt-4 mx-auto md:mx-0 text-center md:text-left">
            A virtual stock trading game for managing portfolios and competing in real-time.
          </p>
        </div>

        {/* Footer Links Sections */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl mx-auto">
          {/* Companies */}
          <div>
            <h6 className="mb-4 font-semibold text-center md:text-left">Companies</h6>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/about">About Us</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/blog">Blog</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/contactus">Contact</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/how-it-works">Help</a>
            </p>
          </div>

          {/* Resources */}
          <div>
            <h6 className="mb-4 font-semibold text-center md:text-left">Resources</h6>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/about">About Us</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/blog">Blog</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/contactus">Contact</a>
            </p>
            <p>
              <a className="text-sm md:text-base text-gray-600" href="/how-it-works">Help</a>
            </p>
          </div>

          {/* Help */}
          <div>
            <h6 className="mb-4 font-semibold text-center md:text-left">Help</h6>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/how-it-works">Rules</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/terms">Our Terms</a>
            </p>
            <p className="mb-4">
              <a className="text-sm md:text-base text-gray-600" href="/privacy">Privacy & Policy</a>
            </p>
          </div>

          {/* Contact */}
          <div>
            <h6 className="mb-4 font-semibold text-center md:text-left">Contact Us</h6>
            <p className="text-sm md:text-base mb-4 text-gray-600">New Delhi, India</p>
            <p className="text-sm md:text-base mb-4 text-gray-600">contact@tradexcel.app</p>
            <p className="text-sm md:text-base mb-4 text-gray-600">+91 9876 543 210</p>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="bg-white w-full h-16 font-pop pt-6 text-sm font-light text-gray-900">
        <span>© {new Date().getFullYear()} Tradexcel. All Rights Reserved.</span>
      </div>
    </footer>
  );
}
