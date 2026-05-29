"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { dashboardSections } from "@/lib/dashboard-sections";

const featured = ["horoscopo", "tarot", "oraculo", "compatibilidad", "numerologia", "chino", "comunidad", "premium"];

export function DashboardLaunchpad() {
  const modules = dashboardSections.filter((section) => featured.includes(section.slug));

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-lime-200/70">Tus herramientas del caos</p>
          <h2 className="text-2xl font-black">Elige tu veneno de hoy</h2>
        </div>
        <Link href="/dashboard/premium" className="hidden rounded-md border border-lime-300/25 px-3 py-2 text-xs font-black text-lime-200 sm:inline">
          Ver planes
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((module, index) => {
          const Icon = module.icon;
          return (
              <motion.div
              key={module.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.18) }}
            >
              <Link href={`/dashboard/${module.slug}`} className="glass-panel hover-bubble group block min-h-44 rounded-md p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-md bg-lime-300 text-black shadow-[0_0_15px_rgba(184,255,23,0.3)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase text-white/45">{module.kicker}</span>
                </div>
                <h3 className="mt-5 text-xl font-black">{module.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/60">{module.description}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
