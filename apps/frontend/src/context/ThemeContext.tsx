"use client";
import React, { createContext, useState, useEffect } from "react";

// Create the Theme Context
const ThemeContext = createContext<any>({} as any);

export const ThemeProvider = ({ children }) => {
  // Always start at the same default on server and client — reading
  // localStorage into the initial state caused a hydration mismatch
  // whenever a returning visitor had dark mode saved (server always
  // renders light, client's first render read localStorage and rendered
  // dark, React flagged a hydration error). The real value is synced in
  // immediately after mount instead, via the effect below.
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

  // Set the theme on component mount or when darkMode changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Export the context for consumption
export default ThemeContext;
