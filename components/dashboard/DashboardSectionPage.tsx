"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommunityHub } from "@/components/dashboard/CommunityHub";
import { SectionSpecificUI } from "@/components/dashboard/SectionSpecificUI";
import { AmigosSectionUI } from "@/components/dashboard/AmigosSectionUI";
import { PremiumUI } from "@/components/dashboard/PremiumUI";
import { plans } from "@/lib/data";
import { getDashboardSection, type DashboardSection } from "@/lib/dashboard-sections";

// ── ZODI Explainer — panel "¿Qué es esto?" para nuevos usuarios ──────────────
function SectionExplainer({ section }: { section: DashboardSection }) {
  const [open, setOpen] = useState(false);
  if (!section.explainer) return null;

  return (
    <div className="rounded-2xl border border-violet-400/20 bg-violet-500/06 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/03"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base shrink-0">💬</span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300/70">
              ZODI te explica
            </p>
            <p className="text-xs font-bold text-white/60 truncate">
              ¿Para qué sirve {section.title.toLowerCase()}? · Toca para saber
            </p>
          </div>
        </div>
        <div className="shrink-0 text-white/30">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="explainer-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/06">
              <p className="text-sm leading-relaxed text-white/75">{section.explainer}</p>

              {section.concepts && section.concepts.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300/60">
                    Conceptos clave
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {section.concepts.map((c) => (
                      <div
                        key={c.term}
                        className="rounded-xl border border-white/07 bg-black/25 px-3 py-2.5"
                      >
                        <p className="text-xs font-black text-lime-200/90 leading-tight">{c.term}</p>
                        <p className="mt-0.5 text-[11px] text-white/55 leading-relaxed">{c.def}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Maps section slugs to atmospheric background images
const SECTION_BG: Record<string, string> = {
  horoscopo:     "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-de-frente.png",
  semana:        "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-en-trono-urbano.png",
  mes:           "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-medio-perfil.png",
  transitos:     "/zodi-art/oracle-frame-tall.png",
  tarot:         "/zodi-art/nuevas/2-Portada--Home/ZODI-con-cartas-flotando.png",
  celta:         "/zodi-art/nuevas/8-Tarot-ZODI/Imagen-general-tarot-ZODI.png",
  suenos:        "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-haciendo-silencio.png",
  runas:         "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Runas-vikingas.png",
  cristales:     "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Rituales-energeticos.png",
  mano:          "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Lectura-de-mano.png",
  roast:         "/zodi-art/nuevas/2-Portada--Home/ZODI-riendose-con-sarcasmo2.png",
  "carta-natal": "/zodi-art/nuevas/1-Identidad-principal-de-marca/ZODI-Full-Detail.png",
  numerologia:   "/zodi-art/nuevas/7-Numerologia/Fondo-numeros-misticos.png",
  nombre:        "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-senalando.png",
  compatibilidad:"/zodi-art/nuevas/3-Secciones-principales-de-la-web/Compatibilidad.png",
  amigos:        "/zodi-art/nuevas/1-Identidad-principal-de-marca/ZODI-sin-fondo.png",
  chino:         "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-chino.png",
  maya:          "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-destino-hoy.png",
  comunidad:     "/zodi-art/zodi-us-full.png",
  oraculo:       "/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-con-bola-de-cristal.png",
  biorritmo:     "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-energia-actual.png",
};

export function DashboardSectionPage({ sectionSlug }: { sectionSlug: string }) {
  const section = getDashboardSection(sectionSlug);
  const [selectedPlan, setSelectedPlan] = useState("Cosmos Pro");
  const Icon = section.icon;
  const sectionBg = SECTION_BG[sectionSlug];

  const showHero = section.slug !== "perfil";

  return (
    <div className="relative grid gap-5 page-enter">
      {/* Top back button — highly visible to prevent users from feeling stranded */}
      <div className="flex items-center">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-white/80 shadow-lg backdrop-blur-md transition hover:bg-white/10 hover:text-white">
          ← Volver al inicio
        </Link>
      </div>

      {/* Full-screen section background */}
      {sectionBg && (
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url('${sectionBg}')`, opacity: 0.08, transform: "translateZ(0)" }}
        />
      )}
      {showHero && (
        <section className="glass-panel neon-border grid rounded-2xl lg:grid-cols-[0.9fr_1.1fr] shadow-[0_0_40px_rgba(0,0,0,0.6)]" style={{ overflow: "clip" }}>
          <div className="relative min-h-72 sm:min-h-80 lg:min-h-96 bg-black/70">
            <Image
              src={section.image}
              alt={section.title}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-contain"
              priority
            />
            {/* Gradiente suave — no ocupa toda la imagen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:bg-gradient-to-r lg:from-black/60 lg:via-black/10 lg:to-transparent" />
          </div>
          <div className="relative p-6 sm:p-8 flex flex-col justify-center bg-black/20">
            <Link href="/dashboard" className="mb-6 inline-flex w-fit items-center text-sm font-bold text-lime-200/70 transition hover:text-lime-200 hover:-translate-x-1">
              ← Volver al dashboard
            </Link>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_20px_rgba(184,255,23,0.3)]">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-6 zodi-kicker">{section.kicker}</p>
            <h1 className="glitch mt-2 text-3xl font-black md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)", lineHeight: 1.1, paddingBottom: "0.15em" }}>{section.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">{section.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {section.chips.map((chip) => (
                <span key={chip} className="zodi-chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explainer "¿Qué es esto?" — para nuevos usuarios */}
      {section.slug !== "comunidad" && section.slug !== "premium" && (
        <SectionExplainer section={section} />
      )}

      {/* Section-specific interactive UI */}
      {section.slug === "comunidad" ? (
        <CommunityHub />
      ) : section.slug === "amigos" ? (
        <AmigosSectionUI />
      ) : (
        <SectionSpecificUI section={section} />
      )}

      {/* Tienda de gemas con Stripe — solo en sección premium */}
      {section.slug === "premium" && <PremiumUI />}

      {/* Plans grid — only for premium section */}
      {section.slug === "premium" && (
        <section className="mt-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`glass-panel hover-bubble rounded-2xl p-6 transition-all ${selectedPlan === plan.name ? "border-lime-300/50 bg-lime-300/05 shadow-[0_0_40px_rgba(184,255,23,0.15)] scale-[1.02]" : "hover:border-white/20"}`}
            >
              <p className="zodi-kicker">{plan.signal}</p>
              <h3 className="mt-2 text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>{plan.name}</h3>
              <p className="mt-5 text-5xl font-black text-lime-100 drop-shadow-[0_0_12px_rgba(184,255,23,0.5)]">{plan.price}</p>
              <div className="mt-6 grid gap-2.5">
                {plan.perks.map((perk) => (
                  <span key={perk} className="rounded-xl border border-white/08 bg-black/40 p-3 text-sm text-white/75">{perk}</span>
                ))}
              </div>
              <button
                onClick={() => setSelectedPlan(plan.name)}
                className={`mt-6 w-full rounded-xl px-4 py-3.5 font-black transition ${
                  selectedPlan === plan.name 
                    ? "bg-lime-300 text-black shadow-[0_0_20px_rgba(184,255,23,0.4)]"
                    : "border border-lime-300/30 text-lime-200 hover:bg-lime-300/10"
                }`}
              >
                {selectedPlan === plan.name ? "Plan seleccionado" : "Elegir plan"}
              </button>
            </article>
          ))}
        </section>
      )}

    </div>
  );
}
