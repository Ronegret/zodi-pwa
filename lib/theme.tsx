"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
interface ThemeCtx { theme: Theme; toggle: () => void; }

const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

const THEME_COLOR = { dark: "#060608", light: "#f0ece2" };

function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
  // Actualiza el color de la barra del navegador en iOS/Android
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[t]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("zodi-theme") as Theme | null;
    const t = saved === "light" ? "light" : "dark";
    setTheme(t);
    applyTheme(t);
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("zodi-theme", next);
      applyTheme(next);
      return next;
    });
  };

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
