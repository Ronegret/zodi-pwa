"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { featureModules } from "@/lib/data";

const statusStyles = {
  live: "border-lime-300/35 text-lime-200",
  ai: "border-purple-300/35 text-purple-200",
  premium: "border-yellow-300/35 text-yellow-200",
  social: "border-cyan-300/35 text-cyan-200"
};

const statusLabels = {
  live: "incluido",
  ai: "oráculo",
  premium: "premium",
  social: "social"
};

export function FeatureGrid() {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-lime-200/70">Consultas</p>
          <h2 className="text-2xl font-black">Todo lo que puedes abrir desde tu panel</h2>
        </div>
        <span className="hidden rounded-md border border-lime-300/25 px-3 py-2 text-xs text-lime-200 sm:inline">
          Lecturas personalizadas
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {featureModules.map((module, index) => (
          <motion.div
            key={`${module.slug}-${module.title}`}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(index * 0.015, 0.2) }}
            whileHover={{ y: -4 }}
            className="glass-panel group rounded-md p-4"
          >
            <Link href={`/dashboard/${module.slug}`} className="flex items-start gap-3">
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gradient-to-br ${module.accent} text-black shadow-[0_0_20px_rgba(184,255,23,0.12)]`}
              >
                <module.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black leading-tight">{module.title}</h3>
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] uppercase ${statusStyles[module.status]}`}
                  >
                    {statusLabels[module.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">{module.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
