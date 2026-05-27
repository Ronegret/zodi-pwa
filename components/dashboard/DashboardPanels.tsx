"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, BookMarked, Heart, MessageCircle, Save, Sparkles, Swords } from "lucide-react";
import { feedPosts, tarotCards } from "@/lib/data";

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
      <Panel title="Mazo de tarot" kicker="Listo para deslizar">
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
          {tarotCards.map((card, index) => (
            <motion.div
              key={card}
              whileHover={{ rotate: index % 2 ? 2 : -2, y: -5 }}
              className="min-h-48 min-w-32 snap-center rounded-md border border-lime-300/20 bg-[linear-gradient(145deg,rgba(184,255,23,.16),rgba(155,77,255,.22),rgba(0,0,0,.76))] p-3 shadow-[0_0_20px_rgba(155,77,255,0.15)]"
            >
              <Swords className="h-5 w-5 text-lime-200" />
              <p className="mt-20 text-lg font-black leading-tight">{card}</p>
              <p className="mt-2 text-xs text-white/55">carta #{index + 1}</p>
            </motion.div>
          ))}
        </div>
      </Panel>

      <Panel title="Feed comunitario" kicker="Anónimo + zodiaco">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/08 bg-black/40 p-6 text-center transition hover:border-white/15">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-white/20" />
            <p className="text-base text-white/60">Aún no hay publicaciones reales en tu zona.</p>
            <p className="mt-2 text-sm text-white/40">Sé el primero en quejarte de tu mercurio retrógrado.</p>
          </div>
          {notice ? <p className="mt-3 rounded-xl border border-lime-300/20 bg-lime-300/10 p-3 text-sm font-medium text-lime-200">{notice}</p> : null}
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

function Panel({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <article className="glass-panel min-w-0 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="zodi-kicker mb-1.5">{kicker}</p>
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
        </div>
      </div>
      {children}
    </article>
  );
}

function TinyIcon({ icon: Icon, label, onClick }: { icon: typeof Heart; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} aria-label={label} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/05 text-white/60 transition hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-200">
      <Icon className="h-4 w-4" />
    </button>
  );
}
