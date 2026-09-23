"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import logo from "../../assets/logo-icon-transparent.png";
import wordmarkLight from "../../assets/tradexcel-wordmark-light.png";
import wordmarkDark from "../../assets/tradexcel-wordmark-dark.png";
import dark from "../../assets/dark.png";
import lighty from "../../assets/light-y.png";
import Alerts from "../alerts/Alerts"; // Importing Alerts component
import GlobalSearch from "../layout/GlobalSearch";
import AchievementsBadge from "../layout/AchievementsBadge";
import { getAvatar, logoutUser } from "../../api/api";
import { clearSession } from "../../utils/sessionFlag";
import { useTheme } from "../../context/ThemeContext";
import Image from "next/image";
import Avatar from "../ui/Avatar";
import ThemedImage from "../ui/ThemedImage";

const Header = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleLogout = async () => {
    // The auth cookies are httpOnly, so only the backend can clear them.
    await logoutUser().catch(() => {});
    clearSession();
    dispatch(logout());
    // Full reload on purpose: drops in-memory app state (store, socket).
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const data = await getAvatar();  // Call the API to get the avatar
        setAvatar(data?.data?.avatar || null);  // Backend wraps the payload as { data: { avatar } }
      } catch {
        // Avatar stays null; the default profile image is shown instead.
      }
    };

    fetchAvatar();  // Fetch the avatar when the component mounts
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setMenuOpen((prevState) => !prevState);
  };

  return (
    <div
      className={`w-full h-14 md:h-16 flex justify-between font-pop items-center ${
        "bg-grey text-black dark:bg-gray-900 dark:text-white"
      } px-4 transition-all duration-300`}
    >
      {/* Logo */}
      <Link href="/dashboard">
        <div className="flex flex-row items-center gap-2 py-2">
          <Image className="h-6 w-6 md:w-7 md:h-7" src={logo} alt="" />
          <span className="hidden md:contents">
            <ThemedImage className="h-4 w-auto" light={wordmarkLight} dark={wordmarkDark} alt="Tradexcel" />
          </span>
        </div>
      </Link>

      {/* Global Search */}
      <GlobalSearch />

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="text-lg bg-transparent border-0 cursor-pointer"
        >
          <ThemedImage light={dark} dark={lighty} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Achievements */}
        <AchievementsBadge />

        {/* Alerts Component */}
        <Alerts />

        {/* Profile */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={handleProfileClick}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`block rounded-full ${
              "bg-white dark:bg-gray-800"
            } w-8 h-8 md:w-9 md:h-9 cursor-pointer overflow-hidden`}
          >
            <Avatar src={avatar} size={36} className="w-full h-full object-cover" />
          </button>

          {menuOpen && (
            <div
              className={`absolute right-0 mt-2 w-32 ${
                "bg-white text-black dark:bg-gray-900 dark:text-white"
              } rounded-md shadow-lg z-10`}
            >
              <ul role="menu" className="flex flex-col text-sm font-pop">
                <li role="none">
                  <Link
                    href="/your-profile"
                    role="menuitem"
                    className={`block p-2 cursor-pointer ${
                      "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    Your Profile
                  </Link>
                </li>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className={`w-full text-left p-2 cursor-pointer ${
                      "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
