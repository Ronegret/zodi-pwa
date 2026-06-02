"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, WandSparkles, Zap } from "lucide-react";
import { dashboardSections } from "@/lib/dashboard-sections";
import { useTheme } from "@/lib/theme";

// ── Categorías para organizar todas las secciones ─────────────────────────────
const categories = [
  {
    label: "Horóscopos",
    cartaLabel: "Entrantes Cósmicos",
    description: "Lecturas rápidas y guía diaria para digerir tu clima astral del día.",
    emoji: "🌙",
    cartaEmoji: "🍳",
    slugs: ["horoscopo", "semana", "mes", "transitos", "chino", "maya"],
  },
  {
    label: "Lecturas",
    cartaLabel: "Postres Adivinatorios",
    description: "Oráculos, tiradas de cartas y descifrado de símbolos sin anestesia.",
    emoji: "🃏",
    cartaEmoji: "🧁",
    slugs: ["tarot", "celta", "suenos", "runas", "cristales", "roast"],
  },
  {
    label: "Astrología",
    cartaLabel: "Platos Fuertes Astrales",
    description: "Lecturas profundas sobre tu personalidad, destino, vibración y relaciones.",
    emoji: "⭐",
    cartaEmoji: "🍲",
    slugs: ["carta-natal", "numerologia", "nombre", "mano", "biorritmo", "compatibilidad"],
  },
  {
    label: "Social",
    cartaLabel: "Acompañamientos",
    description: "Comparte tu energía con tu círculo o confiésate de manera anónima.",
    emoji: "👥",
    cartaEmoji: "🍹",
    slugs: ["comunidad", "amigos"],
  },
  {
    label: "Mi espacio",
    cartaLabel: "Reservas del Alma",
    description: "Tu bitácora mística de crecimiento, logros y lecturas guardadas.",
    emoji: "🏆",
    cartaEmoji: "🍷",
    slugs: ["logros", "rachas", "favoritos", "guardados", "historial", "puntos"],
  },
  {
    label: "Cuenta",
    cartaLabel: "La Cuenta",
    description: "Tu estatus actual, perfil astral y planes de suscripción.",
    emoji: "👤",
    cartaEmoji: "💸",
    slugs: ["perfil", "premium"],
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
export function MobileFullMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<"carta" | "grid">("carta");
  const { theme, toggle } = useTheme();

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet — pantalla completa en mobile */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[56] flex flex-col"
            style={{
              background: "linear-gradient(160deg, var(--surface) 0%, var(--surface2) 60%, var(--surface3) 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-5 shrink-0 border-b border-white/07"
              style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 1.25rem))" }}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-300/70">Navegación</p>
                <h2 className="text-lg font-black leading-tight">Todo en ZODI</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <button
                  onClick={toggle}
                  aria-label={theme === "dark" ? "Activar modo NEON" : "Volver a modo oscuro"}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 transition hover:bg-white/10"
                  title={theme === "dark" ? "⚡ Modo NEON" : "🌌 Modo Oscuro"}
                >
                  {theme === "dark" ? (
                    <Zap className="h-4 w-4 text-yellow-300/80" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-lime-300/80" />
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar menú"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Selector de Vista (Segment Control) */}
            <div className="px-5 py-3 shrink-0 flex justify-center border-b border-white/05 bg-black/25">
              <div className="flex rounded-xl bg-white/03 border border-white/08 p-1 w-full max-w-sm">
                <button
                  onClick={() => setViewMode("carta")}
                  className={`flex-1 rounded-lg py-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    viewMode === "carta"
                      ? "bg-lime-300 text-black shadow-[0_0_12px_rgba(184,255,23,0.25)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  📜 La Carta ZODI
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex-1 rounded-lg py-2 text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-lime-300 text-black shadow-[0_0_12px_rgba(184,255,23,0.25)]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  🎛️ Vista Rejilla
                </button>
              </div>
            </div>

            {/* Oráculo quick-access */}
            <div className="px-5 pt-3 pb-1 shrink-0">
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent("open-oracle"));
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-left transition hover:border-violet-400/50 hover:bg-violet-500/15 active:scale-98"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-400/30">
                  <WandSparkles className="h-4 w-4 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-violet-100">Oráculo personal</p>
                  <p className="text-[11px] text-violet-200/55">Pregunta libre al cosmos</p>
                </div>
                <span className="ml-auto rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-300">
                  ⚡ LIBRE
                </span>
              </button>
            </div>

            {/* Sections scroll */}
            <div className="flex-1 overflow-y-auto px-4 no-scrollbar" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))" }}>
              {categories.map((cat) => {
                const items = cat.slugs
                  .map((slug) => dashboardSections.find((s) => s.slug === slug))
                  .filter(Boolean) as typeof dashboardSections;

                if (!items.length) return null;

                return (
                  <div key={cat.label} className="mb-6 mt-4">
                    <div className="mb-3 px-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300/80">
                        {viewMode === "carta" ? `${cat.cartaEmoji} ${cat.cartaLabel}` : `${cat.emoji} ${cat.label}`}
                      </p>
                      {viewMode === "carta" && (
                        <p className="mt-1 text-xs text-white/40 italic font-medium leading-normal">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {viewMode === "grid" ? (
                      <div className="grid grid-cols-3 gap-2.5">
                        {items.map((section) => {
                          const active = pathname === `/dashboard/${section.slug}`;
                          const Icon = section.icon;
                          return (
                            <Link
                              key={section.slug}
                              href={`/dashboard/${section.slug}`}
                              onClick={onClose}
                              className={`group flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 text-center transition active:scale-95 ${
                                active
                                  ? "border-lime-300/40 bg-lime-300/10 text-lime-200"
                                  : "border-white/08 bg-white/03 text-white/70 hover:border-white/20 hover:bg-white/08"
                              }`}
                            >
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                active
                                  ? "bg-lime-300/20 text-lime-300"
                                  : "bg-black/40 text-white/50 group-hover:text-white/80"
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-[11px] font-bold leading-tight line-clamp-2">
                                {section.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5 border border-white/05 bg-black/20 p-4 rounded-xl">
                        {items.map((section) => {
                          const active = pathname === `/dashboard/${section.slug}`;
                          const Icon = section.icon;
                          return (
                            <Link
                              key={section.slug}
                              href={`/dashboard/${section.slug}`}
                              onClick={onClose}
                              className="group flex items-start gap-3.5 py-0.5 text-left transition active:opacity-80"
                            >
                              {/* Icon box */}
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                active
                                  ? "border-lime-300/40 bg-lime-300/10 text-lime-300"
                                  : "border-white/08 bg-black/45 text-white/40 group-hover:border-lime-300/30 group-hover:text-lime-200"
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1">
                                  <span className={`text-sm font-black transition ${
                                    active ? "text-lime-300" : "text-white group-hover:text-lime-200"
                                  }`}>
                                    {section.title}
                                  </span>
                                  {/* Dotted separator */}
                                  <span className="flex-1 border-b border-dashed border-white/10 mx-2" />
                                  <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 transition ${
                                    active ? "text-lime-300" : "text-lime-200/50"
                                  }`}>
                                    {section.kicker}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-white/45 leading-relaxed font-medium">
                                  {section.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
