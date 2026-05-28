"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RadioTower, Sparkles, Gem, Flame } from "lucide-react";
import { getTodaysAstralContext } from "@/lib/astral";
import { getSessionProfile } from "@/lib/session";
import { getXpData, getStreak, getLevel, xpToNextLevel, getGems, getLevelTitle } from "@/lib/gamification";
import type { UserProfile } from "@/types/zodi";

type AstralCtx = ReturnType<typeof getTodaysAstralContext>;

function getDailySignals(ctx: AstralCtx, sign?: string): string[] {
  const moonName = ctx.moonPhase.replace(/\p{Emoji}/gu, "").trim();

  const moonMsgs: Record<string, string> = {
    "Luna Nueva":       "Energia de inicio. Planta intenciones, no decisiones impulsivas.",
    "Luna Creciente":   "La energia crece. Ahora lo que empieces tiene mas impulso.",
    "Cuarto Creciente": "Momento de accion o revision. No sigas si algo no cuadra.",
    "Gibosa Creciente": "Casi listo. Refina lo que ya esta en marcha.",
    "Luna Llena":       "Claridad maxima. Lo que no has querido ver, hoy lo ves.",
    "Gibosa Menguante": "Suelta lo que ya cumplio su funcion. El espacio libre es poder.",
    "Cuarto Menguante": "Corta lo que drena. Esta semana toca limpiar.",
    "Luna Menguante":   "Recarga interior. No toda quietud es retroceso.",
  };

  const vibMsgs: Record<number, string> = {
    1:  "Dia 1: actua primero, analiza despues.",
    2:  "Dia 2: escucha el doble de lo que hablas.",
    3:  "Dia 3: creatividad alta. Una idea aplicada hoy vale diez guardadas.",
    4:  "Dia 4: estructura primero. Los atajos de hoy cuestan mas tarde.",
    5:  "Dia 5: cambio en movimiento. Resiste o aprovecha, pero no ignores.",
    6:  "Dia 6: tus vinculos piden atencion. La conversacion dificil puede ser la buena.",
    7:  "Dia 7: introspection activa. La respuesta que buscas ya la tienes.",
    8:  "Dia 8: lo que gestionas hoy tiene retorno multiplicado.",
    9:  "Dia 9: cierra algo. Cada final libera energia para lo que viene.",
    11: "Dia 11: intuicion en maximos. No ignores las señales silenciosas.",
    22: "Dia 22 maestro: potencial real si actuas con intencion clara.",
    33: "Dia 33 maestro: tu acto mas pequeno hoy tiene eco largo.",
  };

  const transitMsg = sign
    ? (sign === ctx.sunTransit
        ? `Sol en ${ctx.sunTransit}: es tu temporada astral. Mas visibilidad, mas presion.`
        : `Sol en ${ctx.sunTransit}. No es tu temporada, pero la temporada igual te afecta.`)
    : `Sol en ${ctx.sunTransit}. Transito que marca el ritmo colectivo esta semana.`;

  return [
    moonMsgs[moonName] ?? `${ctx.moonPhase}: revisa tu energia antes de tomar decisiones.`,
    vibMsgs[ctx.dayVibration] ?? `Vibracion ${ctx.dayVibration} hoy. Consulta para saber que significa.`,
    transitMsg,
  ];
}

// ── Skeleton shimmer for unloaded values ──────────────────────────────────────
function Shimmer({ w = "w-24" }: { w?: string }) {
  return <span className={`inline-block ${w} h-4 animate-pulse rounded bg-white/10`} />;
}

export function HeroConsole() {
  const ctx = getTodaysAstralContext();

  // All state starts null/zero — populated in a single useEffect to avoid
  // the "demo profile flash" (showing fake data before real data loads).
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [xpState, setXpState] = useState({
    level: 1, xpCurrent: 0, xpNeeded: 200, xpPercent: 0, streak: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sessionProfile = getSessionProfile();
    const xpData = getXpData();
    const streakData = getStreak();
    const gemsData = getGems();
    const totalXp = xpData.total;
    const lvl = getLevel(totalXp);
    const { current, needed, percent } = xpToNextLevel(totalXp);

    setProfile(sessionProfile);
    setXpState({ level: lvl, xpCurrent: current, xpNeeded: needed, xpPercent: percent, streak: streakData.count });
    setMounted(true);
  }, []);

  const firstName = profile?.displayName?.split(" ")[0] ?? "";
  const avatar = profile?.avatar ?? "/icons/icon-192.png";
  const dailySignals = getDailySignals(ctx, profile?.zodiac ?? undefined);
  const { level, xpCurrent, xpNeeded, xpPercent, streak } = xpState;
  const levelTitle = getLevelTitle(level);
  const gems = mounted ? getGems().total : 0;

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left panel */}
      <div className="glass-panel neon-border overflow-hidden rounded-2xl p-4 sm:p-7 relative">
        {/* Higgsfield video background */}
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-[0.15] -z-10 rounded-2xl mix-blend-screen"
          autoPlay muted loop playsInline
        >
          <source src="/zodi-art/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent -z-10 rounded-2xl" />
        
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <p className="zodi-kicker mb-3">ZODI / Panel astral</p>
            {!mounted ? (
              <div className="mt-3 space-y-2">
                <Shimmer w="w-48" />
                <Shimmer w="w-64" />
              </div>
            ) : firstName ? (
              <h1 className="glitch mt-3 max-w-2xl text-4xl font-black leading-none sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
                Hola, {firstName}.<br />
                <span className="text-lime-300">{profile?.zodiac ?? "Tu signo"}</span>{" "}
                tiene mucho que decirte.
              </h1>
            ) : (
              <h1 className="glitch mt-3 max-w-2xl text-4xl font-black leading-none sm:text-6xl" style={{ fontFamily: "var(--font-display)" }}>
                Tu mapa astral, tus lecturas y tu energia en un solo lugar.
              </h1>
            )}
            <p className="mt-4 text-sm text-white/55">
              {ctx.moonPhase} &nbsp;·&nbsp; Sol en {ctx.sunTransit} &nbsp;·&nbsp; Vibracion {ctx.dayVibration}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Image 
              src="/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-modo-intenso.png" 
              alt="ZODI Intenso" 
              width={160} 
              height={160} 
              className="object-contain drop-shadow-[0_0_15px_rgba(184,255,23,0.2)]" 
            />
          </div>
        </div>

        {/* Daily signal cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {dailySignals.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
              className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/80 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              {line}
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard/horoscopo" className="zodi-chip zodi-chip-active">
            Lectura del dia
          </Link>
          <Link href="/dashboard/tarot" className="zodi-chip hover:border-violet-400/30">
            Tirada rapida
          </Link>
          <Link href="/dashboard/oraculo" className="zodi-chip">
            Consulta libre
          </Link>
        </div>
      </div>

      {/* Right panel — profile card */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <Image
          src="/zodi-logo-mark.png"
          alt="ZODI sigil"
          width={380}
          height={380}
          className="absolute -right-20 -bottom-20 h-64 w-64 opacity-10 mix-blend-screen"
          priority
        />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-lime-300/40 shrink-0">
                {!mounted ? (
                  <div className="h-full w-full bg-white/10 animate-pulse" />
                ) : avatar.startsWith("data:") ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <Image src={avatar} alt="Avatar" fill className="object-cover" />
                )}
              </div>
              <div>
                <p className="zodi-kicker">Perfil activo</p>
                <h2 className="mt-1 text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                  {mounted ? (profile?.displayName ?? "—") : <Shimmer w="w-32" />}
                </h2>
                {mounted && (
                  <p className="text-[11px] uppercase tracking-widest text-lime-200 mt-1" style={{ fontFamily: "var(--font-mono)" }}>
                    {levelTitle}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1">
                <Gem className="h-3.5 w-3.5 text-lime-300" />
                <span className="text-sm font-bold text-lime-200" style={{ fontFamily: "var(--font-mono)" }}>
                  {mounted ? gems : 0}
                </span>
              </div>
              {streak > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-sm font-bold text-orange-200" style={{ fontFamily: "var(--font-mono)" }}>
                    {streak}d
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="Signo"  value={mounted ? (profile?.zodiac    ?? "—") : "—"} />
            <Metric label="Luna"   value={mounted ? (profile?.moonSign  ?? "—") : "—"} />
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-white/60">
              <span className="font-bold text-white/80">Nivel {level}</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{xpCurrent} / {xpNeeded} XP</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/60 border border-white/10 p-0.5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 shadow-[inset_0_0_20px_rgba(155,77,255,0.05)]">
            <RadioTower className="h-6 w-6 shrink-0 text-violet-300" />
            <span className="text-sm font-medium text-white/85 leading-snug">
              Júpiter en {ctx.jupiterSign} · Saturno en {ctx.saturnSign}
            </span>
          </div>
          <Link href="/dashboard/perfil" className="mt-5 block text-center text-[11px] font-bold uppercase tracking-widest text-white/40 transition hover:text-lime-200/80">
            Configurar perfil
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/08 bg-black/40 p-3.5 shadow-inner">
      <p className="zodi-kicker mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
