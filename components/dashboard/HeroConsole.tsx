"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RadioTower, Sparkles, Gem, Flame, Zap, ArrowRight } from "lucide-react";
import { getTodaysAstralContext } from "@/lib/astral";
import { getSessionProfile, getLocalSession } from "@/lib/session";
import { getXpData, getStreak, getLevel, xpToNextLevel, getGems, getLevelTitle } from "@/lib/gamification";
import type { UserProfile } from "@/types/zodi";

type AstralCtx = ReturnType<typeof getTodaysAstralContext>;

// ── Frases diarias por signo — rotan cada día con personalidad ZODI ────────────
const SIGN_PHRASES: Record<string, string[]> = {
  Aries:       ["No te pida permiso el cosmos. Muévete tú primero.",       "Tu energía hoy no admite espera. O la usas o la pierdes.",       "El fuego está activo. Apunta antes de lanzar.",                   "Hoy tienes ventaja. No la desperdicies siendo educado.",         "Impulso sin dirección es solo ruido. Enfoca."],
  Tauro:       ["Lento y concreto gana. Lo apresurado hoy cuesta el doble.","Tu intuición sobre el dinero hoy está afinada. Escúchala.",       "Venus te cuida, pero no toma las decisiones por ti.",             "La paciencia no es rendirse. Hoy eso importa.",                  "Lo que construyes con calma dura. Lo de hoy puede ser de esos."],
  Géminis:     ["Dos opciones, dos voces. Hoy escoge una y actúa.",          "La mente acelerada es tu poder y tu trampa. Úsala bien hoy.",     "Comunicación en modo máximo. Di lo que realmente piensas.",       "Mercurio activo. Tus palabras hoy tienen más peso del habitual.", "Eres el más adaptable de todos. Hoy eso vale oro."],
  Cáncer:      ["Tu instinto no miente. Confía en lo que sientes sin explicarlo.", "El hogar emocional primero. El resto puede esperar.",             "Luna te mueve. Hoy es día de sentir, no solo de hacer.",          "Lo que cuidas con amor siempre vuelve.",                          "Intuición al 100%. No la ignores por miedo a parecer sensible."],
  Leo:         ["Hoy el escenario es tuyo. No llegues tarde a tu propio show.", "El sol en ti brilla cuando actúas desde la autenticidad.",        "Energía de liderazgo alta. Úsala para elevar, no para demostrar.","Tu presencia ya es poder. No necesitas probarlo.",                "La generosidad de Leo hoy tiene retorno multiplicado."],
  Virgo:       ["El detalle que nadie ve es el que tú ya notaste. Actúa.",    "La perfección es enemiga del progreso. Hoy, entrega.",            "Tu análisis es preciso hoy. No sobre-pienses lo que ya sabes.",   "Mercurio afilado. Una solución que llevas semanas buscando llega.", "La crítica más útil es la que ya tienes en mente."],
  Libra:       ["La indecisión tiene fecha de caducidad. Hoy es el día.",     "Equilibrar no significa complacer. Recuerda la diferencia.",       "Venus te da carisma extra hoy. Úsalo para lo que importa.",       "La justicia que buscas en otros empieza en ti.",                  "Armonía no es ausencia de conflicto. Es gestión inteligente."],
  Escorpio:    ["Lo que no has querido ver, hoy lo ves. Prepárate.",          "Tu radar emocional está en modo experto. Fíate.",                 "La intensidad es tu idioma. Hoy habla sin filtros.",              "Lo que transformas no vuelve. Asegúrate de que vale.",            "El poder que no usas se vuelve en tu contra. Hora de actuar."],
  Sagitario:   ["La aventura sin propósito es solo movimiento. Apunta lejos.","Tu optimismo hoy no es ingenuidad. Es visión. Expándela.",         "Júpiter activo. Las oportunidades llegan a quien está en marcha.","La verdad incómoda dicha hoy vale más que mil verdades cómodas.", "No hay mapa perfecto. Sal igual."],
  Capricornio: ["La constancia hoy da frutos que el impulso no da.",          "Tu estructura mental es tu activo más valioso. Úsala.",           "Saturno te respalda cuando actúas con intención.",                "Lo que construyes en silencio impresiona en voz alta más tarde.", "Hoy no es día de atajos. Pero el camino largo tiene recompensa."],
  Acuario:     ["La idea que tienes desde hace semanas merece luz hoy.",       "Tu visión del futuro es correcta. El timing es lo que falta.",    "Urano activo. Los cambios raros de hoy tienen sentido mañana.",   "Diferente no es equivocado. Es pionero.",                         "La distancia emocional que sientes es información. Procésala."],
  Piscis:      ["Tu intuición hoy supera a cualquier análisis. Confía.",       "Lo que sueñas en modo despierto suele ser la respuesta real.",    "Neptuno activo. Las señales que ignoras hoy vuelven amplificadas.","La empatía es poder cuando tiene dirección.",                     "Fluir no es rendirse. Hoy distingue ambas cosas."],
};

// ── Modificadores por fase lunar ──────────────────────────────────────────────
const MOON_SUFFIX: Record<string, string> = {
  "Luna Nueva":       "Ciclo en cero. Lo que plantas hoy crece.",
  "Luna Creciente":   "Energía en aumento. Apóyate en eso.",
  "Cuarto Creciente": "Momento de ajuste o acción. Elige.",
  "Gibosa Creciente": "Casi en el pico. Refina, no abandones.",
  "Luna Llena":       "Claridad máxima. Lo que ves hoy, es real.",
  "Gibosa Menguante": "Suelta lo que pesa. El espacio libre es poder.",
  "Cuarto Menguante": "Cierra ciclos. Libera energía para lo nuevo.",
  "Luna Menguante":   "Modo recarga. La quietud ahora es inversión.",
};

// ── Energy score para el signo hoy (determinístico por fecha) ─────────────────
function getSignEnergyToday(sign: string, ctx: AstralCtx): number {
  const isSunSeason = ctx.sunTransit === sign;
  const moonName = ctx.moonPhase.replace(/\p{Emoji}/gu, "").trim();
  const isHighMoon = ["Luna Llena", "Gibosa Creciente", "Luna Creciente"].includes(moonName);
  const isFireSign = ["Aries", "Leo", "Sagitario"].includes(sign);
  const isEarthSign = ["Tauro", "Virgo", "Capricornio"].includes(sign);

  let score = 62;
  if (isSunSeason) score += 15;
  if (isHighMoon) score += 8;
  if (ctx.dayVibration === 1 || ctx.dayVibration === 8) score += 7;
  if (ctx.dayVibration === 7) score += 5;
  // Deterministic jitter por día del año
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  score += ((dayOfYear * 7 + sign.charCodeAt(0)) % 13);
  if (isFireSign && isHighMoon) score += 3;
  if (isEarthSign && !isHighMoon) score += 2;

  return Math.min(99, Math.max(58, score));
}

// ── Frase diaria personalizada ─────────────────────────────────────────────────
function getDailyPhrase(
  sign: string,
  ctx: AstralCtx,
  tone: string
): { phrase: string; moonLine: string } {
  const phrases = SIGN_PHRASES[sign] ?? SIGN_PHRASES["Aries"];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const moonName = ctx.moonPhase.replace(/\p{Emoji}/gu, "").trim();
  const moonLine = MOON_SUFFIX[moonName] ?? `${ctx.moonPhase} · Energía en movimiento.`;

  let phrase = phrases[dayOfYear % phrases.length];

  // Adaptar tono si es brutal o sarcástico — añadir coda
  if (tone === "brutal" || tone === "sarcastico") {
    const codas = [
      " Y eso no es opcional.",
      " Sin excusas.",
      " Punto.",
      " El cosmos no negocia.",
      " Tómalo o déjalo.",
    ];
    phrase += codas[dayOfYear % codas.length];
  }

  return { phrase, moonLine };
}

// ── Saludo según hora del día ─────────────────────────────────────────────────
function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "Madrugada de señales";
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  if (h < 22) return "Buenas noches";
  return "Ya es tarde";
}

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function Shimmer({ w = "w-24" }: { w?: string }) {
  return <span className={`inline-block ${w} h-5 animate-pulse rounded-md bg-white/10`} />;
}

// ── Energy bar color ──────────────────────────────────────────────────────────
function energyColor(score: number): string {
  if (score >= 88) return "from-lime-300 to-emerald-400";
  if (score >= 75) return "from-cyan-300 to-lime-300";
  if (score >= 65) return "from-violet-400 to-cyan-300";
  return "from-orange-400 to-yellow-300";
}

// ─────────────────────────────────────────────────────────────────────────────
// CRYSTAL BALL BG — reemplaza el video; solo transform:rotate (sin repaints)
// ─────────────────────────────────────────────────────────────────────────────
function CrystalBallBg() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden rounded-2xl flex items-center justify-center pointer-events-none select-none"
      aria-hidden
    >
      {/* Gradiente base oscuro-violeta */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-black/60 to-lime-950/20" />

      {/* Halo central — glow radial estático */}
      <div
        className="absolute h-56 w-56 sm:h-80 sm:w-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(155,77,255,0.12) 0%, rgba(184,255,23,0.06) 45%, transparent 70%)",
          filter: "blur(4px)",
        }}
      />

      {/* ── Anillo exterior — sentido horario ─────────────────────────── */}
      <motion.div
        className="absolute h-56 w-56 sm:h-80 sm:w-80"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
      >
        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
          <circle
            cx="100" cy="100" r="97"
            stroke="rgba(184,255,23,0.18)" strokeWidth="1"
            strokeDasharray="2 14" strokeLinecap="round"
          />
        </svg>
        {/* Punto neon girando */}
        <div
          className="absolute top-0.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-lime-300"
          style={{ boxShadow: "0 0 10px 4px rgba(184,255,23,0.8), 0 0 20px 8px rgba(184,255,23,0.3)" }}
        />
      </motion.div>

      {/* ── Anillo medio — sentido antihorario ────────────────────────── */}
      <motion.div
        className="absolute h-40 w-40 sm:h-56 sm:w-56"
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
      >
        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="97" stroke="rgba(51,247,255,0.12)" strokeWidth="0.8" />
        </svg>
        <div
          className="absolute top-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-cyan-300"
          style={{ boxShadow: "0 0 8px 3px rgba(51,247,255,0.8), 0 0 16px 6px rgba(51,247,255,0.25)" }}
        />
      </motion.div>

      {/* ── Anillo interior — violeta, inclinado ──────────────────────── */}
      <motion.div
        className="absolute h-28 w-28 sm:h-40 sm:w-40"
        animate={{ rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform", transform: "rotateX(60deg)" }}
      >
        <svg className="w-full h-full" viewBox="0 0 200 200" fill="none">
          <ellipse cx="100" cy="100" rx="97" ry="50" stroke="rgba(155,77,255,0.15)" strokeWidth="1" strokeDasharray="6 10" />
        </svg>
      </motion.div>

      {/* ── Logo ZODI — aparece una vez, se mantiene ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.22, scale: 1 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="absolute"
      >
        <Image
          src="/zodi-art/brand/isotipo.png"
          alt=""
          width={110}
          height={110}
          className="mix-blend-screen"
          priority
          draggable={false}
        />
      </motion.div>

      {/* ── Pulso interior — halo que respira ────────────────────────── */}
      <motion.div
        className="absolute h-20 w-20 sm:h-28 sm:w-28 rounded-full"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, rgba(155,77,255,0.2) 0%, transparent 70%)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function HeroConsole() {
  const ctx = getTodaysAstralContext();

  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [xpState, setXpState] = useState({
    level: 1, xpCurrent: 0, xpNeeded: 200, xpPercent: 0, streak: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [gems, setGems] = useState(0);

  useEffect(() => {
    const sessionProfile = getSessionProfile();
    const session = getLocalSession();
    const xpData = getXpData();
    const streakData = getStreak();
    const gemsData = getGems();
    const totalXp = xpData.total;
    const lvl = getLevel(totalXp);
    const { current, needed, percent } = xpToNextLevel(totalXp);

    // Si el perfil no tiene tono, leer del onboardingData
    const tone = session.onboardingData?.readingTone ?? "directo";
    const mergedProfile = sessionProfile
      ? { ...sessionProfile, readingTone: sessionProfile.readingTone ?? tone }
      : null;

    setProfile(mergedProfile);
    setGems(gemsData.total);
    setXpState({ level: lvl, xpCurrent: current, xpNeeded: needed, xpPercent: percent, streak: streakData.count });
    setMounted(true);
  }, []);

  const firstName  = profile?.displayName?.split(" ")[0] ?? "";
  const sign       = profile?.zodiac ?? "";
  const tone       = profile?.readingTone ?? "directo";
  const avatar     = profile?.avatar ?? "/icons/icon-192-v3.png";
  const { level, xpCurrent, xpNeeded, xpPercent, streak } = xpState;
  const levelTitle = getLevelTitle(level);

  const energyScore = mounted && sign ? getSignEnergyToday(sign, ctx) : 0;
  const { phrase, moonLine } = mounted && sign
    ? getDailyPhrase(sign, ctx, tone)
    : { phrase: "", moonLine: "" };

  const timeGreeting = getTimeGreeting();

  // Detectar si falta la fecha de nacimiento (dato clave para lecturas)
  const missingBirthDate = mounted && !profile?.birthDate && !getLocalSession().onboardingData?.birthDate;

  return (
    <section className="grid gap-4">
      {/* ── Banner: falta fecha de nacimiento ─────────────────────────────── */}
      {missingBirthDate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg shrink-0">⚠️</span>
            <div className="min-w-0">
              <p className="text-sm font-black text-orange-200 leading-tight">Falta tu fecha de nacimiento</p>
              <p className="text-[11px] text-orange-200/65 mt-0.5 truncate">Sin ella, tus lecturas son genéricas. Añádela para personalizar todo.</p>
            </div>
          </div>
          <Link
            href="/dashboard/perfil"
            className="shrink-0 rounded-lg bg-orange-400 px-3 py-2 text-xs font-black text-black hover:bg-orange-300 transition whitespace-nowrap"
          >
            Completar →
          </Link>
        </motion.div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
      {/* ── LEFT: Hero personalizado ─────────────────────────────────────── */}
      <div className="glass-panel neon-border overflow-hidden rounded-2xl relative">
        <CrystalBallBg />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent -z-10 rounded-2xl" />

        <div className="p-5 sm:p-7">
          {/* Kicker */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="zodi-kicker">{timeGreeting} · ZODI panel astral</p>
            {mounted && sign && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-lime-300 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-lime-200">
                  {sign} · {energyScore}% energía hoy
                </span>
              </motion.div>
            )}
          </div>

          {/* Main greeting */}
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {!mounted ? (
                <div className="space-y-3 mt-2">
                  <Shimmer w="w-56" />
                  <Shimmer w="w-72" />
                  <Shimmer w="w-48" />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {firstName && (
                    <h1
                      className="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {firstName},
                    </h1>
                  )}
                  {phrase ? (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.5 }}
                      className="mt-2 text-lg sm:text-xl font-bold leading-snug text-white/90 max-w-xl"
                    >
                      {phrase}
                    </motion.p>
                  ) : (
                    <p className="mt-2 text-lg sm:text-xl font-bold leading-snug text-white/90 max-w-xl">
                      Tu mapa astral, tus lecturas y tu energía en un solo lugar.
                    </p>
                  )}
                  {moonLine && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="mt-2 text-sm text-lime-200/70 font-medium"
                    >
                      {ctx.moonPhase} · {moonLine}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </div>

            {/* ZODI character */}
            <div className="hidden md:block shrink-0 -mt-2 -mr-2 sm:-mr-4">
              <Image
                src="/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-modo-intenso.png"
                alt="ZODI"
                width={160}
                height={200}
                className="object-contain drop-shadow-[0_0_24px_rgba(184,255,23,0.3)]"
              />
            </div>
          </div>

          {/* Energy bar for sign */}
          {mounted && sign && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="mt-5 origin-left"
            >
              <div className="flex items-center justify-between mb-1.5 text-xs text-white/50">
                <span className="font-bold uppercase tracking-widest">Energía {sign} hoy</span>
                <span className="font-black text-white/80">{energyScore}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${energyColor(energyScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${energyScore}%` }}
                  transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Daily context pills */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-medium">
              ☀️ Sol en {ctx.sunTransit}
            </span>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-medium">
              {ctx.moonPhase}
            </span>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-medium">
              🔢 Vibración {ctx.dayVibration}
            </span>
          </div>

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/horoscopo"
              className="group flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              Tu lectura del día
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/dashboard/oraculo"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white active:scale-95"
            >
              Consulta libre
            </Link>
            <Link
              href="/dashboard/tarot"
              className="flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-200/80 transition hover:border-violet-400/50 hover:text-violet-100 active:scale-95"
            >
              Tirada rápida
            </Link>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Profile card compacta ─────────────────────────────────── */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
        {/* Decorative sigil */}
        <Image
          src="/zodi-art/brand/isotipo.png"
          alt=""
          aria-hidden="true"
          width={280}
          height={280}
          className="pointer-events-none absolute -right-14 -bottom-14 h-48 w-48 opacity-[0.07] mix-blend-screen"
        />

        {/* Avatar + name */}
        <div className="relative flex items-center gap-3">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-lime-300/35 shrink-0">
            {!mounted ? (
              <div className="h-full w-full animate-pulse bg-white/10" />
            ) : avatar.startsWith("data:") ? (
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <Image src={avatar} alt="Avatar" fill className="object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="zodi-kicker">Perfil activo</p>
            <h2
              className="mt-0.5 text-xl font-black truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {mounted ? (profile?.displayName ?? "—") : <Shimmer w="w-28" />}
            </h2>
            {mounted && (
              <p className="text-[10px] font-black uppercase tracking-widest text-lime-200/80 mt-0.5">
                {levelTitle}
              </p>
            )}
          </div>
          {/* Gems + streak badges */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1 rounded-full border border-lime-300/25 bg-lime-300/08 px-2.5 py-1">
              <Gem className="h-3 w-3 text-lime-300" />
              <span className="text-xs font-bold text-lime-200" style={{ fontFamily: "var(--font-mono)" }}>
                {mounted ? gems : 0}
              </span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-orange-400/25 bg-orange-400/08 px-2.5 py-1">
                <Flame className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-bold text-orange-200" style={{ fontFamily: "var(--font-mono)" }}>
                  {streak}d
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sign + Moon */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/08 bg-black/35 p-3">
            <p className="zodi-kicker mb-1">Signo</p>
            <p className="text-base font-black">{mounted ? (profile?.zodiac ?? "—") : "—"}</p>
          </div>
          <div className="rounded-xl border border-white/08 bg-black/35 p-3">
            <p className="zodi-kicker mb-1">Luna</p>
            <p className="text-base font-black">{mounted ? (profile?.moonSign ?? "—") : "—"}</p>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/55">
            <span className="font-bold text-white/75">Nivel {level}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>{xpCurrent}/{xpNeeded} XP</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/60 border border-white/10 p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Jupiter/Saturn line */}
        <div className="flex items-center gap-2.5 rounded-xl border border-violet-400/18 bg-violet-500/08 px-3 py-2.5">
          <RadioTower className="h-4 w-4 shrink-0 text-violet-300" />
          <span className="text-xs font-medium text-white/75 leading-snug">
            Júpiter en {ctx.jupiterSign} · Saturno en {ctx.saturnSign}
          </span>
        </div>

        {/* Edit profile link */}
        <Link
          href="/dashboard/perfil"
          className="mt-auto block text-center text-[11px] font-bold uppercase tracking-widest text-white/35 transition hover:text-lime-200/70"
        >
          Editar perfil
        </Link>
      </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/08 bg-black/40 p-3.5">
      <p className="zodi-kicker mb-1">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
