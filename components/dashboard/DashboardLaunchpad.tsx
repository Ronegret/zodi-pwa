"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { dashboardSections } from "@/lib/dashboard-sections";

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

export function DashboardLaunchpad() {
  return (
    <section className="mt-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-lime-200/70">Tus herramientas del caos</p>
          <h2 className="text-2xl font-black">¿Qué destino quieres tentar hoy?</h2>
        </div>
        <Link href="/dashboard/premium" className="hidden rounded-xl border border-lime-300/25 px-3 py-2 text-xs font-black text-lime-200 transition hover:bg-lime-300/10 sm:inline">
          Ver planes ✦
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {featured.map(({ slug, badge, color }, index) => {
          const section = dashboardSections.find(s => s.slug === slug);
          if (!section) return null;
          const Icon = section.icon;

          return (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={`/dashboard/${slug}`}
                className={`group relative flex min-h-52 flex-col overflow-hidden rounded-2xl border border-white/08 bg-gradient-to-br ${color} shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)]`}
              >
                {/* Background section image */}
                <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-35">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover object-center"
                  />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative flex flex-1 flex-col p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/50 border border-white/15 backdrop-blur-sm shadow-lg">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white/90 backdrop-blur-sm">
                      {badge}
                    </span>
                  </div>

                  {/* Text — pushed to bottom */}
                  <div className="mt-auto">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">{section.kicker}</p>
                    <h3 className="mt-1 text-xl font-black leading-tight text-white">{section.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/60">{section.description}</p>

                    {/* CTA row */}
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-lime-300/80 transition group-hover:text-lime-300">
                      <span>Consultar</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
