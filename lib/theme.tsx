"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }

  useEffect(() => {
    const stored = localStorage.getItem("krypt-theme") as Theme | null;
    const resolved = stored === "light" ? "light" : "dark";
    setThemeState(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("krypt-theme", t);
    applyTheme(t);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
