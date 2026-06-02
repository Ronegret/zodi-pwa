"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gem, Share2, Download } from "lucide-react";
import { dashboardSections } from "@/lib/dashboard-sections";

// ── Skeleton cards mientras hidrata ──────────────────────────────────────────
function FeaturedSkeleton() {
  return (
    <div className="grid gap-2.5 grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="min-h-[140px] sm:min-h-44 lg:min-h-52 rounded-2xl bg-white/04 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

function SecondaryGroupSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, gi) => (
        <div key={gi}>
          <div className="h-3 w-24 rounded bg-white/05 mb-2 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[...Array(gi === 0 ? 4 : gi === 1 ? 6 : gi === 2 ? 4 : 6)].map((_, i) => (
              <div key={i} className="h-9 rounded-xl bg-white/04 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const featured = [
  { slug: "horoscopo",    badge: "🔥 HOY",    color: "from-violet-500/30 to-fuchsia-500/20" },
  { slug: "tarot",        badge: "🃏 GRATIS",  color: "from-cyan-500/25 to-blue-500/15" },
  { slug: "oraculo",      badge: "⚡ LIBRE",   color: "from-lime-500/25 to-emerald-500/15" },
  { slug: "compatibilidad", badge: "💘 AMOR",  color: "from-pink-500/25 to-rose-500/15" },
  { slug: "numerologia",  badge: "🔢 MÁGICO", color: "from-amber-500/25 to-yellow-500/15" },
  { slug: "chino",        badge: "🐉 CICLO",  color: "from-red-500/25 to-orange-500/15" },
  { slug: "comunidad",    badge: "👥 SOCIAL",  color: "from-indigo-500/25 to-purple-500/15" },
  { slug: "premium",      badge: "👑 PRO",     color: "from-yellow-500/30 to-amber-500/20" },
];

const secondaryGroups = [
  {
    label: "Horóscopos",
    accent: "text-violet-300/80 border-violet-400/20 bg-violet-500/06",
    sections: ["semana", "mes", "transitos", "carta-natal"],
  },
  {
    label: "Lecturas",
    accent: "text-cyan-300/80 border-cyan-400/20 bg-cyan-500/06",
    sections: ["celta", "suenos", "mano", "runas", "cristales", "roast"],
  },
  {
    label: "Astrología",
    accent: "text-amber-300/80 border-amber-400/20 bg-amber-500/06",
    sections: ["numerologia", "nombre", "biorritmo", "maya"],
  },
  {
    label: "Mi espacio",
    accent: "text-lime-300/80 border-lime-400/20 bg-lime-500/06",
    sections: ["ranking", "logros", "rachas", "guardados", "favoritos", "historial"],
  },
];

export function DashboardLaunchpad() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="mt-4 sm:mt-6 space-y-6 sm:space-y-8">

      {/* ── Banner referidos + descarga ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
      >
        {/* Invita y gana gemas */}
        <Link
          href="/dashboard/perfil"
          className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-lime-300/20 bg-gradient-to-r from-lime-950/60 to-emerald-950/40 px-4 py-3.5 transition-all hover:border-lime-300/40 hover:from-lime-950/80 active:scale-95"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-300/15 border border-lime-300/25">
            <Gem className="h-5 w-5 text-lime-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-lime-200 leading-tight">Invita y gana gemas</p>
            <p className="mt-0.5 text-[11px] text-white/50 leading-snug">Comparte ZODI · +50 gemas por amigo</p>
          </div>
          <Share2 className="h-4 w-4 shrink-0 text-lime-300/60 group-hover:text-lime-300 transition-colors" />
          {/* Glow bg */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "radial-gradient(ellipse at left, rgba(184,255,23,0.06) 0%, transparent 70%)" }}
          />
        </Link>

        {/* Descarga la app */}
        <Link
          href="/dashboard/premium"
          className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-950/60 to-purple-950/40 px-4 py-3.5 transition-all hover:border-violet-400/40 active:scale-95"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-400/25">
            <Download className="h-5 w-5 text-violet-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-violet-200 leading-tight">Instala ZODI gratis</p>
            <p className="mt-0.5 text-[11px] text-white/50 leading-snug">Añade a tu pantalla de inicio · Sin app store</p>
          </div>
          <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-300">
            PWA
          </span>
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "radial-gradient(ellipse at left, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
          />
        </Link>
      </motion.div>

      {/* ── Sección principal — 8 cards destacadas ─────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-lime-200/65">Herramientas</p>
            <h2 className="text-base sm:text-xl lg:text-2xl font-black leading-tight">¿Qué quieres consultar hoy?</h2>
          </div>
          <Link href="/dashboard/premium" className="hidden rounded-xl border border-lime-300/25 px-3 py-2 text-xs font-black text-lime-200 transition hover:bg-lime-300/10 sm:inline">
            Ver planes ✦
          </Link>
        </div>

        {!mounted ? <FeaturedSkeleton /> : (
        <div className="grid gap-2.5 grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {featured.map(({ slug, badge, color }, index) => {
            const section = dashboardSections.find(s => s.slug === slug);
            if (!section) return null;
            const Icon = section.icon;

            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={`/dashboard/${slug}`}
                  className={`group relative flex min-h-[140px] sm:min-h-44 lg:min-h-52 flex-col overflow-hidden rounded-2xl border border-white/08 bg-gradient-to-br ${color} shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]`}
                >
                  <div className="absolute inset-0 opacity-30 transition-opacity duration-500 group-hover:opacity-50">
                    <Image
                      src={section.image}
                      alt={section.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="relative flex flex-1 flex-col p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-black/55 border border-white/12 shadow-lg">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <span className="rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] font-black uppercase tracking-wider text-white/90">
                        {badge}
                      </span>
                    </div>
                    <div className="mt-auto">
                      <p className="hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{section.kicker}</p>
                      <h3 className="text-xs sm:text-sm lg:text-base font-black leading-tight text-white line-clamp-2">{section.title}</h3>
                      <p className="mt-1 hidden sm:block text-[11px] leading-4 text-white/50 line-clamp-2">{section.description}</p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-lime-300/75 transition group-hover:text-lime-300">
                        <span>Abrir</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>

      {/* ── Secciones secundarias agrupadas ────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">Explorar</p>
            <h2 className="text-base sm:text-lg font-black leading-tight">Todas las herramientas</h2>
          </div>
        </div>

        {!mounted ? <SecondaryGroupSkeleton /> : secondaryGroups.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + gi * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.28em] ${group.accent.split(" ")[0]}`}>
              {group.label}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {group.sections.map((slug) => {
                const section = dashboardSections.find(s => s.slug === slug);
                if (!section) return null;
                const Icon = section.icon;
                return (
                  <Link
                    key={slug}
                    href={`/dashboard/${slug}`}
                    className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold text-white/70 transition-all hover:text-white hover:bg-white/[0.04] active:scale-95 ${group.accent.split(" ").slice(1).join(" ")}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-white/40 group-hover:text-white/70 transition-colors" />
                    <span className="truncate text-xs sm:text-sm">{section.title}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
}

