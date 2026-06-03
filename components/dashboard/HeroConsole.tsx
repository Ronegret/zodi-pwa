"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioTower, Sparkles, Gem, Flame, Zap, ArrowRight } from "lucide-react";
import { getTodaysAstralContext, getSignEnergyScore } from "@/lib/astral";
import { getSessionProfile, getLocalSession } from "@/lib/session";
import { getXpData, getStreak, getLevel, xpToNextLevel, getGems, getLevelTitle } from "@/lib/gamification";
import { getNameCard, getSignRuler, getDailyCrystal } from "@/lib/nameCard";
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

// ── Saludos por idioma y franja horaria ──────────────────────────────────────
type GreetingSet = { dawn: string; morning: string; noon: string; afternoon: string; night: string };

const GREETINGS: Record<string, GreetingSet> = {
  es: { dawn: "Madrugada de señales", morning: "Buenos días",   noon: "¡Buenas!",         afternoon: "Buenas tardes",   night: "Buenas noches"   },
  en: { dawn: "Signals in the dark",  morning: "Good morning",  noon: "Good afternoon",   afternoon: "Good afternoon",  night: "Good evening"    },
  pt: { dawn: "Sinais na madrugada",  morning: "Bom dia",       noon: "Boa tarde",        afternoon: "Boa tarde",       night: "Boa noite"       },
  fr: { dawn: "Signaux dans la nuit", morning: "Bonjour",       noon: "Bon après-midi",   afternoon: "Bon après-midi",  night: "Bonne soirée"    },
  it: { dawn: "Segnali nell'alba",    morning: "Buongiorno",    noon: "Buon pomeriggio",  afternoon: "Buon pomeriggio", night: "Buona sera"      },
  de: { dawn: "Signale in der Nacht", morning: "Guten Morgen",  noon: "Guten Nachmittag", afternoon: "Guten Nachmittag",night: "Guten Abend"     },
  ca: { dawn: "Senyals a la nit",     morning: "Bon dia",       noon: "Bon dia",          afternoon: "Bona tarda",      night: "Bona nit"        },
  gl: { dawn: "Sinais na noite",      morning: "Bos días",      noon: "Boa tarde",        afternoon: "Boa tarde",       night: "Boa noite"       },
};

// ── Saludo según hora LOCAL del usuario + idioma del navegador ────────────────
function getLocalTimeGreeting(): string {
  const h = new Date().getHours();

  const lang = (typeof navigator !== "undefined" ? navigator.language : "es").slice(0, 2).toLowerCase();
  const set = GREETINGS[lang] ?? GREETINGS.es;

  if (h < 6)  return set.dawn;
  if (h < 12) return set.morning;
  if (h < 14) return set.noon;
  if (h < 20) return set.afternoon;   // tardes hasta las 20h (compatible con horario español)
  return set.night;
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
// NEON AURA — animación GPU-only: solo transform + opacity, sin filter dinámico
// will-change promueve cada orb a su propia capa de composición → 0 repaints
// ─────────────────────────────────────────────────────────────────────────────
function NeonAura() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none select-none"
      aria-hidden
    >
      {/* Fondo base */}
      <div className="absolute inset-0 bg-[#050508]" />

      {/* Orb principal lime — pulsa desde el centro */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "55%", height: "55%",
          top: "22%", left: "22%",
          background: "radial-gradient(circle, rgba(184,255,23,0.13) 0%, rgba(184,255,23,0.04) 50%, transparent 75%)",
          filter: "blur(28px)",
          willChange: "transform, opacity",
        }}
        animate={{ scale: [1, 1.18, 0.95, 1], opacity: [0.7, 1, 0.65, 0.7] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb violet — deriva lentamente */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "45%", height: "45%",
          top: "30%", right: "5%",
          background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.06) 55%, transparent 80%)",
          filter: "blur(32px)",
          willChange: "transform, opacity",
        }}
        animate={{
          x: [0, -30, 15, 0],
          y: [0, 20, -10, 0],
          opacity: [0.5, 0.85, 0.55, 0.5],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orb cyan — deriva opuesto */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "35%", height: "35%",
          bottom: "15%", left: "8%",
          background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
          filter: "blur(24px)",
          willChange: "transform, opacity",
        }}
        animate={{
          x: [0, 25, -10, 0],
          y: [0, -18, 8, 0],
          opacity: [0.4, 0.75, 0.4, 0.4],
        }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Líneas de horizonte — solo opacity + scaleX (GPU-composited) */}
      <motion.div
        className="absolute"
        style={{
          height: "1px",
          left: "5%", right: "5%",
          bottom: "28%",
          background: "linear-gradient(90deg, transparent, rgba(184,255,23,0.22), rgba(184,255,23,0.12), transparent)",
          willChange: "opacity, transform",
        }}
        animate={{ opacity: [0.4, 0.9, 0.4], scaleX: [0.8, 1, 0.85, 0.8] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{
          height: "1px",
          left: "15%", right: "15%",
          bottom: "18%",
          background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)",
          willChange: "opacity, transform",
        }}
        animate={{ opacity: [0.3, 0.7, 0.3], scaleX: [0.9, 1, 0.9] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Partículas flotantes */}
      {[
        { x: "15%", y: "20%", color: "rgba(184,255,23,0.7)", size: 2, dur: 5 },
        { x: "75%", y: "35%", color: "rgba(139,92,246,0.8)", size: 1.5, dur: 7 },
        { x: "88%", y: "65%", color: "rgba(34,211,238,0.6)", size: 2, dur: 9 },
        { x: "8%",  y: "70%", color: "rgba(184,255,23,0.5)", size: 1.5, dur: 6 },
        { x: "55%", y: "12%", color: "rgba(139,92,246,0.6)", size: 1, dur: 8 },
        { x: "42%", y: "82%", color: "rgba(34,211,238,0.5)", size: 1.5, dur: 10 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.x, top: p.y,
            width: p.size * 2, height: p.size * 2,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.size * 2}px ${p.color}`,
            willChange: "opacity, transform",
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.4, 0.8] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(5,5,8,0.85) 100%)" }}
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

  const energyScore = mounted && sign ? getSignEnergyScore(sign, ctx) : 0;
  const { phrase, moonLine } = mounted && sign
    ? getDailyPhrase(sign, ctx, tone)
    : { phrase: "", moonLine: "" };

  // Usar timezone local del cliente — solo disponible después del mount
  const timeGreeting = mounted ? getLocalTimeGreeting() : "Buenos días";

  // Detectar si falta la fecha de nacimiento (dato clave para lecturas)
  const missingBirthDate = mounted && !profile?.birthDate && !getLocalSession().onboardingData?.birthDate;

  return (
    <section className="grid gap-3">
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
              <p className="text-[11px] text-orange-200/65 mt-0.5 truncate">Sin ella, tus lecturas son genéricas.</p>
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

      <section className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr] xl:grid-cols-[1.55fr_0.45fr]">
      {/* ── LEFT: Hero personalizado ─────────────────────────────────────── */}
      <div
        className="hero-dark-card neon-border overflow-hidden rounded-2xl relative"
        style={{ background: "linear-gradient(145deg, rgba(8,8,16,0.92), rgba(5,5,12,0.88))", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <NeonAura />

        <div className="p-4 sm:p-6 xl:p-7 relative z-[1]">
          {/* Kicker + energy badge: columna en mobile, fila en sm+ */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="zodi-kicker">{timeGreeting} · ZODI panel astral</p>
            {mounted && sign && sign.trim() && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1"
              >
                <Zap className="h-3 w-3 text-lime-300 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wide text-lime-200">
                  {sign} · {energyScore}% hoy
                </span>
              </motion.div>
            )}
          </div>

          {/* Main greeting */}
          <div className="mt-3 flex items-start justify-between gap-3">
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
                    <>
                      <h1
                        className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.05] tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {firstName},
                      </h1>
                      {/* Línea 1 — Significado del nombre */}
                      {(() => {
                        const card = getNameCard(profile?.displayName);
                        if (!card) return null;
                        return (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.45 }}
                            className="mt-1 text-[11px] sm:text-xs text-white/42 leading-snug tracking-wide"
                          >
                            {card.meaning}
                            <span className="text-white/28"> · {card.origin}</span>
                            {card.saint && card.saint !== "— " && (
                              <span className="text-lime-200/40"> · ✦ {card.saint}</span>
                            )}
                          </motion.p>
                        );
                      })()}
                      {/* Línea 2 — Planeta regente + cristal del día */}
                      {(() => {
                        const ruler   = getSignRuler(sign);
                        const crystal = getDailyCrystal(sign);
                        if (!ruler) return null;
                        return (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.45 }}
                            className="mt-0.5 text-[11px] sm:text-xs leading-snug tracking-wide"
                          >
                            <span className="text-violet-300/60">
                              {ruler.symbol} {ruler.planet}
                            </span>
                            <span className="text-white/22"> · {ruler.keyword}</span>
                            <span className="text-white/22"> · </span>
                            <span className="text-lime-300/55">
                              {crystal.emoji} {crystal.name}
                            </span>
                            <span className="text-white/28"> · {crystal.intent}</span>
                          </motion.p>
                        );
                      })()}
                    </>
                  )}
                  {phrase ? (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.5 }}
                      className="mt-2 text-sm sm:text-base lg:text-lg font-semibold leading-snug text-white/85 max-w-xl"
                    >
                      {phrase}
                    </motion.p>
                  ) : (
                    <p className="mt-2 text-sm sm:text-base font-semibold leading-snug text-white/85 max-w-xl">
                      Tu mapa astral, tus lecturas y tu energía en un solo lugar.
                    </p>
                  )}
                  {moonLine && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="mt-1.5 text-xs sm:text-sm text-lime-200/65 font-medium"
                    >
                      {ctx.moonPhase} · {moonLine}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </div>

            {/* ZODI character — se escala con el ancho del hero */}
            <div className="hidden md:flex shrink-0 items-end self-stretch -mb-1 -mr-1 lg:-mb-2 lg:-mr-2">
              <Image
                src="/zodi-art/nuevas/4-Poses-del-personaje-ZODI/ZODI-modo-intenso.png"
                alt="ZODI"
                width={200}
                height={250}
                className="object-contain object-bottom drop-shadow-[0_0_30px_rgba(184,255,23,0.35)] lg:w-[240px] lg:h-[300px] xl:w-[280px] xl:h-[350px]"
              />
            </div>
          </div>

          {/* Energy bar for sign */}
          {mounted && sign && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="mt-4 origin-left"
            >
              <div className="flex items-center justify-between mb-1 text-[10px] text-white/45">
                <span className="font-bold uppercase tracking-widest">Energía {sign}</span>
                <span className="font-black text-white/75">{energyScore}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
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
          <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-white/45">
            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-medium">
              ☀️ {ctx.sunTransit}
            </span>
            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-medium">
              {ctx.moonPhase}
            </span>
            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-medium">
              🔢 {ctx.dayVibration}
            </span>
          </div>

          {/* ── Mobile profile strip + XP bar — solo en mobile (oculto en lg+) ── */}
          {mounted && (
            <div className="mt-3 lg:hidden">
              <div className="flex items-center gap-2.5 rounded-t-xl border border-b-0 border-white/08 bg-black/35 px-3 py-2.5">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-lime-300/20">
                  {avatar.startsWith("data:") ? (
                    <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <Image src={avatar} alt="Avatar" fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate leading-tight">{profile?.displayName ?? "—"}</p>
                  <p className="text-[10px] text-white/45 mt-0.5">
                    {sign ? `${sign} · ${levelTitle}` : levelTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  {streak > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span className="text-[11px] font-black text-orange-300">{streak}d</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Gem className="h-3 w-3 text-lime-300" />
                    <span className="text-[11px] font-black text-lime-200">{gems}</span>
                  </div>
                </div>
              </div>
              {/* XP bar */}
              <div className="rounded-b-xl border border-white/08 bg-black/35 px-3 pb-2.5 pt-1.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/35 font-bold">Nv {level} · {xpCurrent}/{xpNeeded} XP</span>
                  <span className="text-[10px] font-black text-lime-300/70">{xpPercent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10 border border-white/08">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CTAs — grid 2 cols en mobile */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
            <Link
              href="/dashboard/horoscopo"
              className="group col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              Tu lectura del día
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 shrink-0" />
            </Link>
            <Link
              href="/dashboard/oraculo"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white active:scale-95"
            >
              Consulta libre
            </Link>
            <Link
              href="/dashboard/tarot"
              className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200/80 transition hover:border-violet-400/50 hover:text-violet-100 active:scale-95"
            >
              Tirada rápida
            </Link>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Profile card — solo en desktop (lg+) ─────────────────── */}
      <div className="hidden lg:flex glass-panel relative overflow-hidden rounded-2xl p-4 sm:p-5 xl:p-6 flex-col gap-4 xl:gap-5">
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
          <div className="relative h-14 w-14 xl:h-16 xl:w-16 overflow-hidden rounded-2xl border-2 border-lime-300/35 shrink-0">
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

      {/* ── Astral stats strip — solo en mobile/tablet (lg tiene el panel derecho) ── */}
      {mounted && profile && sign && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="grid grid-cols-4 gap-2 lg:hidden"
        >
          <Metric label="Signo" value={sign} />
          <Metric label="Luna" value={profile.moonSign || "—"} />
          <Metric label="Asc." value={profile.ascendant || "—"} />
          <Metric label="Camino" value={profile.lifePathNumber ? String(profile.lifePathNumber) : "—"} />
        </motion.div>
      )}
    </section>
  );
}

// ── Tooltips explicativos de cada métrica astral ──────────────────────────────
const METRIC_INFO: Record<string, string> = {
  "Signo":  "Tu signo solar — el Sol estaba en este signo cuando naciste. Define tu personalidad central, tu ego y cómo brillas. Es el que aparece en todos los horóscopos de revista.",
  "Luna":   "Tu signo lunar — donde estaba la Luna al nacer. Rige tus emociones, tus reacciones instintivas y lo que necesitas para sentirte seguro/a. La parte de ti que solo ven los más cercanos.",
  "Asc.":   "Tu Ascendente — el signo que salía por el horizonte cuando naciste. Es tu 'máscara pública': cómo te perciben los demás antes de conocerte. También influye en tu apariencia y primeras impresiones.",
  "Camino": "Tu Camino de vida — un número calculado con tu fecha de nacimiento (se suman todos los dígitos). Define tu misión vital y los temas que van a repetirse en tu historia.",
};

function Metric({ label, value }: { label: string; value: string }) {
  const [open, setOpen] = useState(false);
  const info = METRIC_INFO[label];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full rounded-xl border border-white/08 bg-black/40 p-2.5 sm:p-3.5 text-left transition hover:bg-black/55 active:scale-95"
        aria-expanded={open}
        title={info}
      >
        <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1">
          <p className="zodi-kicker text-[9px] sm:text-[10px]">{label}</p>
          {info && (
            <span className="text-[9px] font-black text-white/25 hover:text-white/50 leading-none">?</span>
          )}
        </div>
        <p className="text-sm sm:text-base lg:text-lg font-black text-white truncate">{value}</p>
      </button>

      <AnimatePresence>
        {open && info && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-full left-0 z-40 mb-2 w-56 rounded-xl border border-violet-400/25 bg-[#0d0c1a] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300/70 mb-1">{label}</p>
              <p className="text-xs text-white/75 leading-relaxed">{info}</p>
              <div className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-r border-b border-violet-400/25 bg-[#0d0c1a]" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
