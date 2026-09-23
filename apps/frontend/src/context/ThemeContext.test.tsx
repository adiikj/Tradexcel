import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LightThemeScope, ThemeProvider, useTheme } from "./ThemeContext";

function ShowTheme() {
  const { darkMode } = useTheme();
  return <span>{darkMode ? "dark" : "light"}</span>;
}

describe("theme", () => {
  afterEach(() => localStorage.clear());

  it("defaults to dark and mirrors it onto <html data-theme>", () => {
    render(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>
    );
    expect(screen.getByText("dark")).toBeTruthy();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("LightThemeScope pins its subtree to light for JS and for dark: classes", () => {
    render(
      <ThemeProvider>
        <LightThemeScope>
          <ShowTheme />
        </LightThemeScope>
      </ThemeProvider>
    );
    const label = screen.getByText("light");
    expect(label.closest('[data-theme="light"]')).not.toBeNull();
  });

  it("a disabled scope passes the real theme through", () => {
    render(
      <ThemeProvider>
        <LightThemeScope enabled={false}>
          <ShowTheme />
        </LightThemeScope>
      </ThemeProvider>
    );
    expect(screen.getByText("dark").closest("[data-theme]")?.getAttribute("data-theme")).not.toBe("light");
  });
});
