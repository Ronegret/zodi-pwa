"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Check, Copy, Gem, HeartHandshake,
  MoonStar, Share2, Sparkles, Star, Users, Waves, WandSparkles
} from "lucide-react";
import { demoProfile } from "@/lib/data";
import { getSessionProfile } from "@/lib/session";
import { addGems, addXp, GEMS_PER_EVENT } from "@/lib/gamification";
import { ZodiLoader } from "@/components/modules/ZodiLoader";
import type { LucideIcon } from "lucide-react";
import type { ReadingKind } from "@/types/zodi";

type Consulta = {
  title: string;
  label: string;
  body: string;
  image: string;
  icon: LucideIcon;
  kind: ReadingKind;
  input: string;
  focusDomain?: string;
};

const ZODIAC_MINI = [
  { name: "Aries", emoji: "♈" }, { name: "Tauro", emoji: "♉" },
  { name: "Géminis", emoji: "♊" }, { name: "Cáncer", emoji: "♋" },
  { name: "Leo", emoji: "♌" }, { name: "Virgo", emoji: "♍" },
  { name: "Libra", emoji: "♎" }, { name: "Escorpio", emoji: "♏" },
  { name: "Sagitario", emoji: "♐" }, { name: "Capricornio", emoji: "♑" },
  { name: "Acuario", emoji: "♒" }, { name: "Piscis", emoji: "♓" },
];

const consultas: Consulta[] = [
  {
    title: "Horóscopo",
    label: "Lectura del día",
    body: "Energía actual, amor, dinero, trabajo y una recomendación directa para hoy.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.png",
    icon: MoonStar,
    kind: "daily-horoscope",
    input: "Quiero mi horóscopo de hoy con amor, trabajo, dinero, energía y una advertencia clara.",
  },
  {
    title: "Tarot",
    label: "Tres cartas",
    body: "Una tirada rápida para entender la situación, el bloqueo y el siguiente paso.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tarot-acido.png",
    icon: Sparkles,
    kind: "tarot",
    input: "Haz una tirada de tres cartas: situación, bloqueo y consejo final.",
  },
  {
    title: "Compatibilidad",
    label: "Conexión",
    body: "Compara signos, energía emocional, ritmo y puntos de conflicto.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Compatibilidad.png",
    icon: HeartHandshake,
    kind: "compatibility",
    input: "Analiza compatibilidad amorosa y emocional con una persona que me interesa.",
    focusDomain: "amor y compatibilidad",
  },
  {
    title: "Sueños",
    label: "Interpretación",
    body: "Convierte símbolos raros en mensajes útiles para tu momento actual.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tu-energia-actual.png",
    icon: Waves,
    kind: "dream",
    input: "Interpreta un sueño extraño y conviértelo en un mensaje práctico.",
  },
  {
    title: "Chino",
    label: "Animal y ciclo",
    body: "Revisa animal, elemento, compatibilidades y energía del periodo.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-chino.png",
    icon: CalendarDays,
    kind: "chinese-horoscope",
    input: "Dame mi horóscopo chino con animal, elemento, energía actual y consejo.",
  },
  {
    title: "Numerología",
    label: "Camino vital",
    body: "Calcula número de vida, vibración del nombre y fechas con carga energética.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.png",
    icon: WandSparkles,
    kind: "numerology",
    input: "Analiza mi numerología, camino de vida, vibración actual y recomendación.",
    focusDomain: "numerología y patrones numéricos",
  },
  {
    title: "Cotilleo",
    label: "Otro signo",
    body: "Espía los astros de alguien más. Amor, trabajo, dinero y una advertencia. Sin que se entere.",
    image: "/zodi-art/nuevas/2-Portada--Home/ZODI-riendose-con-sarcasmo2.png",
    icon: Users,
    kind: "daily-horoscope",
    input: "Haz un horóscopo del día para este signo solar, con amor, trabajo, dinero, energía y señal de alerta. Es modo cotilleo: lo estoy leyendo para otra persona sin su permiso cósmico.",
  },
];

const tonos = ["suave", "directo", "brutal", "sarcástico"] as const;
const FOCUS_OPTIONS = ["amor", "dinero", "trabajo", "energía", "salud", "futuro"] as const;

// ── Toast de gemas ─────────────────────────────────────────────────────────────
function GemsToast({ amount, show }: { amount: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.92 }}
          transition={{ duration: 0.25 }}
          className="zodi-toast"
        >
          <Gem className="h-3.5 w-3.5 text-lime-300" />
          +{amount} gemas
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── ResultBox ─────────────────────────────────────────────────────────────────
function ResultBox({ result, sectionTitle }: { result: string; sectionTitle: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved]   = useState(false);

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveReading() {
    try {
      const existing = JSON.parse(localStorage.getItem("zodi.readings") ?? "[]");
      const entry = { id: Date.now(), date: new Date().toISOString(), section: sectionTitle, text: result };
      localStorage.setItem("zodi.readings", JSON.stringify([entry, ...existing].slice(0, 30)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
  }

  async function share() {
    const text = `Mi lectura ZODI — ${sectionTitle}:\n\n${result.slice(0, 800)}${result.length > 800 ? "..." : ""}\n\n🔮 zodi.aibueno.es`;
    if ("share" in navigator) {
      try { await navigator.share({ title: `ZODI: ${sectionTitle}`, text }); return; } catch { /* cancelled */ }
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-5"
    >
      <div className="max-h-64 overflow-auto rounded-xl border border-lime-300/15 bg-black/40 p-4 text-sm leading-7 text-white/80">
        <pre className="whitespace-pre-wrap" style={{ fontFamily: "var(--font-body)" }}>{result}</pre>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={copy} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/55 transition hover:border-white/25 hover:text-white/80">
          {copied ? <><Check className="h-3 w-3 text-lime-300" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
        </button>
        <button onClick={saveReading} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${saved ? "border-lime-300/40 bg-lime-300/08 text-lime-300" : "border-lime-300/20 text-lime-200/70 hover:text-lime-200"}`}>
          {saved ? <><Check className="h-3 w-3" /> Guardado</> : <><Star className="h-3 w-3" /> Guardar</>}
        </button>
        <button onClick={share} className="flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/55 transition hover:border-white/25 hover:text-white/80">
          <Share2 className="h-3 w-3" /> Compartir
        </button>
      </div>
    </motion.div>
  );
}

// ── ConsultationDock ──────────────────────────────────────────────────────────
export function ConsultationDock() {
  const [active, setActive]       = useState(consultas[0]);
  const [tone, setTone]           = useState<(typeof tonos)[number]>("directo");
  const [focus, setFocus]         = useState<string | null>(null);
  const [detail, setDetail]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<string | null>(null);
  const [showGems, setShowGems]   = useState(false);
  const [cotilleoSign, setCotilleoSign] = useState("");

  // Ocultar toast de gemas tras 2s
  useEffect(() => {
    if (!showGems) return;
    const t = setTimeout(() => setShowGems(false), 2200);
    return () => clearTimeout(t);
  }, [showGems]);

  async function startReading() {
    setLoading(true);
    setResult(null);

    const { getFirebaseToken } = await import('@/lib/firebase/client');
    const sessionProfile = getSessionProfile();
    const baseProfile = sessionProfile ?? demoProfile;

    const domainFocus = focus ?? active.focusDomain ?? undefined;
    const userInput = [
      active.input,
      active.title === "Cotilleo" && cotilleoSign ? `Signo a leer: ${cotilleoSign}.` : "",
      focus ? `El usuario quiere enfocarse SOLO en: ${focus}.` : "",
      detail ? `Detalle adicional del usuario: ${detail}` : ""
    ].filter(Boolean).join("\n");

    try {
      const token = await getFirebaseToken();
      let response: Response;
      try {
        response = await fetch("/api/ai/reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            provider: "auto",
            kind: active.kind,
            input: userInput,
            focusDomain: domainFocus,
            profile: {
              ...baseProfile,
              readingTone: tone === "sarcástico" ? "sarcastico" : tone
            }
          }),
          signal: AbortSignal.timeout(20000),
        });
      } catch (fetchErr: any) {
        const isTimeout = fetchErr?.name === "TimeoutError";
        setResult(isTimeout
          ? "El oráculo tardó demasiado. Los astros están lentos hoy. Reintenta. ⏳"
          : "Sin conexión con el servidor. Asegúrate de que la app está corriendo. 🔌");
        return;
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        setResult("El servidor respondió algo extraño. Recarga e inténtalo de nuevo. 🔄");
        return;
      }

      if (!response.ok) {
        setResult(data?.error || data?.text || "Error del servidor. Reintenta en un momento.");
        return;
      }

      const text = data.text || [data.reading, data.warning, data.ritual, data.roast].filter(Boolean).join("\n\n");
      setResult(text || "ZODI no encontró respuesta. Reintenta con otra pregunta.");

      try {
        addXp(active.title);
        addGems(GEMS_PER_EVENT.reading);
        setShowGems(true);
      } catch { /* ignore */ }
    } catch {
      setResult("Algo falló. Recarga la página si persiste. 🔮");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GemsToast amount={GEMS_PER_EVENT.reading} show={showGems} />

      <section className="mt-5 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        {/* Panel izquierdo — selector de consultas */}
        <div className="glass-panel rounded-2xl p-4">
          <p className="zodi-kicker mb-3">Consulta rápida</p>
          <h2 className="mb-4 text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
            ¿Qué te atormenta hoy?
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {consultas.map((consulta) => {
              const isActive = active.title === consulta.title;
              return (
                  <button
                  key={consulta.title}
                  onClick={() => { setActive(consulta); setResult(null); setFocus(null); setCotilleoSign(""); }}
                  className={`hover-bubble flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-lime-300/50 bg-lime-300/10 text-lime-100 shadow-[0_0_16px_rgba(184,255,23,0.08)]"
                      : "border-white/06 bg-white/[0.025] text-white/70 hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ${isActive ? "border border-lime-300" : "border border-transparent opacity-60"}`}>
                    <Image src={consulta.image} alt={consulta.title} fill className="object-cover" />
                  </div>
                  <span>
                    <span className="block text-sm font-bold leading-tight">{consulta.title}</span>
                    <span className="text-xs opacity-60">{consulta.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel derecho — configuración y resultado */}
        <article className="glass-panel neon-border grid overflow-hidden rounded-2xl md:grid-cols-[0.85fr_1.15fr]">
          {/* Imagen de la consulta */}
          <div className="relative min-h-56 md:min-h-full md:aspect-auto">
            <Image
              src={active.image}
              alt={active.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/65 md:via-black/10 md:to-transparent" />
            {/* Badge del título sobre la imagen en mobile */}
            <div className="absolute bottom-3 left-3 md:hidden">
              <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-bold text-lime-200 backdrop-blur-sm">
                {active.title}
              </span>
            </div>
          </div>

          {/* Panel de configuración */}
          <div className="flex flex-col overflow-y-auto p-5 no-scrollbar">
            <p className="zodi-kicker">{active.label}</p>
            <h3 className="mt-1.5 text-3xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              {active.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-white/60">{active.body}</p>

            {/* Selector de signo — solo para Cotilleo */}
            {active.title === "Cotilleo" && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">¿De qué signo es?</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {ZODIAC_MINI.map(z => (
                    <button
                      key={z.name}
                      onClick={() => setCotilleoSign(z.name)}
                      className={`rounded-lg border p-1.5 text-center text-xs font-bold transition ${
                        cotilleoSign === z.name
                          ? "border-lime-300 bg-lime-300/10 text-lime-200"
                          : "border-white/10 text-white/50 hover:border-lime-300/25 hover:text-white/80"
                      }`}
                    >
                      <div className="text-base">{z.emoji}</div>
                      <div className="truncate text-[9px] mt-0.5">{z.name.slice(0, 5)}</div>
                    </button>
                  ))}
                </div>
                {cotilleoSign && (
                  <p className="mt-2 text-xs font-bold text-lime-300">✦ {cotilleoSign} — ya lo tengo en el radar</p>
                )}
              </div>
            )}

            {/* Selector de área de enfoque — siempre visible, Todos por defecto */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Enfocar en</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFocus(null)}
                  className={`zodi-chip transition ${!focus ? "zodi-chip-active" : "hover:border-white/20"}`}
                >
                  ✦ Todos
                </button>
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFocus(focus === opt ? null : opt)}
                    className={`zodi-chip transition ${focus === opt ? "zodi-chip-active" : "hover:border-white/20"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de tono */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Tono</p>
              <div className="flex flex-wrap gap-1.5">
                {tonos.map((item) => (
                  <button
                    key={item}
                    onClick={() => setTone(item)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      tone === item
                        ? "bg-violet-500 text-white shadow-[0_0_12px_rgba(155,77,255,0.40)]"
                        : "border border-white/10 text-white/60 hover:border-violet-400/30 hover:text-violet-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de texto adicional */}
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder={
                active.kind === "dream" ? "Describe tu sueño aquí..." :
                active.kind === "compatibility" ? "Dime el signo de la otra persona (y más si quieres)..." :
                active.kind === "name-reading" ? "Escribe nombre y apellidos completos..." :
                "Añade contexto, pregunta específica o detalle relevante..."
              }
              className="mt-4 resize-none rounded-xl border border-white/08 bg-black/35 p-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime-300/40 transition"
            />

            {/* Botón de consulta */}
            <button
              onClick={startReading}
              disabled={loading || (active.title === "Cotilleo" && !cotilleoSign)}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 py-3.5 font-black text-black transition hover:bg-lime-200 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Consultando...
                </>
              ) : (
                "Consultar al oráculo"
              )}
            </button>

            {/* Subtle Gem Store CTA */}
            <div className="mt-4 text-center">
              <Link href="/dashboard/premium" className="text-xs text-lime-200/50 hover:text-lime-200 transition underline decoration-lime-200/30 underline-offset-4">
                ¿Te quedaste sin magia? Consigue más gemas aquí
              </Link>
            </div>

            {/* Estado de carga (ZodiLoader) */}
            {loading && (
              <ZodiLoader compact kind={active.kind} />
            )}

            {/* Resultado */}
            {result && !loading && (
              <ResultBox result={result} sectionTitle={active.title} />
            )}
          </div>
        </article>
      </section>
    </>
  );
}
