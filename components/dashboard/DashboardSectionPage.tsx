"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CommunityHub } from "@/components/dashboard/CommunityHub";
import { SectionSpecificUI } from "@/components/dashboard/SectionSpecificUI";
import { plans } from "@/lib/data";
import { GemStore } from "@/components/dashboard/GemStore";
import { getDashboardSection } from "@/lib/dashboard-sections";

// Maps section slugs to atmospheric background images
const SECTION_BG: Record<string, string> = {
  horoscopo:    "/zodi-art/oracle-seated.png",
  semana:       "/zodi-art/oracle-seated.png",
  mes:          "/zodi-art/oracle-close.png",
  transitos:    "/zodi-art/oracle-frame-tall.png",
  tarot:        "/zodi-art/tarot-reader.png",
  celta:        "/zodi-art/tarot-truth.png",
  suenos:       "/zodi-art/sleeping-tarot.png",
  runas:        "/zodi-art/ritual-wide.png",
  cristales:    "/zodi-art/ritual-wide.png",
  mano:         "/zodi-art/oracle-close.png",
  roast:        "/zodi-art/poster-chaos.png",
  "carta-natal":"/zodi-art/zodi-character-full.png",
  numerologia:  "/zodi-art/numerologia/fondo-numeros-misticos.png",
  nombre:       "/zodi-art/zodi-us.png",
  compatibilidad:"/zodi-art/zodi-us-full.png",
  amigos:       "/zodi-art/zodi-us-full.png",
  chino:        "/zodi-art/chino/chino2.png",
  maya:         "/zodi-art/ritual-wide.png",
  comunidad:    "/zodi-art/zodi-us-full.png",
  oraculo:      "/zodi-art/oracle-frame-tall.png",
};

export function DashboardSectionPage({ sectionSlug }: { sectionSlug: string }) {
  const section = getDashboardSection(sectionSlug);
  const [selectedPlan, setSelectedPlan] = useState("Cosmos Pro");
  const Icon = section.icon;
  const sectionBg = SECTION_BG[sectionSlug];

  // Hero banner — shared across all sections (hidden for perfil which has its own layout)
  const showHero = section.slug !== "perfil";

  return (
    <div className="relative grid gap-5">
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
        <section className="glass-panel neon-border grid overflow-hidden rounded-2xl lg:grid-cols-[0.9fr_1.1fr] shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <div className="relative min-h-48 bg-black p-4 lg:min-h-80">
            <Image
              src={section.image}
              alt={section.title}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-contain opacity-80 mix-blend-screen"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-black/40 to-transparent lg:bg-gradient-to-r" />
          </div>
          <div className="relative p-6 sm:p-8 flex flex-col justify-center bg-black/20">
            <Link href="/dashboard" className="mb-6 inline-flex w-fit items-center text-sm font-bold text-lime-200/70 transition hover:text-lime-200 hover:-translate-x-1">
              ← Volver al dashboard
            </Link>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_20px_rgba(184,255,23,0.3)]">
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-6 zodi-kicker">{section.kicker}</p>
            <h1 className="glitch mt-2 text-3xl font-black leading-tight md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-display)" }}>{section.title}</h1>
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

      {/* Section-specific interactive UI */}
      {section.slug === "comunidad" ? (
        <CommunityHub />
      ) : (
        <SectionSpecificUI section={section} />
      )}

      {/* Plans grid — only for premium section */}
      {section.slug === "premium" && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      {/* Gem Store — only for premium section */}
      {section.slug === "premium" && (
        <GemStore />
      )}
    </div>
  );
}
