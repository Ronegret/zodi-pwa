"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, BookMarked, MessageCircle, Sparkles } from "lucide-react";
import { feedPosts } from "@/lib/data";

const TAROT_DECK = [
  { name: "La Red Flag",        img: "/zodi-art/nuevas/8-Tarot-ZODI/La-Red-Flag.png" },
  { name: "El Karma",           img: "/zodi-art/nuevas/8-Tarot-ZODI/El-Karma.png" },
  { name: "La Verdad",          img: "/zodi-art/nuevas/8-Tarot-ZODI/La-Verdad.png" },
  { name: "El Destino",         img: "/zodi-art/nuevas/8-Tarot-ZODI/El-Destino.png" },
  { name: "El Ego",             img: "/zodi-art/nuevas/8-Tarot-ZODI/El-Ego.png" },
  { name: "La Mala Idea",       img: "/zodi-art/nuevas/8-Tarot-ZODI/La-Mala-Idea.png" },
  { name: "La Venganza Cósmica",img: "/zodi-art/nuevas/8-Tarot-ZODI/La-Venganza-Cosmica.png" },
];

export function DashboardPanels() {
  const [notice, setNotice] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zodi.readings");
      if (raw) setSavedCount(JSON.parse(raw).length);
    } catch { /* ignore */ }
  }, []);

  return (
    <section className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[1fr_0.85fr_0.85fr]">
      <Panel title="Mazo de tarot" kicker="Toca una carta · Destino al azar" action={{ label: "Tirada completa →", href: "/dashboard/tarot" }}>
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
          {TAROT_DECK.map((card, index) => (
            <motion.div
              key={card.name}
              whileHover={{ rotate: index % 2 ? 3 : -3, y: -8, scale: 1.04 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="shrink-0 snap-center"
            >
              <Link href="/dashboard/tarot" className="group relative block w-28 overflow-hidden rounded-xl border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:border-lime-300/50 hover:shadow-[0_8px_30px_rgba(184,255,23,0.2)] transition-all duration-300">
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <Image src={card.img} alt={card.name} fill sizes="112px"
                    className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-2 text-center">
                    <p className="text-[10px] font-black leading-tight text-lime-300 drop-shadow-lg">{card.name}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Panel>

      <Panel title="Comunidad" kicker="Tu signo · Tu gente" action={{ label: "Ver todo →", href: "/dashboard/comunidad" }}>
        {/* Grid de signos del zodiaco */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {[
            { sign: "Aries", img: "/zodi-art/signos/aries.png" },
            { sign: "Tauro", img: "/zodi-art/signos/tauro.png" },
            { sign: "Géminis", img: "/zodi-art/signos/geminis.png" },
            { sign: "Cáncer", img: "/zodi-art/signos/cancer.png" },
            { sign: "Leo", img: "/zodi-art/signos/leo.png" },
            { sign: "Virgo", img: "/zodi-art/signos/virgo.png" },
            { sign: "Libra", img: "/zodi-art/signos/libra.png" },
            { sign: "Escorpio", img: "/zodi-art/signos/escorpio.png" },
            { sign: "Sagitario", img: "/zodi-art/signos/sagitario.png" },
            { sign: "Capricornio", img: "/zodi-art/signos/capricornio.png" },
            { sign: "Acuario", img: "/zodi-art/signos/acuario.png" },
            { sign: "Piscis", img: "/zodi-art/signos/piscis.png" },
          ].map(({ sign, img }) => (
            <Link key={sign} href="/dashboard/comunidad" title={sign}
              className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 transition hover:border-lime-300/50 hover:scale-105">
              <Image src={img} alt={sign} fill sizes="48px" className="object-cover opacity-80 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </div>
        <div className="rounded-xl border border-white/08 bg-black/40 p-3 text-center">
          <MessageCircle className="mx-auto mb-1.5 h-5 w-5 text-white/20" />
          <p className="text-xs text-white/50">Sé el primero en quejarte del mercurio retrógrado.</p>
        </div>
      </Panel>

      <Panel title="Logros" kicker="Recompensas diarias">
        <div className="grid gap-3">
          {/* Lecturas guardadas — dato real */}
          {savedCount > 0 && (
            <Link href="/dashboard/historial" className="flex items-center gap-3 rounded-xl border border-lime-300/30 bg-lime-300/10 p-4 transition hover:bg-lime-300/20">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lime-300 text-black shadow-[0_0_15px_rgba(184,255,23,0.3)]">
                <BookMarked className="h-6 w-6" />
              </div>
              <div>
                <p className="font-black text-lime-100">Archivista activo</p>
                <p className="text-xs text-lime-200/60 mt-1">{savedCount} lectura{savedCount !== 1 ? "s" : ""} guardada{savedCount !== 1 ? "s" : ""} — ver historial</p>
              </div>
            </Link>
          )}
          {["Racha de 9 dias", "Sobrevivio al roast", "Caos de compatibilidad", "Archivista del tarot"].map((achievement, index) => (
            <div key={achievement} className="flex items-center gap-3 rounded-xl border border-white/08 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.05]">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 shrink-0">
                {index % 2 ? <Sparkles className="h-6 w-6" /> : <Award className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-base font-bold text-white/80">{achievement}</p>
                <p className="text-xs font-mono text-lime-200/50 mt-0.5">+{(index + 1) * 120} XP — pendiente</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function Panel({ title, kicker, children, action }: { title: string; kicker: string; children: React.ReactNode; action?: { label: string; href: string } }) {
  return (
    <article className="glass-panel min-w-0 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="mb-4 sm:mb-5 flex items-center justify-between gap-2">
        <div>
          <p className="zodi-kicker mb-1 sm:mb-1.5">{kicker}</p>
          <h2 className="text-xl sm:text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        </div>
        {action && (
          <Link href={action.href} className="shrink-0 text-[11px] font-black text-lime-300/70 hover:text-lime-300 transition">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </article>
  );
}

function TinyIcon({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/05 text-white/60 transition hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-200">
      <Icon className="h-4 w-4" />
    </button>
  );
}
