"use client";
import React, { createContext, useState, useEffect } from "react";

const ThemeContext = createContext<any>({} as any);

export const ThemeProvider = ({ children }) => {
  // Starts false on both server and client to avoid a hydration mismatch; synced from localStorage after mount.
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      document.documentElement.setAttribute("data-theme", newMode ? "dark" : "light");
      localStorage.setItem("darkMode", String(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
