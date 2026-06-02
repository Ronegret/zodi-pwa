"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLocalSession, getSessionProfile } from "@/lib/session";
import {
  Search, Share2, Star, Heart, Users, ChevronRight,
  Sparkles, UserRound, Zap, Copy, CheckCheck, RotateCcw,
  HeartHandshake
} from "lucide-react";

const SIGNS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const SIGN_EMOJI: Record<string, string> = {
  Aries: "♈", Tauro: "♉", Géminis: "♊", Cáncer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Escorpio: "♏", Sagitario: "♐", Capricornio: "♑", Acuario: "♒", Piscis: "♓",
};

// Matriz de compatibilidad base por elemento (0-100)
const ELEMENT: Record<string, string> = {
  Aries: "Fuego", Leo: "Fuego", Sagitario: "Fuego",
  Tauro: "Tierra", Virgo: "Tierra", Capricornio: "Tierra",
  Géminis: "Aire", Libra: "Aire", Acuario: "Aire",
  Cáncer: "Agua", Escorpio: "Agua", Piscis: "Agua",
};

const ELEMENT_COMPAT: Record<string, Record<string, number>> = {
  Fuego: { Fuego: 85, Aire: 88, Tierra: 55, Agua: 48 },
  Tierra: { Tierra: 82, Agua: 87, Fuego: 55, Aire: 60 },
  Aire:   { Aire: 80, Fuego: 88, Agua: 52, Tierra: 60 },
  Agua:   { Agua: 88, Tierra: 87, Aire: 52, Fuego: 48 },
};

// Ajustes especiales por pareja de signos famosos
const SPECIAL_BONUS: Record<string, number> = {
  "Aries-Sagitario": 7, "Sagitario-Aries": 7,
  "Tauro-Cáncer": 6, "Cáncer-Tauro": 6,
  "Géminis-Acuario": 8, "Acuario-Géminis": 8,
  "Leo-Aries": 6, "Aries-Leo": 6,
  "Virgo-Capricornio": 7, "Capricornio-Virgo": 7,
  "Libra-Géminis": 7, "Géminis-Libra": 7,
  "Escorpio-Piscis": 9, "Piscis-Escorpio": 9,
  "Sagitario-Acuario": 5, "Acuario-Sagitario": 5,
};

function getCompatScore(mySign: string, theirSign: string): number {
  const myEl = ELEMENT[mySign] ?? "Fuego";
  const theirEl = ELEMENT[theirSign] ?? "Fuego";
  const base = ELEMENT_COMPAT[myEl]?.[theirEl] ?? 65;
  const bonus = SPECIAL_BONUS[`${mySign}-${theirSign}`] ?? 0;
  // Add deterministic jitter based on sign combo
  const seed = (mySign.charCodeAt(0) + theirSign.charCodeAt(0)) % 8;
  return Math.min(99, Math.max(45, base + bonus + seed));
}

function scoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 88) return { label: "Conexión estelar", color: "text-lime-300", bg: "bg-lime-300/15 border-lime-300/30" };
  if (score >= 78) return { label: "Alta afinidad", color: "text-cyan-300", bg: "bg-cyan-300/15 border-cyan-300/30" };
  if (score >= 65) return { label: "Buena química", color: "text-violet-300", bg: "bg-violet-300/15 border-violet-300/30" };
  if (score >= 50) return { label: "Energía tensa", color: "text-amber-300", bg: "bg-amber-300/15 border-amber-300/30" };
  return { label: "Choque de fuerzas", color: "text-orange-400", bg: "bg-orange-400/15 border-orange-400/30" };
}

type Step = "search" | "loading" | "result";

export function AmigosSectionUI() {
  const [step, setStep] = useState<Step>("search");
  const [friendName, setFriendName] = useState("");
  const [friendSign, setFriendSign] = useState("");
  const [friendMoon, setFriendMoon] = useState("");
  const [friendAsc, setFriendAsc] = useState("");
  const [reading, setReading] = useState("");
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mySign, setMySign] = useState("");
  const [myName, setMyName] = useState("");

  useEffect(() => {
    try {
      const profile = getSessionProfile();
      const session = getLocalSession();
      setMySign(profile?.zodiac ?? "");
      setMyName(
        profile?.displayName?.split(" ")[0] ??
        session.onboardingData?.displayName?.split(" ")[0] ??
        "tú"
      );
    } catch { /* ignore */ }
  }, []);

  async function analyze() {
    if (!friendSign) return;
    setStep("loading");

    const computed = getCompatScore(mySign || "Aries", friendSign);
    setScore(computed);

    const session = getLocalSession();
    const profile = getSessionProfile();

    const myProfile = {
      zodiac: profile?.zodiac ?? "desconocido",
      moonSign: profile?.moonSign ?? "desconocida",
      ascendant: profile?.ascendant ?? "desconocido",
      lifePathNumber: profile?.lifePathNumber ?? null,
      displayName: myName,
      birthDate: session.onboardingData?.birthDate ?? null,
      country: session.onboardingData?.birthCountry ?? null,
      readingTone: profile?.readingTone ?? "directo",
    };

    const theirInfo = [
      `Nombre: ${friendName || "Amigo/a"}`,
      `Signo solar: ${friendSign}`,
      friendMoon ? `Luna: ${friendMoon}` : null,
      friendAsc ? `Ascendente: ${friendAsc}` : null,
    ].filter(Boolean).join(", ");

    const prompt = `Analiza la compatibilidad entre ${myProfile.displayName} (${myProfile.zodiac}, Luna ${myProfile.moonSign}, Asc ${myProfile.ascendant}) y ${theirInfo}. Incluye: química natural, puntos de choque, cómo se comunican, área más fuerte y consejo directo. Estilo ZODI: directo, gracioso, sin postureo espiritual. Máximo 250 palabras.`;

    try {
      const res = await fetch("/api/ai/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "compatibility",
          input: prompt,
          profile: myProfile,
        }),
      });
      const data = await res.json().catch(() => ({}));
      const text = data.reading ?? data.text ?? "";
      setReading(text || fallbackReading(mySign || "Aries", friendSign, friendName || "tu amigo/a"));
    } catch {
      setReading(fallbackReading(mySign || "Aries", friendSign, friendName || "tu amigo/a"));
    }

    setStep("result");
  }

  function copyInvite() {
    const url = typeof window !== "undefined" ? window.location.origin : "https://zodi.aibueno.es";
    const text = `He revisado nuestra compatibilidad astral en ZODI y tenemos un ${score}% — ${scoreLabel(score).label}. Entra con tu perfil completo y lo descubrimos todo 🔮✨ ${url}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function reset() {
    setStep("search");
    setFriendSign("");
    setFriendMoon("");
    setFriendAsc("");
    setFriendName("");
    setReading("");
    setScore(0);
  }

  const { label, color, bg } = scoreLabel(score);
  const hasDetails = !!(friendMoon || friendAsc);

  return (
    <div className="space-y-4">

      {/* ── HOOK BANNER ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/25 p-5 sm:p-6"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/70 mb-1">
              ✦ Nuevo en ZODI
            </p>
            <h2 className="text-lg sm:text-xl font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Descubre vuestra compatibilidad exacta
            </h2>
            <p className="mt-1.5 text-sm text-white/60 leading-relaxed">
              Entra el signo de tu amigo/a y ZODI compara vuestros mapas astrales. Cuanto más datos tenga, más preciso es el análisis.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:flex-col sm:gap-1.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15">
              <HeartHandshake className="h-6 w-6 text-violet-300" />
            </div>
            <div className="text-left sm:text-center">
              <p className="text-xs font-black text-violet-200">Análisis</p>
              <p className="text-[10px] text-violet-200/50">astral real</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── PASO 1: FORMULARIO ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {step === "search" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-300/70 mb-3">
                ¿Con quién vas a compararte?
              </p>

              {/* Nombre */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-white/55">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={friendName}
                  onChange={e => setFriendName(e.target.value)}
                  placeholder="El nombre de tu amigo/a..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-lime-300/40 transition"
                />
              </div>

              {/* Signo — required */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-white/55">
                  Su signo zodiacal <span className="text-lime-300/70">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {SIGNS.map(s => (
                    <button
                      key={s}
                      onClick={() => setFriendSign(s)}
                      className={`rounded-xl border px-2 py-2.5 text-center transition active:scale-95 ${
                        friendSign === s
                          ? "border-lime-300/50 bg-lime-300/15 text-lime-200"
                          : "border-white/08 bg-white/03 text-white/55 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <div className="text-base leading-none mb-0.5">{SIGN_EMOJI[s]}</div>
                      <div className="text-[9px] font-bold leading-tight truncate">{s}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opcionales: Luna + Ascendente */}
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 text-xs font-bold text-white/40 hover:text-white/70 transition mb-3 list-none">
                  <ChevronRight className="h-3.5 w-3.5 transition group-open:rotate-90" />
                  Añadir luna y ascendente (análisis más preciso)
                </summary>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white/45">Luna</label>
                    <select
                      value={friendMoon}
                      onChange={e => setFriendMoon(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white/70 outline-none focus:border-violet-400/40 transition appearance-none"
                    >
                      <option value="">No sé</option>
                      {SIGNS.map(s => <option key={s} value={s}>{SIGN_EMOJI[s]} {s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white/45">Ascendente</label>
                    <select
                      value={friendAsc}
                      onChange={e => setFriendAsc(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white/70 outline-none focus:border-violet-400/40 transition appearance-none"
                    >
                      <option value="">No sé</option>
                      {SIGNS.map(s => <option key={s} value={s}>{SIGN_EMOJI[s]} {s}</option>)}
                    </select>
                  </div>
                </div>
              </details>
            </div>

            <button
              onClick={analyze}
              disabled={!friendSign}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3.5 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              Analizar compatibilidad
              {friendSign && <span className="ml-1 text-black/60">con {friendSign}</span>}
            </button>

            {/* Invite hook */}
            <div className="rounded-xl border border-white/06 bg-white/02 px-4 py-3 flex items-start gap-2.5">
              <Star className="h-4 w-4 shrink-0 text-amber-300/70 mt-0.5" />
              <p className="text-[11px] text-white/50 leading-relaxed">
                <span className="font-bold text-white/70">¿No sabes su luna o ascendente?</span> Invítalo/a a ZODI — en 2 min completa su perfil y obtenéis el análisis completo con todos los planetas.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── PASO 2: LOADING ──────────────────────────────────────────── */}
        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 min-h-64"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-4xl"
            >
              🔮
            </motion.div>
            <div className="text-center">
              <p className="font-black text-white text-lg">Leyendo las estrellas...</p>
              <p className="text-sm text-white/50 mt-1">
                {friendName ? `Comparando ${myName} con ${friendName}` : `Buscando vuestra afinidad astral`}
              </p>
            </div>
            <motion.div
              className="h-1 w-48 rounded-full bg-white/10 overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime-300 via-violet-400 to-lime-300"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* ── PASO 3: RESULTADO ────────────────────────────────────────── */}
        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* Score card */}
            <div className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Signs */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">{mySign ? SIGN_EMOJI[mySign] : "⭐"}</span>
                    <span className="text-[10px] font-bold text-white/50 mt-0.5">{myName}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < Math.round(score / 20) ? "text-lime-300 fill-lime-300" : "text-white/15"}`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 text-2xl font-black text-white">{score}%</div>
                    <div className={`mt-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${bg} ${color}`}>
                      {label}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">{SIGN_EMOJI[friendSign]}</span>
                    <span className="text-[10px] font-bold text-white/50 mt-0.5">{friendName || friendSign}</span>
                  </div>
                </div>
              </div>

              {/* Barra de compat */}
              <div className="mt-4">
                <div className="h-2.5 overflow-hidden rounded-full bg-white/08 border border-white/10 p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Tags de info */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/08 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-white/55">
                  {SIGN_EMOJI[mySign || "Aries"]} {mySign || "Tu signo"}
                </span>
                <span className="rounded-full border border-white/08 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-white/55">
                  {SIGN_EMOJI[friendSign]} {friendSign}
                </span>
                {friendMoon && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/08 px-2.5 py-1 text-[10px] font-bold text-violet-300/70">
                    🌙 Luna {friendMoon}
                  </span>
                )}
                {friendAsc && (
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/08 px-2.5 py-1 text-[10px] font-bold text-cyan-300/70">
                    ↑ Asc {friendAsc}
                  </span>
                )}
                {!hasDetails && (
                  <span className="rounded-full border border-amber-400/20 bg-amber-500/08 px-2.5 py-1 text-[10px] font-bold text-amber-300/70">
                    ⚡ Análisis básico — invítalo/a para el completo
                  </span>
                )}
              </div>
            </div>

            {/* Lectura IA */}
            {reading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="glass-panel rounded-2xl p-5 sm:p-6"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-lime-300/70 mb-3">
                  ✦ Lo que dicen las estrellas
                </p>
                <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{reading}</p>
              </motion.div>
            )}

            {/* ── CTA VIRAL ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-900/50 to-violet-900/35 p-5 sm:p-6"
            >
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300/70 mb-2">
                  ✦ Compatibilidad completa
                </p>
                <h3 className="text-base sm:text-lg font-black leading-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {hasDetails
                    ? `¿Queréis el análisis de todos los planetas?`
                    : `¿Quieres el análisis EXACTO con ${friendName || "tu amigo/a"}?`}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  {hasDetails
                    ? "Comparte esta lectura con tu amigo/a para que entre y complete su perfil. Con la carta natal completa de ambos, el análisis sube a otro nivel."
                    : `Invita a ${friendName || "tu amigo/a"} a ZODI. En 2 minutos completa su perfil astral y ZODI calcula vuestra compatibilidad con luna, ascendente, carta natal y numerología. Gratis.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={copyInvite}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-3 text-sm font-black text-black transition hover:bg-fuchsia-300 active:scale-95"
                  >
                    {copied ? (
                      <><CheckCheck className="h-4 w-4" /> ¡Copiado!</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Copiar invitación con tu resultado</>
                    )}
                  </button>
                  <button
                    onClick={copyInvite}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/05 px-4 py-3 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white active:scale-95"
                  >
                    <Share2 className="h-4 w-4" /> Compartir
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Volver a analizar */}
            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-xs font-bold text-white/40 transition hover:text-white/70 hover:border-white/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Analizar con otro amigo/a
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INFO PANEL — POR QUÉ INVITAR ─────────────────────────────── */}
      {step === "search" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            {
              icon: "🔮",
              title: "Más datos = más exacto",
              text: "Con solo el signo obtienes una lectura general. Con luna y ascendente, el análisis profundiza en cómo os comunicáis y qué os genera tensión.",
            },
            {
              icon: "⭐",
              title: "Invita y sube el nivel",
              text: "Si tu amigo/a entra a ZODI con su fecha de nacimiento, ZODI genera la comparativa completa de ambas cartas natales. Es otro nivel de análisis.",
            },
            {
              icon: "💥",
              title: "Comparte el resultado",
              text: "Después de tu análisis, ZODI te da un mensaje listo para compartir con tu amigo/a y que entre a ver su versión del mismo encuentro astral.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/06 bg-white/02 p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-xs font-black text-white/80 mb-1">{item.title}</p>
              <p className="text-[11px] text-white/45 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ── Fallback si la IA no responde ─────────────────────────────────────────────
function fallbackReading(mySign: string, theirSign: string, name: string): string {
  const myEl = ELEMENT[mySign] ?? "Fuego";
  const theirEl = ELEMENT[theirSign] ?? "Agua";
  const combos: Record<string, string> = {
    "Fuego-Fuego": `${mySign} y ${theirSign} juntos son como dos bengalas en el mismo cuarto. Mucha energía, mucho movimiento, y algún que otro incendio si nadie baja el ritmo. Pero cuando van en la misma dirección, nadie los para.`,
    "Fuego-Aire": `${mySign} da la chispa, ${theirSign} la oxigena. Esta combinación se retroalimenta: la energía de uno potencia la del otro. El riesgo es que tanto entusiasmo sin dirección puede convertirse en confusión con mucho ruido.`,
    "Fuego-Tierra": `${mySign} quiere moverlo todo, ${theirSign} quiere consolidar. Energía opuesta, pero complementaria si hay respeto. El fuego da empuje, la tierra da estructura. Sin paciencia de ambas partes, hay chispas del tipo que no iluminan.`,
    "Fuego-Agua": `${mySign} y ${theirSign} tienen una tensión que puede generar tormenta o un vapor que lo transforma todo. El fuego quiere avanzar, el agua quiere sentir. Necesitan aprender el idioma del otro.`,
    "Tierra-Tierra": `${mySign} y ${theirSign} se entienden sin palabras. Misma velocidad, misma forma de valorar lo concreto. El riesgo es volverse demasiado cómodos y olvidar crecer. Cuando se mueven juntos, son sólidos como roca.`,
    "Tierra-Agua": `${mySign} y ${theirSign} forman una de las combinaciones más estables del zodíaco. El agua nutre la tierra, la tierra da forma al agua. Cuidado con que uno ceda siempre: esto funciona cuando ambos aportan.`,
    "Tierra-Aire": `${mySign} y ${theirSign} viven en velocidades distintas. Uno piensa en lo concreto, el otro en las posibilidades. Pueden complementarse o frustrarse mutuamente. Requiere que ambos escuchen de verdad.`,
    "Aire-Aire": `${mySign} y ${theirSign} juntos son conversación infinita. Se entienden rápido, se estimulan mucho, y a veces ninguno baja a tierra. Necesitan parar el ruido mental y conectar de vez en cuando con algo real.`,
    "Aire-Agua": `${mySign} piensa, ${theirSign} siente. Dos formas distintas de procesar el mundo. La tensión viene cuando uno quiere analizar lo que el otro solo quiere vivir. Si aprenden a combinarlo, es una pareja muy completa.`,
    "Agua-Agua": `${mySign} y ${theirSign} se sienten sin explicarse. Alta empatía, mucha profundidad, conexión genuina. El riesgo es perderse en el laberinto emocional del otro. Necesitan anclas prácticas para no derivar juntos.`,
  };
  const key = `${myEl}-${theirEl}`;
  const reverseKey = `${theirEl}-${myEl}`;
  return combos[key] ?? combos[reverseKey] ?? `${mySign} y ${theirSign} tienen una energía interesante que ZODI no puede leer del todo sin más datos. Añade la luna y el ascendente para una lectura más precisa.`;
}
