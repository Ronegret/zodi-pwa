"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  LayoutGrid,
  MessageCircle,
  MoonStar,
  Music2,
  Orbit,
  Pause,
  Pickaxe,
  Play,
  RadioTower,
  Save,
  ScrollText,
  ShieldHalf,
  Sparkles,
  Star,
  Swords,
  UserRound,
  Users,
  Waves,
  WandSparkles,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getXpData, getLevel, getLevelTitle, getStreak, getGems } from "@/lib/gamification";
import { MobileFullMenu } from "@/components/dashboard/MobileFullMenu";
import { useTheme } from "@/lib/theme";

type NavItem = { label: string; icon: LucideIcon; href: string; badge?: string };

// ── Bottom nav: 5 tabs — "Menú" muestra todas las secciones ───────────────────
const bottomNav: NavItem[] = [
  { label: "Inicio",   icon: Home,        href: "/dashboard" },
  { label: "Hoy",      icon: MoonStar,    href: "/dashboard/horoscopo" },
  { label: "Oráculo",  icon: WandSparkles, href: "/dashboard/oraculo" },
  { label: "Menú",     icon: LayoutGrid,  href: "#menu" },
  { label: "Perfil",   icon: UserRound,   href: "/dashboard/perfil" },
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
      { label: "Roast",     icon: Flame,      href: "/dashboard/roast" },
      { label: "Rituales",  icon: Sparkles,   href: "/dashboard/ranking" }
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
      { label: "Amigos",    icon: Users,         href: "/dashboard/amigos" }
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
  const { theme, toggle } = useTheme();
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
    <aside className="sticky top-5 hidden h-[calc(100vh-40px)] w-56 xl:w-64 shrink-0 flex-col rounded-xl border shadow-[0_0_40px_rgba(184,255,23,0.06)] lg:flex overflow-hidden"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-3 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
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

      {/* Stats mini */}
      <div className="px-3 py-3 space-y-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/35">Nivel {stats.level}</span>
          <span className="text-[10px] font-bold text-lime-300/70" style={{ fontFamily: "var(--font-mono)" }}>
            {stats.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/premium" className="flex items-center gap-1 hover:opacity-80 transition" title="Recargar energía">
            <Gem className="h-3 w-3 text-lime-300 drop-shadow-[0_0_8px_rgba(184,255,23,0.8)]" />
            <span className="text-xs font-bold text-lime-200" style={{ fontFamily: "var(--font-mono)" }}>
              {stats.gems}
            </span>
          </Link>
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
      <div className="px-3 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={`Tema actual: ${theme} → cambiar`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/[0.05] w-full"
        >
          {theme === "dark"  && <Zap       className="h-3.5 w-3.5 text-yellow-300/80" />}
          {theme === "light" && <Sparkles  className="h-3.5 w-3.5 text-sky-400/80" />}
          {theme === "neon"  && <MoonStar  className="h-3.5 w-3.5 text-lime-300/80" />}
          <span className="text-xs font-bold text-white/45">
            {theme === "dark"  ? "⚡ Modo NEON" : theme === "light" ? "🌌 Modo Oscuro" : "☀️ Modo Claro"}
          </span>
        </button>

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
  const [streak, setStreak]       = useState(0);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [pressed, setPressed]     = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    try { setStreak(getStreak().count); } catch { /* ignore */ }

    // Escucha el estado del reproductor (emitido por MusicPlayer)
    const onState = (e: Event) => {
      setMusicPlaying((e as CustomEvent<{ isPlaying: boolean }>).detail.isPlaying);
    };
    window.addEventListener("zodi:music-state", onState);
    return () => window.removeEventListener("zodi:music-state", onState);
  }, []);

  function handlePress(key: string) {
    setPressed(key);
    setTimeout(() => setPressed(null), 450);
  }

  return (
    <>
      <MobileFullMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <nav
        className="bottom-nav-bar fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl border-t border-l-0 border-r-0 border-b-0 shadow-[0_-4px_24px_rgba(0,0,0,0.7)] lg:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background: "var(--nav-bg)",
          borderTopColor: "var(--border)",
          transform: "translateZ(0)",
        }}
      >
        <div className="grid grid-cols-6 items-center" style={{ height: "64px" }}>
          {bottomNav.map((item) => {
            const isOracle = item.href === "/dashboard/oraculo";
            const isMenu   = item.href === "#menu";
            const active   = !isMenu && !isOracle &&
              (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));
            const isPressed = pressed === item.href || (isMenu && pressed === "#menu");

            // ── Oráculo ───────────────────────────────────────────────────
            if (isOracle) {
              return (
                <motion.button
                  key="oracle"
                  aria-label="Oráculo"
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  onClick={() => { handlePress(item.href); window.dispatchEvent(new CustomEvent("open-oracle")); }}
                  className="relative flex flex-col items-center justify-center gap-0.5 text-lime-300/90"
                >
                  {/* Sparkle wrapper — positions particles around the circle */}
                  <div className="relative h-11 w-11">
                    {/* Orbiting sparkle particles */}
                    {[
                      { x: 20, y: -18, delay: 0 },
                      { x: 23, y: 8,   delay: 0.9 },
                      { x: -21, y: -14, delay: 1.8 },
                      { x: -19, y: 12, delay: 2.7 },
                    ].map(({ x, y, delay }) => (
                      <motion.span
                        key={`sp-${delay}`}
                        className="pointer-events-none absolute text-lime-300 font-black select-none"
                        style={{ fontSize: 8, left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%,-50%)" }}
                        animate={{ opacity: [0, 1, 0], scale: [0.3, 1.3, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3.2, delay, ease: "easeInOut" }}
                      >
                        ✦
                      </motion.span>
                    ))}
                    {/* Icon circle */}
                    <div
                      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-lime-300/12 border border-lime-300/40"
                      style={{ boxShadow: "0 0 10px rgba(184,255,23,0.22), 0 0 22px rgba(184,255,23,0.08)" }}
                    >
                      <item.icon className="h-5 w-5 text-lime-200" />
                      <span className="oracle-pulse-ring absolute inset-0 rounded-full border border-lime-300/40 pointer-events-none" />
                      <AnimatePresence>
                        {isPressed && (
                          <motion.span
                            key="burst"
                            className="pointer-events-none absolute rounded-full border-2 border-lime-300"
                            initial={{ width: 44, height: 44, opacity: 0.9, x: "-50%", y: "-50%", left: "50%", top: "50%", scale: 1 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold leading-tight text-lime-300/80">{item.label}</span>
                </motion.button>
              );
            }

            // ── Menú ──────────────────────────────────────────────────────
            if (isMenu) {
              return (
                <motion.button
                  key="menu"
                  aria-label="Menú completo"
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", stiffness: 500, damping: 28 }}
                  onClick={() => { handlePress("#menu"); setMenuOpen(true); }}
                  className={`relative flex flex-col items-center justify-center gap-0.5 ${menuOpen ? "text-lime-300" : "text-white/45"}`}
                >
                  {/* Círculo activo */}
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.span
                        key="circle"
                        className="pointer-events-none absolute rounded-full"
                        style={{ width: 40, height: 40, background: "rgba(184,255,23,0.14)", boxShadow: "0 0 0 1px rgba(184,255,23,0.25)" }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      />
                    )}
                  </AnimatePresence>
                  {/* Ring burst */}
                  <AnimatePresence>
                    {isPressed && (
                      <motion.span
                        key="burst"
                        className="pointer-events-none absolute rounded-full border-2 border-lime-300/70"
                        initial={{ width: 40, height: 40, opacity: 0.85, scale: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="relative z-10 text-[10px] font-semibold leading-tight">{item.label}</span>
                </motion.button>
              );
            }

            // ── Tab normal ─────────────────────────────────────────────────
            return (
              <motion.div
                key={item.href}
                whileTap={{ scale: 0.82 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="relative flex flex-col items-center justify-center"
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  onClick={() => handlePress(item.href)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 ${active ? "text-lime-300" : "text-white/45"}`}
                >
                  {/* Círculo activo con layoutId para deslizarse entre tabs */}
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        key="circle"
                        layoutId="nav-active-circle"
                        className="pointer-events-none absolute rounded-full"
                        style={{ width: 40, height: 40, background: "rgba(184,255,23,0.14)", boxShadow: "0 0 0 1px rgba(184,255,23,0.25)" }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 26 }}
                      />
                    )}
                  </AnimatePresence>
                  {/* Ring burst al pulsar */}
                  <AnimatePresence>
                    {isPressed && (
                      <motion.span
                        key="burst"
                        className="pointer-events-none absolute rounded-full border-2 border-lime-300/70"
                        initial={{ width: 40, height: 40, opacity: 0.85, scale: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center">
                    <item.icon className={`h-5 w-5 ${active ? "scale-110" : ""}`} />
                  </div>
                  {/* Badges */}
                  {item.href === "/dashboard/horoscopo" && !active && (
                    <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_4px_rgba(184,255,23,0.8)]" />
                  )}
                  {item.href === "/dashboard/perfil" && streak >= 3 && (
                    <span className="absolute -right-1 top-0 flex items-center gap-0.5 rounded-full bg-orange-500/80 px-1 py-0.5">
                      <Flame className="h-2 w-2 text-white" />
                      <span className="text-[8px] font-black text-white">{streak}</span>
                    </span>
                  )}
                  <span className="relative z-10 text-[10px] font-semibold leading-tight">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}

          {/* ── Música — 6° botón ─────────────────────────────────────────── */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            onClick={() => window.dispatchEvent(new CustomEvent("zodi:music-toggle"))}
            aria-label={musicPlaying ? "Pausar música" : "Reproducir música"}
            className={`relative flex flex-col items-center justify-center gap-0.5 ${musicPlaying ? "text-lime-300" : "text-white/45"}`}
          >
            {/* Vinilo animado de fondo */}
            <div className="relative h-6 w-6 flex items-center justify-center">
              {musicPlaying ? (
                <>
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-lime-300/40"
                  />
                  <Pause className="h-4 w-4 relative z-10" />
                </>
              ) : (
                <Music2 className="h-4 w-4" />
              )}
            </div>
            <span className="text-[10px] font-semibold leading-tight">Música</span>
          </motion.button>

        </div>
      </nav>
    </>
  );
}
