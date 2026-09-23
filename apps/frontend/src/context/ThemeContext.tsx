"use client";
import { createContext, useCallback, useContext, useEffect } from "react";
import { notifyBrowserValueChange, useBrowserValue } from "../hooks/useBrowserValue";

type ThemeContextValue = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({ darkMode: false, toggleDarkMode: () => {} });

// Components read the theme here instead of receiving darkMode props.
export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "darkMode";

// Dark is the default until the user picks a theme.
function readDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Server render/hydration use light; the stored theme applies right after.
  // The <html> background is set even earlier by the inline script in
  // app/layout.tsx, so the page itself never flashes.
  const darkMode = useBrowserValue(readDarkMode, false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(!readDarkMode()));
    } catch {}
    notifyBrowserValueChange();
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Pins a subtree to light mode while `enabled`: JS readers get darkMode=false
// and the data-theme wrapper switches off Tailwind's `dark:` classes inside it.
// The element tree is identical either way, so toggling never remounts children.
export const LightThemeScope = ({ enabled = true, children }: { enabled?: boolean; children: React.ReactNode }) => {
  const theme = useTheme();
  return (
    <ThemeContext.Provider value={enabled ? { ...theme, darkMode: false } : theme}>
      <div data-theme={enabled ? "light" : undefined}>{children}</div>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
