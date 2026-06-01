"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, WandSparkles } from "lucide-react";
import { dashboardSections } from "@/lib/dashboard-sections";

// ── Categorías para organizar todas las secciones ─────────────────────────────
const categories = [
  {
    label: "Horóscopos",
    emoji: "🌙",
    slugs: ["horoscopo", "semana", "mes", "transitos", "chino", "maya"],
  },
  {
    label: "Lecturas",
    emoji: "🃏",
    slugs: ["tarot", "celta", "suenos", "runas", "cristales", "roast"],
  },
  {
    label: "Astrología",
    emoji: "⭐",
    slugs: ["carta-natal", "numerologia", "nombre", "mano", "biorritmo", "compatibilidad"],
  },
  {
    label: "Social",
    emoji: "👥",
    slugs: ["comunidad", "amigos"],
  },
  {
    label: "Mi espacio",
    emoji: "🏆",
    slugs: ["logros", "rachas", "favoritos", "guardados", "historial", "puntos"],
  },
  {
    label: "Cuenta",
    emoji: "👤",
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

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            className="fixed bottom-0 left-0 right-0 z-[56] flex max-h-[88dvh] flex-col rounded-t-2xl"
            style={{
              background: "linear-gradient(180deg, rgb(14,14,22) 0%, rgb(8,8,16) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 pt-1 shrink-0 border-b border-white/07">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-300/70">Navegación</p>
                <h2 className="text-lg font-black leading-tight">Todo en ZODI</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Oráculo quick-access */}
            <div className="px-5 pt-4 pb-2 shrink-0">
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
            <div className="flex-1 overflow-y-auto px-4 pb-16 no-scrollbar" style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}>
              {categories.map((cat) => {
                const items = cat.slugs
                  .map((slug) => dashboardSections.find((s) => s.slug === slug))
                  .filter(Boolean) as typeof dashboardSections;

                if (!items.length) return null;

                return (
                  <div key={cat.label} className="mb-6">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-white/50">
                      {cat.emoji} {cat.label}
                    </p>
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
