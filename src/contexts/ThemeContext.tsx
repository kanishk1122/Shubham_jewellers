"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextType = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

const STORAGE_KEY = "theme_preference";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeClass(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (resolved === "dark") {
    el.classList.add("dark");
    // optional: set color-scheme for browser form controls
    el.style.colorScheme = "dark";
  } else {
    el.classList.remove("dark");
    el.style.colorScheme = "light";
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved =
        typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
      return (saved as Theme) || "system";
    } catch {
      return "system";
    }
  });

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") return getSystemTheme();
    return theme === "dark" ? "dark" : "light";
  }, [theme]);

  // apply on mount and when resolvedTheme changes
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  // listen to system theme changes when theme === 'system'
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyThemeClass(getSystemTheme());
      }
    };
    mq.addEventListener
      ? mq.addEventListener("change", handler)
      : mq.addListener(handler);
    return () =>
      mq.removeEventListener
        ? mq.removeEventListener("change", handler)
        : mq.removeListener(handler);
  }, [theme]);

  // safe setter that persists preference
  const setTheme = (t: Theme) => {
    try {
      setThemeState(t);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, t);
      }
    } catch {
      setThemeState(t);
    }
  };

  const toggleTheme = () => {
    // cycle: light -> dark -> system -> light
    setThemeState((prev) => {
      const next: Theme =
        prev === "light" ? "dark" : prev === "dark" ? "system" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });
  };

  const ctx = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={ctx}>{children}</ThemeContext.Provider>;
};
