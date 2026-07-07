"use client";
import React, { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import home from "../../assets/home.png";
import leaderboard from "../../assets/leaderboard.png";
import market from "../../assets/market.png";
import portfolio from "../../assets/portfolio.png";
import contest from "../../assets/contest.png";
import faq from "../../assets/faq.png";
import wallet from "../../assets/wallet.png";
import home_w from "../../assets/home-w.png";
import leaderboard_w from "../../assets/leaderboard-w.png";
import market_w from "../../assets/market-w.png";
import portfolio_w from "../../assets/portfolio-w.png";
import contest_w from "../../assets/contest-w.png";
import faq_w from "../../assets/faq-w.png";
import wallet_w from "../../assets/wallet-w.png";

// No dedicated PNG assets for Activity/News yet; rendered inline via currentColor instead.
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const NewsIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 4h13a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" />
    <path d="M4 4v13a3 3 0 0 0 3 3" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);

const SupportIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
  </svg>
);

const MoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

// Shared icon renderer for every nav surface (mobile bar, "More" sheet, desktop sidebar).
function ItemIcon({ item, darkMode, isActive, className }: any) {
  if (item.svgIcon) {
    const Icon = item.svgIcon;
    return <Icon className={className} />;
  }
  const src = (darkMode ? item.activeIcon : isActive ? item.activeIcon : item.icon)?.src
    ?? (darkMode ? item.activeIcon : isActive ? item.activeIcon : item.icon);
  return <img src={src as string} alt={item.name} className={className} />;
}

// Only the highest-frequency actions get a permanent slot on the mobile bar; the rest live behind "More".
const PRIMARY_MOBILE_NAMES = ["Home", "Portfolio", "Wallet", "Market"];

function Vheader({ darkMode, ...props }: any) {
  const [menuOpen, setMenuOpen] = useState<any>(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = usePathname(); // Hook to get the current location

  const menuItems = [
    { name: "Home", path: "/dashboard", icon: home, activeIcon: home_w },
    { name: "Portfolio", path: "/portfolio", icon: portfolio, activeIcon: portfolio_w },
    { name: "Wallet", path: "/wallet", icon: wallet, activeIcon: wallet_w },
    { name: "Contest", path: "/contest", icon: contest, activeIcon: contest_w },
    { name: "Market", path: "/market", icon: market, activeIcon: market_w },
    { name: "Leaderboard", path: "/leaderboard", icon: leaderboard, activeIcon: leaderboard_w },
    { name: "Activity", path: "/activity", icon: null, activeIcon: null, svgIcon: ActivityIcon },
    { name: "News", path: "/news", icon: null, activeIcon: null, svgIcon: NewsIcon },
    { name: "FAQ", path: "/faq", icon: faq, activeIcon: faq_w },
    { name: "Support", path: "/support", icon: null, activeIcon: null, svgIcon: SupportIcon },
  ];

  const primaryMobileItems = menuItems.filter((item) => PRIMARY_MOBILE_NAMES.includes(item.name));
  const moreMobileItems = menuItems.filter((item) => !PRIMARY_MOBILE_NAMES.includes(item.name));

  return (
    <div
      className={`relative ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-grey text-black'
      } font-pop transition-all duration-300`}
    >
      <div>
        {/* Mobile: 4 primary items + a "More" sheet for the rest */}
        <div className="lg:hidden fixed bottom-0 w-full z-10">
          <div
            className={`flex justify-around items-center py-2 ${
              darkMode ? 'bg-gray-900' : 'bg-grey'
            }`}
          >
            {primaryMobileItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link href={item.path} key={item.name} className="flex flex-col items-center">
                  <span
                    className={`flex flex-col items-center ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-transparent text-white'
                        : 'bg-transparent text-black'
                    } p-2 rounded-lg transition-all duration-300 ease-in-out`}
                  >
                    <ItemIcon
                      item={item}
                      darkMode={darkMode}
                      isActive={isActive}
                      className={`w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300 ease-in-out ${
                        isActive ? 'scale-110' : ''
                      }`}
                    />
                    <span
                      className={`text-xs sm:text-sm font-medium mt-1 ${
                        darkMode ? 'text-white' : isActive ? 'text-white' : 'text-black'
                      }`}
                    >
                      {item.name}
                    </span>
                  </span>
                </Link>
              );
            })}
            <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center">
              <span
                className={`flex flex-col items-center ${
                  moreOpen
                    ? 'bg-blue-500 text-white'
                    : darkMode
                    ? 'bg-transparent text-white'
                    : 'bg-transparent text-black'
                } p-2 rounded-lg transition-all duration-300 ease-in-out`}
              >
                <MoreIcon className="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300 ease-in-out" />
                <span className={`text-xs sm:text-sm font-medium mt-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                  More
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* "More" bottom sheet - everything not on the primary mobile bar */}
        <AnimatePresence>
          {moreOpen && (
            <React.Fragment key="more-sheet">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMoreOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/50 z-20"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                className={`lg:hidden fixed bottom-0 inset-x-0 z-30 rounded-t-3xl pt-3 pb-8 px-4 ${
                  darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
                }`}
              >
                <div className={`w-10 h-1.5 rounded-full mx-auto mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <div className="grid grid-cols-3 gap-3">
                  {moreMobileItems.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <Link
                        href={item.path}
                        key={item.name}
                        onClick={() => setMoreOpen(false)}
                        className={`flex flex-col items-center gap-2 py-4 rounded-xl transition-colors duration-200 ${
                          isActive ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                      >
                        <ItemIcon item={item} darkMode={darkMode} isActive={isActive} className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </React.Fragment>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: sticky vertical menu */}
      <div
        className={`hidden md:block sticky top-0 h-screen self-start text-center transition-all duration-500 ${
          menuOpen ? 'w-48' : 'w-16'
        } overflow-x-hidden overflow-y-auto`}
      >
        <div className="flex flex-col items-center pb-6 font-bold text-xl">
          <button
            className="focus:outline-none p-2 self-start"
            onClick={() => setMenuOpen(!menuOpen)} // Toggle menu
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className={`w-8 h-8 ${darkMode ? 'text-white' : 'text-black'}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <ul>
            <li className={`p-2 pt-6 ${menuOpen ? '' : 'flex justify-center'}`}>
              {menuOpen ? (
                <div className="flex flex-col justify-center text-center gap-6 text-base">
                  {menuItems.map((item) => (
                    <Link href={item.path} key={item.name}>
                      <span
                        className={`text-base font-medium text-center flex items-center gap-2 p-2 rounded-lg transition-all duration-500 ease-in-out ${
                          location === item.path
                            ? 'bg-blue-500 text-white'
                            : darkMode
                            ? 'bg-transparent text-white'
                            : 'bg-transparent text-black'
                        }`}
                      >
                        {item.svgIcon ? (
                          <item.svgIcon className="w-6 h-6 transition-all duration-300 ease-in-out" />
                        ) : (
                          <img
                            src={((darkMode ? item.activeIcon : location === item.path ? item.activeIcon : item.icon)?.src || (darkMode ? item.activeIcon : location === item.path ? item.activeIcon : item.icon)) as string}
                            alt={item.name}
                            className="w-6 h-6 transition-all duration-300 ease-in-out"
                          />
                        )}
                        <span className="hidden md:inline">{item.name}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div>
                  {menuItems.map((item) => (
                    <Link href={item.path} key={item.name}>
                      {item.svgIcon ? (
                        <item.svgIcon
                          className={`m-1 mb-5 p-2 rounded-lg transition-all duration-500 ease-in-out ${
                            location === item.path
                              ? 'bg-blue-500 w-10 h-10 transform scale-110'
                              : 'w-11 h-11'
                          }`}
                        />
                      ) : (
                        <img
                          src={((darkMode ? item.activeIcon : location === item.path ? item.activeIcon : item.icon)?.src || (darkMode ? item.activeIcon : location === item.path ? item.activeIcon : item.icon)) as string}
                          alt={item.name}
                          className={`m-1 mb-5 p-2 rounded-lg transition-all duration-500 ease-in-out ${
                            location === item.path
                              ? 'bg-blue-500 w-10 h-10 transform scale-110'
                              : 'w-11 h-11'
                          }`}
                        />
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Vheader;

