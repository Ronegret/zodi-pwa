"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  Coins,
  Crown,
  Flame,
  Gem,
  Hand,
  HeartHandshake,
  History,
  Home,
  MessageCircle,
  MoonStar,
  Orbit,
  Pickaxe,
  RadioTower,
  Save,
  ScrollText,
  ShieldHalf,
  Sparkles,
  Star,
  Swords,
  Trophy,
  UserRound,
  Users,
  Waves,
  WandSparkles,
  BookMarked
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getXpData, getLevel, getLevelTitle, getStreak, getGems } from "@/lib/gamification";

type NavItem = { label: string; icon: LucideIcon; href: string; badge?: string };

// ── Bottom nav: 5 tabs thumb-friendly ─────────────────────────────────────────
// ORÁCULO en el centro como en Co-Star ("Ask the Void")
const bottomNav: NavItem[] = [
  { label: "Inicio",    icon: Home,        href: "/dashboard" },
  { label: "Hoy",       icon: MoonStar,    href: "/dashboard/horoscopo" },
  { label: "Oráculo",   icon: WandSparkles, href: "/dashboard/oraculo" },
  { label: "Social",    icon: Users,       href: "/dashboard/comunidad" },
  { label: "Perfil",    icon: UserRound,   href: "/dashboard/perfil" }
];

// ── Sidebar completo (desktop) ─────────────────────────────────────────────────
const sidebarGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { label: "Inicio",    icon: Home,          href: "/dashboard" },
      { label: "Oráculo",   icon: WandSparkles,  href: "#open-oracle" },
      { label: "Perfil",    icon: UserRound,     href: "/dashboard/perfil" }
    ]
  },
  {
    label: "Horóscopos",
    items: [
      { label: "Diario",     icon: MoonStar,     href: "/dashboard/horoscopo" },
      { label: "Semanal",    icon: CalendarDays, href: "/dashboard/semana" },
      { label: "Mensual",    icon: Orbit,        href: "/dashboard/mes" },
      { label: "Tránsitos",  icon: RadioTower,   href: "/dashboard/transitos" },
      { label: "Chino",      icon: ShieldHalf,   href: "/dashboard/chino" },
      { label: "Maya",       icon: Star,         href: "/dashboard/maya" }
    ]
  },
  {
    label: "Lecturas",
    items: [
      { label: "Tarot",     icon: Sparkles,   href: "/dashboard/tarot" },
      { label: "Celta",     icon: ScrollText, href: "/dashboard/celta" },
      { label: "Sueños",    icon: Waves,      href: "/dashboard/suenos" },
      { label: "Runas",     icon: Swords,     href: "/dashboard/runas" },
      { label: "Cristales", icon: Gem,        href: "/dashboard/cristales" },
      { label: "Palma",     icon: Hand,       href: "/dashboard/mano" },
      { label: "Roast",     icon: Flame,      href: "/dashboard/roast" }
    ]
  },
  {
    label: "Astrología",
    items: [
      { label: "Carta natal",     icon: ChartNoAxesCombined, href: "/dashboard/carta-natal" },
      { label: "Numerología",     icon: Coins,              href: "/dashboard/numerologia" },
      { label: "Nombre",          icon: Bot,                href: "/dashboard/nombre" },
      { label: "Biorritmo",       icon: Pickaxe,            href: "/dashboard/biorritmo" },
      { label: "Compatibilidad",  icon: HeartHandshake,     href: "/dashboard/compatibilidad" }
    ]
  },
  {
    label: "Social",
    items: [
      { label: "Comunidad", icon: MessageCircle, href: "/dashboard/comunidad" },
      { label: "Amigos",    icon: Users,         href: "/dashboard/amigos" },
      { label: "Ranking",   icon: Trophy,        href: "/dashboard/ranking" }
    ]
  },
  {
    label: "Mi espacio",
    items: [
      { label: "Logros",    icon: Award,        href: "/dashboard/logros" },
      { label: "Rachas",    icon: Flame,        href: "/dashboard/rachas" },
      { label: "Favoritos", icon: Star,         href: "/dashboard/favoritos" },
      { label: "Guardados", icon: Save,         href: "/dashboard/guardados" },
      { label: "Historial", icon: History,      href: "/dashboard/historial" },
      { label: "Planes",    icon: Crown,        href: "/dashboard/premium" }
    ]
  }
];

// ── Sidebar ────────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState({ level: 1, title: "Iniciado del Caos", gems: 0, streak: 0 });

  useEffect(() => {
    try {
      const xp = getXpData();
      const level = getLevel(xp.total);
      const title = getLevelTitle(level);
      const gems = getGems().total;
      const streak = getStreak().count;
      setStats({ level, title, gems, streak });
    } catch { /* ignore */ }
  }, []);

  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-56 shrink-0 flex-col rounded-xl border border-white/07 shadow-[0_0_40px_rgba(184,255,23,0.06)] lg:flex overflow-hidden"
      style={{ background: "linear-gradient(180deg, rgb(12,12,20) 0%, rgb(8,8,16) 100%)" }}
    >
      {/* Logo — click lleva al inicio */}
      <div className="flex items-center justify-center border-b border-white/07 px-3 py-6">
        <Link href="/" className="relative block h-28 w-full scale-[1.35]">
          <Image
            src="/zodi-logo.png"
            alt="ZODI"
            fill
            sizes="280px"
            className="object-contain drop-shadow-[0_0_24px_rgba(184,255,23,0.55)] mix-blend-screen"
            priority
          />
        </Link>
      </div>

      {/* Stats mini — nivel, gemas, racha */}
      <div className="border-b border-white/07 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/35">Nivel {stats.level}</span>
          <span className="text-[10px] font-bold text-lime-300/70" style={{ fontFamily: "var(--font-mono)" }}>
            {stats.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Gemas */}
          <Link href="/dashboard/premium" className="flex items-center gap-1 hover:opacity-80 transition" title="Recargar energía">
            <Gem className="h-3 w-3 text-lime-300 drop-shadow-[0_0_8px_rgba(184,255,23,0.8)]" />
            <span className="text-xs font-bold text-lime-200" style={{ fontFamily: "var(--font-mono)" }}>
              {stats.gems}
            </span>
          </Link>
          {/* Racha */}
          {stats.streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="text-xs font-bold text-orange-300" style={{ fontFamily: "var(--font-mono)" }}>
                {stats.streak}d
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {sidebarGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              const isOracle = item.href === "#open-oracle";
              
              if (isOracle) {
                return (
                  <button
                    key={item.href}
                    title={item.label}
                    onClick={() => window.dispatchEvent(new CustomEvent('open-oracle'))}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-all text-white/55 hover:text-lime-100 hover:bg-white/[0.035] font-medium text-left"
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    <span className="truncate text-sm">{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-2.5 px-3 py-1.5 text-sm transition-all ${
                    active
                      ? "text-lime-200 bg-lime-300/10 border-r-2 border-lime-300 font-bold"
                      : "text-white/55 hover:text-lime-100 hover:bg-white/[0.035] font-medium"
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-lime-300" : "text-white/40"}`} />
                  <span className="truncate text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="border-t border-white/07 px-3 py-3">
        <Link href="/dashboard/premium" className="flex items-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/05 px-3 py-2 transition hover:border-yellow-400/40">
          <Crown className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-300/80">Ver planes</span>
        </Link>
      </div>
    </aside>
  );
}

// ── Bottom Nav (móvil) ─────────────────────────────────────────────────────────
export function BottomNav() {
  const pathname = usePathname();
  const [streak, setStreak] = useState(0);
  const [gems, setGems] = useState(0);

  useEffect(() => {
    try {
      setStreak(getStreak().count);
      setGems(getGems().total);
    } catch { /* ignore */ }
  }, []);

  return (
    <nav
      className="fixed bottom-2 left-2 right-2 z-40 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] lg:hidden sm:bottom-4 sm:left-4 sm:right-4"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "rgb(8, 8, 14)",
        transform: "translateZ(0)",
        willChange: "auto",
      }}
    >
      <div className="grid grid-cols-5 items-center justify-between px-1 sm:px-2" style={{ height: "64px" }}>
        {bottomNav.map((item, i) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isOracle = item.href === "/dashboard/oraculo";

          if (isOracle) {
            return (
              <button
                key={item.href}
                aria-label={item.label}
                onClick={() => window.dispatchEvent(new CustomEvent('open-oracle'))}
                className="relative flex flex-col items-center justify-center gap-0.5 transition-all text-white/45 scale-100"
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl transition-all bg-white/08 border border-white/12">
                  <item.icon className="h-5 w-5" />
                  <motion.span
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.08, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-xl border border-lime-300/30"
                  />
                </div>
                <span className="text-[10px] font-semibold leading-tight mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-all ${
                active ? "text-lime-300" : "text-white/45"
              }`}
            >
              {/* Active indicator — pill arriba del icono */}
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-lime-300"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <div className={`flex h-6 w-6 items-center justify-center transition-all ${active ? "scale-110" : ""}`}>
                <item.icon className="h-5 w-5" />
              </div>

              {/* Badges */}
              {item.href === "/dashboard/horoscopo" && (
                <span className="absolute right-2.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_4px_rgba(184,255,23,0.80)]" />
              )}
              {item.href === "/dashboard/perfil" && streak >= 3 && (
                <span className="absolute right-2 top-1.5 flex items-center gap-0.5 rounded-full bg-orange-500/80 px-1.5 py-0.5">
                  <Flame className="h-2 w-2 text-white" />
                  <span className="text-[8px] font-black text-white">{streak}</span>
                </span>
              )}

              <span className="text-[10px] font-semibold leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
