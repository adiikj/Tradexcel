import React from 'react';
import Link from 'next/link';
import logo from '../../assets/logo-icon-transparent.png';
import wordmark from '../../assets/tradexcel-wordmark-light.png';

const linkGroups = [
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Why Us?', href: '/why-us' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contactus' },
    ],
  },
  {
    heading: 'Product',
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Support', href: '/support' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-grey text-black font-pop border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-14 md:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-10">
          {/* Brand */}
          <div className="col-span-2 lg:pr-8">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <img className="w-9 h-9" src={((logo)?.src || (logo)) as string} alt="" />
              <img className="h-7 w-auto" src={((wordmark)?.src || (wordmark)) as string} alt="Tradexcel" />
            </Link>
            <p className="text-gray-600 mt-4 max-w-xs text-sm leading-relaxed">
              A virtual stock trading game for managing portfolios and competing in
              real time, with real prices and zero real-money risk.
            </p>
          </div>

          {linkGroups.map((group) => (
            <div key={group.heading}>
              <h6 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
                {group.heading}
              </h6>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h6 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
              Contact
            </h6>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>New Delhi, India</li>
              <li>
                <a
                  href="mailto:contact@tradexcel.site"
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  contact@tradexcel.site
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Tradexcel. All rights reserved.</span>
          <span>Virtual trading only. No real money, ever.</span>
        </div>
      </div>
    </footer>
  );
}
