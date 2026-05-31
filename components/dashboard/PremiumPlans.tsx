"use client";

import { motion } from "framer-motion";
import { plans } from "@/lib/data";

const PLAN_META = [
  {
    emoji: "🌑",
    color: "border-white/10",
    btnClass: "border border-white/15 text-white/60 hover:border-white/30 hover:text-white",
    btnLabel: "Comenzar gratis",
    featured: false,
    badge: null,
  },
  {
    emoji: "⚡",
    color: "border-lime-300/35 shadow-[0_0_30px_rgba(184,255,23,0.07)]",
    btnClass: "bg-lime-300 text-black hover:bg-lime-200 shadow-[0_0_14px_rgba(184,255,23,0.3)]",
    btnLabel: "Elegir Pro →",
    featured: true,
    badge: { label: "Más popular", cls: "bg-lime-300 text-black" },
  },
  {
    emoji: "🌟",
    color: "border-violet-400/30",
    btnClass: "border border-violet-400/40 text-violet-200 hover:bg-violet-500/10",
    btnLabel: "Elegir anual →",
    featured: false,
    badge: { label: "Ahorra 33%", cls: "bg-violet-500 text-white" },
  },
  {
    emoji: "👑",
    color: "border-yellow-400/35 shadow-[0_0_30px_rgba(245,200,66,0.07)]",
    btnClass: "bg-yellow-300 text-black hover:bg-yellow-200 shadow-[0_0_14px_rgba(245,200,66,0.3)]",
    btnLabel: "Reclamar acceso eterno",
    featured: true,
    badge: { label: "Edición limitada", cls: "bg-yellow-300 text-black" },
  },
];

export function PremiumPlans() {
  return (
    <section className="mt-8 sm:mt-10">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-yellow-200/70">Planes</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-black leading-tight">
            Más lecturas cuando quieras profundizar
          </h2>
        </div>
        <p className="text-xs text-white/35 shrink-0">Sin permanencia · Cancela cuando quieras</p>
      </div>

      {/* Grid 2×2: 1 col mobile → 2 col sm+ */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {plans.map((plan, i) => {
          const meta = PLAN_META[i];
          return (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative glass-panel rounded-2xl border p-5 sm:p-6 flex flex-col ${meta.color} transition-all duration-300`}
            >
              {/* Badge */}
              {meta.badge && (
                <div className={`absolute -top-3 left-5 rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${meta.badge.cls}`}>
                  {meta.badge.label}
                </div>
              )}

              {/* Head */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">{plan.signal}</p>
                  <h3 className="mt-0.5 text-xl font-black leading-tight">{plan.name}</h3>
                </div>
                <span className="text-3xl" aria-hidden>{meta.emoji}</span>
              </div>

              {/* Price */}
              <p className="mt-3 mb-4 text-4xl font-black graffiti leading-none">{plan.price}</p>

              {/* Perks */}
              <ul className="flex-1 space-y-2">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2.5 text-sm text-white/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-300/50 shrink-0" aria-hidden />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`mt-5 w-full rounded-xl py-3 text-sm font-black transition-all active:scale-95 ${meta.btnClass}`}
              >
                {meta.btnLabel}
              </button>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
