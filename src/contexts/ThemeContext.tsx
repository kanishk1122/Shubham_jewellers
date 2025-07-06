"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  actualTheme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // If we're in a development environment, throw the error
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      throw new Error("useTheme must be used within a ThemeProvider");
    }
    // Fallback for production or SSR
    return {
      theme: "light" as Theme,
      actualTheme: "light" as "light" | "dark",
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check for saved theme
    const savedTheme = localStorage.getItem("theme") as Theme;
    const initialTheme = savedTheme || "system";

    setThemeState(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateActualTheme = () => {
      let newActualTheme: "light" | "dark";

      if (theme === "system") {
        newActualTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
      } else {
        newActualTheme = theme;
      }

      setActualTheme(newActualTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(newActualTheme);
      localStorage.setItem("theme", theme);
    };

    updateActualTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        updateActualTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  const toggleTheme = () => {
    const themeOrder: Theme[] = ["light", "dark", "system"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setThemeState(themeOrder[nextIndex]);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-white dark:bg-zinc-900" />;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, actualTheme, toggleTheme, setTheme }}
    >
      <div className={actualTheme}>{children}</div>
    </ThemeContext.Provider>
  );
};
