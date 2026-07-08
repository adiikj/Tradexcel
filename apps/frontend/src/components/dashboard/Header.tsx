"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import Cookies from "js-cookie";
import logo from "../../assets/logo-icon-transparent.png";
import wordmarkLight from "../../assets/tradexcel-wordmark-light.png";
import wordmarkDark from "../../assets/tradexcel-wordmark-dark.png";
import profile from "../../assets/profile.png";
import dark from "../../assets/dark.png";
import lighty from "../../assets/light-y.png";
import Alerts from "../alerts/Alerts"; // Importing Alerts component
import GlobalSearch from "../layout/GlobalSearch";
import AchievementsBadge from "../layout/AchievementsBadge";
import { getAvatar } from "../../api/api";

const Header = ({ darkMode, toggleDarkMode }) => {
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState<any>(false);
  const menuRef = useRef(null);
  const [avatar, setAvatar] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleLogout = () => {
    Cookies.remove("accessToken");
    dispatch(logout());
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const data = await getAvatar();  // Call the API to get the avatar
        setAvatar(data?.data?.avatar || null);  // Backend wraps the payload as { data: { avatar } }
      } catch (err) {
        setError(err.message);  // Handle error
      }
    };

    fetchAvatar();  // Fetch the avatar when the component mounts
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
        darkMode ? "bg-gray-900 text-white" : "bg-grey text-black"
      } px-4 transition-all duration-300`}
    >
      {/* Logo */}
      <Link href="/dashboard">
        <div className="flex flex-row items-center gap-2 py-2">
          <img className="h-6 w-6 md:w-7 md:h-7" src={((logo)?.src || (logo)) as string} alt="" />
          <img
            className="hidden md:block h-4 w-auto"
            src={((darkMode ? wordmarkDark : wordmarkLight)?.src || (darkMode ? wordmarkDark : wordmarkLight)) as string}
            alt="Tradexcel"
          />
        </div>
      </Link>

      {/* Global Search */}
      <GlobalSearch darkMode={darkMode} />

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-lg bg-transparent border-0 cursor-pointer"
        >
          <img
            src={((darkMode ? lighty : dark)?.src || (darkMode ? lighty : dark)) as string}
            alt={darkMode ? "Light Mode" : "Dark Mode"}
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
        </button>

        {/* Achievements */}
        <AchievementsBadge darkMode={darkMode} />

        {/* Alerts Component */}
        <Alerts darkMode={darkMode} />

        {/* Profile */}
        <div ref={menuRef} className="relative">
          <div
            onClick={handleProfileClick}
            className={`rounded-full ${
              darkMode ? "bg-gray-800" : "bg-white"
            } w-8 h-8 md:w-9 md:h-9 cursor-pointer overflow-hidden`}
          >
            <img src={(avatar || (profile as any)?.src || profile) as string} alt="Profile" className="w-full h-full object-cover" />
          </div>

          {menuOpen && (
            <div
              className={`absolute right-0 mt-2 w-32 ${
                darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
              } rounded-md shadow-lg z-10`}
            >
              <ul className="flex flex-col text-sm font-pop">
                <Link href="/your-profile">
                  <li
                    className={`p-2 cursor-pointer ${
                      darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                  >
                    Your Profile
                  </li>
                </Link>
                <li
                  onClick={handleLogout}
                  className={`p-2 cursor-pointer ${
                    darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  }`}
                >
                  Logout
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
