"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "neon";
interface ThemeCtx { theme: Theme; toggle: () => void; }

const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

const THEME_COLOR: Record<Theme, string> = {
  dark:  "#060608",
  light: "#f5f5f0",
  neon:  "#000000",
};

const THEME_CYCLE: Theme[] = ["dark", "light", "neon"];

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[t]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("zodi-theme") as Theme | null;
    const valid: Theme[] = ["dark", "light", "neon"];
    const t: Theme = valid.includes(saved as Theme) ? (saved as Theme) : "dark";
    setTheme(t);
    applyTheme(t);
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const idx = THEME_CYCLE.indexOf(prev);
      const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
      localStorage.setItem("zodi-theme", next);
      applyTheme(next);
      return next;
    });
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
