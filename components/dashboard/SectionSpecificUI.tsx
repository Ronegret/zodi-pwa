"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, RefreshCw, Star, Zap, Heart, Brain,
  LogOut, Trash2, Save, Camera, Check, X, Shuffle,
  Copy, Share2, BookOpen, AlertTriangle, Sparkles, ChartNoAxesCombined,
  Waves, NotebookPen, Gem, Lock, ChevronDown, Flame
} from "lucide-react";
import { getLocalSession, setLocalSession, signOutZodi } from "@/lib/session";
import { COUNTRY_LIST, getCitiesForCountry } from "@/lib/places";
import { getTodaysAstralContext, calculateSunSign, generateAstralProfile } from "@/lib/astral";
import type { DashboardSection } from "@/lib/dashboard-sections";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { AmigosSectionUI } from "@/components/dashboard/AmigosSectionUI";
import {
  addXp, updateStreak, XP_PER_ACTION, getGems, getXpData, getStreak,
  getLevel, getLevelTitle, xpToNextLevel,
} from "@/lib/gamification";
import { InstallPwaCard } from "@/components/pwa/PwaBoot";

// ─────────────────────────────────────────────────────────────────────────────
// ZODIAC DATA
// ─────────────────────────────────────────────────────────────────────────────
const ZODIAC = [
  { name: "Aries",       emoji: "♈", el: "Fuego",  dates: "21 Mar - 19 Abr" },
  { name: "Tauro",       emoji: "♉", el: "Tierra", dates: "20 Abr - 20 May" },
  { name: "Géminis",     emoji: "♊", el: "Aire",   dates: "21 May - 20 Jun" },
  { name: "Cáncer",      emoji: "♋", el: "Agua",   dates: "21 Jun - 22 Jul" },
  { name: "Leo",         emoji: "♌", el: "Fuego",  dates: "23 Jul - 22 Ago" },
  { name: "Virgo",       emoji: "♍", el: "Tierra", dates: "23 Ago - 22 Sep" },
  { name: "Libra",       emoji: "♎", el: "Aire",   dates: "23 Sep - 22 Oct" },
  { name: "Escorpio",    emoji: "♏", el: "Agua",   dates: "23 Oct - 21 Nov" },
  { name: "Sagitario",   emoji: "♐", el: "Fuego",  dates: "22 Nov - 21 Dic" },
  { name: "Capricornio", emoji: "♑", el: "Tierra", dates: "22 Dic - 19 Ene" },
  { name: "Acuario",     emoji: "♒", el: "Aire",   dates: "20 Ene - 18 Feb" },
  { name: "Piscis",      emoji: "♓", el: "Agua",   dates: "19 Feb - 20 Mar" },
];

const RUNAS = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];
const RUNA_NAMES = ["Fehu","Uruz","Thurisaz","Ansuz","Raidho","Kenaz","Gebo","Wunjo","Hagalaz","Naudiz","Isa","Jera","Eihwaz","Perthro","Algiz","Sowilo","Tiwaz","Berkano","Ehwaz","Mannaz","Laguz","Ingwaz","Dagaz","Othala"];

const CRISTALES = [
  { name: "Amatista",        emoji: "💜", intent: "Intuición & paz",   color: "border-purple-400/50 bg-purple-500/10" },
  { name: "Cuarzo rosa",     emoji: "🌸", intent: "Amor & autoestima",  color: "border-pink-400/50 bg-pink-500/10" },
  { name: "Obsidiana",       emoji: "🖤", intent: "Protección & verdad", color: "border-gray-600/50 bg-gray-800/30" },
  { name: "Citrino",         emoji: "🌕", intent: "Abundancia & éxito",  color: "border-yellow-400/50 bg-yellow-500/10" },
  { name: "Lapislázuli",     emoji: "💙", intent: "Comunicación & calma", color: "border-blue-400/50 bg-blue-500/10" },
  { name: "Selenita",        emoji: "🤍", intent: "Claridad & limpieza",  color: "border-white/40 bg-white/5" },
  { name: "Turmalina negra", emoji: "⬛", intent: "Bloqueo de energías",  color: "border-gray-800/60 bg-gray-900/40" },
  { name: "Malaquita",       emoji: "💚", intent: "Transformación",       color: "border-green-500/50 bg-green-500/10" },
];

const INTENTS = ["Amor", "Protección", "Claridad", "Abundancia", "Sanación", "Creatividad", "Intuición", "Calma"];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CONSULT HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useConsult(section: DashboardSection) {
  const [reply, setReply]   = useState("");
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState<"breve" | "normal" | "extensa">("normal");
  // Tono inicializado desde la preferencia del usuario — no hardcodeado a "directo"
  const [tone, setTone] = useState<string>(() => getLocalSession().onboardingData?.readingTone ?? "directo");
  const [session] = useState(getLocalSession);
  const [profile] = useState(() => buildProfile(getLocalSession()));

  const lengthRef  = useRef(length);
  const sectionRef = useRef(section);
  const profileRef = useRef(profile);
  const toneRef    = useRef(tone);
  lengthRef.current  = length;
  sectionRef.current = section;
  toneRef.current    = tone;
  profileRef.current = buildProfile(getLocalSession());

  const consult = useCallback(async (input: string) => {
    const sec  = sectionRef.current;
    const len  = lengthRef.current;
    const base = profileRef.current;
    // Siempre inyectar el tono seleccionado en el perfil para que buildReadingPrompt
    // lo use correctamente — no solo como texto en el input
    const prof = base ? { ...base, readingTone: toneRef.current } : null;

    if (!input.trim() && !sec.prompt) return;
    setLoading(true);
    setReply("");

    const lengthHints: Record<string, string> = {
      breve:   "\n[LONGITUD: Respuesta BREVE. Máximo 4 frases directas, sin introducciones ni conclusiones largas.]",
      extensa: "\n[LONGITUD: Respuesta EXTENSA. Lectura amplia y detallada, desarrolla cada aspecto con matices concretos.]",
    };
    const fullInput = input + (lengthHints[len] ?? "");

    try {
      const { getFirebaseToken } = await import("@/lib/firebase/client");
      const token = await getFirebaseToken();

      let res: Response;
      try {
        res = await fetch("/api/ai/reading", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ provider: "auto", kind: sec.kind, input: fullInput, profile: prof }),
          signal: AbortSignal.timeout(25000),
        });
      } catch (fetchErr: any) {
        const isTimeout = fetchErr?.name === "TimeoutError";
        setReply(isTimeout
          ? "Los astros tardaron demasiado. Reintenta en un momento. ⏳"
          : "Sin conexión con el servidor. Si estás en local, asegúrate de tener npm run dev activo. 🔌");
        return;
      }

      let data: any;
      try {
        data = await res.json();
      } catch {
        setReply("El servidor respondió algo raro. Recarga la página e inténtalo de nuevo. 🔄");
        return;
      }

      if (!res.ok) {
        setReply(data?.error || data?.text || "Error del servidor. Reintenta en un momento.");
        return;
      }
      setReply(data.text || data.reading || "El universo tardó demasiado. Reintenta.");
    } catch {
      setReply("Señal cortada. El universo también tiene días de mala cobertura.");
    } finally {
      setLoading(false);
    }
  }, []); // referencia estable — usa refs internamente

  return { reply, loading, consult, session, profile, length, setLength, tone, setTone };
}

function buildProfile(session: ReturnType<typeof getLocalSession>) {
  const od = session.onboardingData;
  const ap = session.astralProfile ?? (od?.birthDate ? generateAstralProfile(od) : null);
  if (!od && !ap) return null;

  const zodiac = od?.birthDate ? calculateSunSign(od.birthDate) : (ap?.sunSign ?? "");

  return {
    uid:                session.uid,
    displayName:        session.displayName ?? od?.displayName,
    zodiac,
    moonSign:           ap?.moonSign ?? "",
    ascendant:          ap?.ascendant ?? "",
    birthDate:          od?.birthDate ?? "",
    birthTime:          od?.birthTime ?? "",
    birthCity:          od?.birthCity ?? "",
    birthCountry:       od?.birthCountry ?? "",
    currentCity:        od?.currentCity ?? "",
    currentCountry:     od?.currentCountry ?? "",
    lifePathNumber:     ap?.lifePathNumber ?? 0,
    chineseZodiac:      ap?.chineseZodiac ?? "",
    mayanSign:          ap?.mayanSign ?? "",
    readingTone:        od?.readingTone ?? "directo",
    favoriteTopics:     od?.favoriteTopics ?? [],
    level:              1,
    // Contexto vital
    relationshipStatus: od?.relationshipStatus,
    partnerName:        od?.partnerName,
    partnerBirthDate:   od?.partnerBirthDate,
    hasKids:            od?.hasKids,
    kidsCount:          od?.kidsCount,
    personalBio:        od?.personalBio,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN TEXT — renders common AI markdown patterns inline (no extra deps)
// ─────────────────────────────────────────────────────────────────────────────
function MarkdownText({ text }: { text: string }) {
  function parseInline(s: string, key: number): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      if (m[2]) parts.push(<strong key={`b${m.index}`} className="font-black text-white">{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={`i${m.index}`} className="italic text-white/80">{m[3]}</em>);
      else if (m[4]) parts.push(<code key={`c${m.index}`} className="rounded bg-white/10 px-1 py-0.5 text-lime-300 font-mono text-[0.8em]">{m[4]}</code>);
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.length > 0 ? parts : s;
  }

  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^-{3,}$/.test(line.trim())) {
      nodes.push(<hr key={i} className="border-white/15 my-3" />);
    } else if (line.startsWith("### ")) {
      nodes.push(<h3 key={i} className="mt-4 mb-1 text-base font-black text-lime-300">{parseInline(line.slice(4), i)}</h3>);
    } else if (line.startsWith("## ")) {
      nodes.push(<h2 key={i} className="mt-5 mb-2 text-lg font-black text-lime-200">{parseInline(line.slice(3), i)}</h2>);
    } else if (line.startsWith("# ")) {
      nodes.push(<h1 key={i} className="mt-5 mb-2 text-xl font-black text-white">{parseInline(line.slice(2), i)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      nodes.push(
        <div key={i} className="flex gap-2">
          <span className="mt-1 text-lime-300 shrink-0">·</span>
          <span>{parseInline(line.slice(2), i)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />);
    } else {
      nodes.push(<p key={i} className="leading-7 text-white/88">{parseInline(line, i)}</p>);
    }
  }

  return <div className="space-y-0.5 font-sans">{nodes}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPLY BOX
// ─────────────────────────────────────────────────────────────────────────────
function ReplyBox({ reply, loading, sectionTitle = "Lectura ZODI" }: { reply: string; loading: boolean; sectionTitle?: string }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const awardedRef = useRef(false);

  // Award XP exactly once per new reading
  useEffect(() => {
    if (!reply || loading || awardedRef.current) return;
    awardedRef.current = true;
    updateStreak();
    addXp(sectionTitle);
    setXpGained(XP_PER_ACTION[sectionTitle] ?? XP_PER_ACTION._default);
    const t = setTimeout(() => setXpGained(null), 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reply]);

  // Reset award flag when reply resets (new consultation)
  useEffect(() => { if (!reply) awardedRef.current = false; }, [reply]);

  function copy() {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveReading() {
    try {
      const existing = JSON.parse(localStorage.getItem("zodi.readings") ?? "[]");
      const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        section: sectionTitle,
        text: reply,
      };
      const updated = [entry, ...existing].slice(0, 30); // max 30 lecturas guardadas
      localStorage.setItem("zodi.readings", JSON.stringify(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Si localStorage falla, ignorar silenciosamente
    }
  }

  async function share() {
    const shareText = `Mi lectura ZODI — ${sectionTitle}:\n\n${reply.slice(0, 800)}${reply.length > 800 ? "..." : ""}\n\n🔮 zodi.aibueno.es`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `Mi lectura ZODI: ${sectionTitle}`,
          text: shareText,
        });
        return;
      } catch {
        // El usuario canceló o no disponible — fallback a copiar
      }
    }
    // Fallback: copiar al portapapeles
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="mt-6 flex items-center gap-3 rounded-md border border-lime-300/20 bg-black/40 p-5">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" />
      <span className="animate-pulse text-sm text-lime-300/70">El cosmos está procesando tu señal...</span>
    </div>
  );
  if (!reply) return null;
  return (
    <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* XP toast */}
      {xpGained !== null && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-300 animate-in fade-in duration-300">
          ✦ +{xpGained} XP
        </div>
      )}
      <div className="rounded-xl border border-lime-300/30 bg-black/60 p-6 sm:p-8 text-base sm:text-lg leading-[1.8] tracking-wide text-white/95 shadow-[0_0_30px_rgba(184,255,23,0.05)]">
        <MarkdownText text={reply} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/55 transition hover:text-white/80"
        >
          {copied ? <><Check className="h-3 w-3 text-lime-300" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
        </button>
        <button
          onClick={saveReading}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold transition ${
            saved
              ? "border-lime-300/50 bg-lime-300/10 text-lime-300"
              : "border-lime-300/20 text-lime-200/70 hover:text-lime-200"
          }`}
        >
          {saved ? <><Check className="h-3 w-3" /> Guardado</> : <><Star className="h-3 w-3" /> Guardar</>}
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/55 transition hover:text-white/80"
        >
          <Share2 className="h-3 w-3" /> Compartir
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TONE SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
function ToneSelector({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  const tones = [
    { key: "suave",    label: "Suave",    emoji: "🌙", desc: "Con cariño" },
    { key: "directo",  label: "Directo",  emoji: "⚡", desc: "Sin rodeos" },
    { key: "brutal",   label: "Brutal",   emoji: "🔥", desc: "Sin filtros" },
    { key: "sarcastico", label: "Sarcástico", emoji: "💀", desc: "Con veneno" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      <p className="w-full text-xs uppercase tracking-widest text-white/40 mb-1">Tono de respuesta</p>
      {tones.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition ${
            value === t.key
              ? "bg-lime-300 text-black"
              : "border border-white/10 text-white/60 hover:border-lime-300/40 hover:text-lime-200"
          }`}
        >
          {t.emoji} {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LENGTH SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
function LengthSelector({ value, onChange }: { value: string; onChange: (l: "breve" | "normal" | "extensa") => void }) {
  const options = [
    { key: "breve"   as const, label: "Breve",   emoji: "⚡", desc: "4 frases clave" },
    { key: "normal"  as const, label: "Normal",  emoji: "📖", desc: "Estándar" },
    { key: "extensa" as const, label: "Extensa", emoji: "📜", desc: "Análisis profundo" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      <p className="w-full text-xs uppercase tracking-widest text-white/40 mb-1">Longitud de respuesta</p>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          title={o.desc}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition ${
            value === o.key
              ? "bg-cyan-300 text-black"
              : "border border-white/10 text-white/60 hover:border-cyan-300/40 hover:text-cyan-200"
          }`}
        >
          {o.emoji} {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TAROT UI
// ─────────────────────────────────────────────────────────────────────────────
function TarotUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength, tone, setTone } = useConsult(section);
  const [spread, setSpread] = useState<"1" | "3" | "celta">("3");
  const [question, setQuestion] = useState("");
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [drawn, setDrawn] = useState(false);

  const spreads = [
    { key: "1",     label: "1 carta",      emoji: "🃏", desc: "Respuesta directa" },
    { key: "3",     label: "3 cartas",     emoji: "🎴", desc: "Pasado · Presente · Futuro" },
    { key: "celta", label: "Cruz celta",   emoji: "✝️",  desc: "Lectura profunda" },
  ] as const;

  const cardCount = spread === "1" ? 1 : spread === "3" ? 3 : 6;
  const cardLabels3 = ["Pasado", "Presente", "Futuro"];
  const cardLabelsCelta = ["Situación", "Obstáculo", "Pasado", "Futuro", "Consejo", "Resultado"];

  function drawCards() {
    setFlipped(Array(cardCount).fill(false));
    setDrawn(true);
  }

  function flipCard(i: number) {
    setFlipped(prev => { const n = [...prev]; n[i] = true; return n; });
  }

  async function readCards() {
    const labels = spread === "3" ? cardLabels3 : spread === "celta" ? cardLabelsCelta : ["Carta"];
    const extra = `Tipo de tirada: ${spread === "1" ? "Una carta" : spread === "3" ? "Tres cartas" : "Cruz celta"}\nPosiciones: ${labels.join(", ")}\nTono: ${tone}\n${question ? `Consulta: ${question}` : ""}`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {/* Spread selector */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">Elige tu tirada</h2>
        <div className="grid grid-cols-3 gap-3">
          {spreads.map(s => (
            <button
              key={s.key}
              onClick={() => { setSpread(s.key); setDrawn(false); setFlipped([]); }}
              className={`rounded-md border p-4 text-center transition ${
                spread === s.key
                  ? "border-lime-300 bg-lime-300/10 text-lime-200"
                  : "border-white/10 text-white/60 hover:border-lime-300/30"
              }`}
            >
              <div className="text-2xl mb-1">{s.emoji}</div>
              <p className="font-black text-sm">{s.label}</p>
              <p className="text-xs text-white/40 mt-1">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cards area */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-2">Tu tirada</h2>
        <p className="text-sm text-white/50 mb-5">
          {drawn ? "Haz clic en cada carta para revelarla" : "Haz clic en 'Robar cartas' para empezar"}
        </p>

        {!drawn ? (
          <div className="flex justify-center">
            <button
              onClick={drawCards}
              className="flex items-center gap-2 rounded-md bg-lime-300 px-8 py-4 font-black text-black hover:bg-lime-200 transition"
            >
              <Shuffle className="h-5 w-5" /> Robar cartas
            </button>
          </div>
        ) : (
          <div className={`grid gap-3 ${cardCount === 1 ? "max-w-xs mx-auto" : cardCount === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
            {Array.from({ length: cardCount }).map((_, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-lime-200/50 uppercase tracking-widest mb-2">
                  {spread === "3" ? cardLabels3[i] : spread === "celta" ? cardLabelsCelta[i] : "Carta"}
                </p>
                <div className="relative w-full aspect-[2/3] perspective-1000">
                  <button
                    onClick={() => flipCard(i)}
                    className="relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer"
                    style={{
                      transform: flipped[i] ? "rotateY(180deg)" : "rotateY(0deg)",
                      transformStyle: "preserve-3d"
                    }}
                  >
                    {/* Back of Card */}
                    <div 
                      className="absolute inset-0 w-full h-full backface-hidden rounded-xl border border-white/20 overflow-hidden bg-black shadow-[0_0_20px_rgba(184,255,23,0.15)]"
                      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    >
                      <div className="absolute inset-0 bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/Imagen-general-tarot-ZODI.webp')] bg-cover bg-center opacity-80 hover:opacity-100 hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                        <span className="text-4xl text-lime-300 animate-pulse text-center drop-shadow-[0_0_10px_rgba(184,255,23,0.8)]">✦</span>
                        <p className="text-[10px] uppercase font-black text-lime-300 tracking-[0.3em] text-center mt-2">Tocar</p>
                      </div>
                    </div>

                    {/* Front of Card */}
                    <div 
                      className="absolute inset-0 w-full h-full backface-hidden rounded-xl border border-lime-300/40 overflow-hidden bg-black shadow-[0_0_30px_rgba(184,255,23,0.4)]"
                      style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    >
                      <div className={`absolute inset-0 bg-cover bg-center opacity-90 mix-blend-screen transition duration-500 ${
                        ["bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Verdad.webp')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/El-Karma.webp')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Red-Flag.webp')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/El-Destino.webp')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Mala-Idea.webp')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Venganza-Cosmica.webp')]"][i % 6]
                      }`} />
                      <div className="absolute inset-0 flex flex-col items-center justify-end p-4 bg-gradient-to-t from-black/90 via-black/40 to-black/10">
                        <p className="text-xs font-black text-lime-300 tracking-[0.2em] uppercase text-center leading-tight drop-shadow-md">
                          {spread === "3" ? cardLabels3[i] : spread === "celta" ? cardLabelsCelta[i] : "Energía"}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {drawn && (
          <div className="mt-6 grid gap-4">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={2}
              placeholder="¿Tienes una pregunta concreta? (opcional)"
              className="w-full resize-none rounded-md border border-white/10 bg-black/45 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime-300/55"
            />
            <ToneSelector value={tone} onChange={setTone} />
            <LengthSelector value={length} onChange={setLength} />
            <button
              onClick={readCards}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-md bg-lime-300 px-6 py-3 font-black text-black disabled:opacity-60"
            >
              <BookOpen className="h-4 w-4" />
              {loading ? "El tarot habla..." : "Leer las cartas"}
            </button>
          </div>
        )}
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. NOMBRE UI
// ─────────────────────────────────────────────────────────────────────────────
function NombreUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength, session } = useConsult(section);
  const od = session.onboardingData;
  const ap = session.astralProfile ?? (od?.birthDate ? generateAstralProfile(od) : null);
  // Pre-llenar desde sesión
  const [nombre, setNombre] = useState(od?.displayName?.split(" ")[0] ?? "");
  const [ap1, setAp1] = useState(od?.lastName?.split(" ")[0] ?? "");
  const [ap2, setAp2] = useState(od?.lastName?.split(" ").slice(1).join(" ") ?? "");
  const [mode, setMode] = useState<"vibracion" | "historia" | "genealogia" | "completo">("historia");

  const modes = [
    { key: "completo",   label: "Todo junto",        emoji: "✨", desc: "Nombre + constelaciones + historia completa" },
    { key: "historia",   label: "Historia ZODI",     emoji: "📖", desc: "Tu nombre convertido en mito" },
    { key: "vibracion",  label: "Vibración",         emoji: "🔢", desc: "Energía numerológica completa" },
    { key: "genealogia", label: "Genealogía",        emoji: "🌳", desc: "Qué cargan tus apellidos" },
  ] as const;

  // Numerología por letra
  const TABLA: Record<string, number> = {
    a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,
    j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,
    s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8
  };
  function vibrar(str: string) {
    let sum = str.toLowerCase().replace(/[^a-záéíóúñü]/g, "")
      .split("").reduce((a, c) => a + (TABLA[c] || 0), 0);
    while (sum > 9 && ![11,22,33].includes(sum)) {
      sum = String(sum).split("").reduce((a,c)=>a+Number(c),0);
    }
    return sum;
  }

  const nombreCompleto = [nombre, ap1, ap2].filter(Boolean).join(" ");
  const vibrNombre = nombre ? vibrar(nombre) : null;
  const vibrAp1 = ap1 ? vibrar(ap1) : null;
  const vibrAp2 = ap2 ? vibrar(ap2) : null;
  const vibrTotal = nombreCompleto ? vibrar(nombreCompleto) : null;

  async function analyze() {
    if (!nombre.trim()) return;
    // Contexto astral del usuario para el análisis completo
    const ctx = getTodaysAstralContext();
    const astralCtx = ap
      ? `Datos astrales del portador: nacido/a el ${od?.birthDate ?? "?"} en ${od?.birthCity ?? "?"}, ${od?.birthCountry ?? "?"}. ` +
        `Signo solar: ${ap.sunSign}. Luna en ${ap.moonSign}. Ascendente ${ap.ascendant}. ` +
        `Camino de vida: ${ap.lifePathNumber}. Chino: ${ap.chineseZodiac}. Maya: ${ap.mayanSign}. ` +
        `Hoy (${ctx.dateReadable}): Sol en ${ctx.sunTransit}, Luna ${ctx.moonPhase}, Vibración ${ctx.dayVibration}.`
      : "";
    const modeLabel = mode === "completo"
      ? `ANÁLISIS COMPLETO. Une todo: vibración numerológica del nombre completo, origen ancestral, herencia de los apellidos, conexión con las constelaciones de la fecha de nacimiento, y cómo todo eso se activa HOY (${ctx.dateReadable}). Escribe una historia mítica ZODI sobre esta persona que parezca hecha a medida. Humor ácido pero que haga sentir especial. Incluye al menos una referencia pop o cultural que encaje con su generación.`
      : mode === "historia"
      ? "Historia mística estilo ZODI (cyberpunk, oscuro, divertido) sobre el origen y energía del nombre completo. Que la persona quiera compartirla."
      : mode === "vibracion"
      ? "Vibración numerológica detallada: calcula cada parte del nombre por separado y el total. Explica qué significa para su vida."
      : "Genealogía energética de los apellidos: herencia emocional, karma familiar y raíces que carga sin saberlo.";

    const extra = `Nombre: ${nombre}. Primer apellido: ${ap1 || "no indicado"}. Segundo apellido: ${ap2 || "no indicado"}. Nombre completo: ${nombreCompleto}. Vibración total: ${vibrTotal}.\n${astralCtx}\n${modeLabel}`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {/* Name inputs */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">Tu firma energética</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { val: nombre, set: setNombre, ph: "Tu nombre", label: "Nombre" },
            { val: ap1,    set: setAp1,    ph: "Primer apellido", label: "1er apellido" },
            { val: ap2,    set: setAp2,    ph: "Segundo apellido (opcional)", label: "2do apellido" },
          ].map(f => (
            <label key={f.label} className="block">
              <span className="text-xs uppercase tracking-widest text-white/40">{f.label}</span>
              <input
                value={f.val}
                onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/45 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-lime-300/55"
              />
            </label>
          ))}
        </div>

        {/* Vibration preview */}
        {nombreCompleto && (
          <div className="mt-4 flex flex-wrap gap-3">
            {nombre && <span className="rounded-md bg-purple-500/20 border border-purple-400/30 px-3 py-1.5 text-xs font-bold text-purple-300">{nombre} → {vibrNombre}</span>}
            {ap1 && <span className="rounded-md bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 text-xs font-bold text-blue-300">{ap1} → {vibrAp1}</span>}
            {ap2 && <span className="rounded-md bg-cyan-500/20 border border-cyan-400/30 px-3 py-1.5 text-xs font-bold text-cyan-300">{ap2} → {vibrAp2}</span>}
            <span className="rounded-md bg-lime-400/20 border border-lime-400/40 px-3 py-1.5 text-xs font-black text-lime-300">Vibración total: {vibrTotal}</span>
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">¿Qué quieres saber?</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`rounded-md border p-4 text-left transition ${
                mode === m.key
                  ? "border-lime-300 bg-lime-300/10"
                  : "border-white/10 hover:border-lime-300/30"
              }`}
            >
              <div className="text-2xl mb-2">{m.emoji}</div>
              <p className="font-black text-sm">{m.label}</p>
              <p className="text-xs text-white/40 mt-1">{m.desc}</p>
            </button>
          ))}
        </div>
        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={analyze}
          disabled={loading || !nombre.trim()}
          className="mt-3 w-full rounded-md bg-lime-300 py-3 font-black text-black disabled:opacity-50 hover:bg-lime-200 transition"
        >
          {loading ? "ZODI descifra tu esencia..." : mode === "completo" ? "✨ Análisis completo — todo junto" : mode === "historia" ? "📖 Crear mi historia" : mode === "vibracion" ? "🔢 Analizar vibración" : "🌳 Analizar genealogía"}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LECTURA DE MANO UI
// ─────────────────────────────────────────────────────────────────────────────
function ManoUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [imageUploaded, setImageUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const zones = [
    { id: "vida",    label: "Línea de la vida",     desc: "Vitalidad y ciclos",       emoji: "💚" },
    { id: "corazon",label: "Línea del corazón",     desc: "Amor y emociones",         emoji: "❤️" },
    { id: "cabeza",  label: "Línea de la cabeza",   desc: "Mente y decisiones",       emoji: "💜" },
    { id: "destino", label: "Línea del destino",    desc: "Vocación y propósito",     emoji: "⭐" },
    { id: "venus",   label: "Monte de Venus",        desc: "Sensualidad y afecto",     emoji: "🌹" },
  ];

  function toggleZone(id: string) {
    setSelectedZones(prev => prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setImageUploaded(true);
  }

  async function read() {
    const zonesText = selectedZones.length > 0
      ? `Analiza especialmente estas líneas: ${selectedZones.map(z => zones.find(x=>x.id===z)?.label).join(", ")}.`
      : "Analiza todas las líneas principales.";
    const descText = description ? `Descripción de la mano: ${description}.` : imageUploaded ? "El usuario ha subido una foto de su mano." : "";
    await consult(`${section.prompt}\n${zonesText}\n${descText}`);
  }

  return (
    <div className="grid gap-5">
      {/* Upload zone */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-2">Sube una foto o describe tu mano</h2>
        <p className="text-sm text-white/50 mb-5">ZODI lee las líneas de tu mano de forma simbólica — sin circo, sin drama, con perspectiva.</p>

        <div
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition ${
            imageUploaded
              ? "border-lime-300/50 bg-lime-300/5"
              : "border-white/15 hover:border-lime-300/30 hover:bg-white/[0.02]"
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {imageUploaded ? (
            <>
              <div className="text-4xl mb-2">✅</div>
              <p className="font-black text-lime-300">Foto cargada</p>
              <p className="text-xs text-white/40 mt-1">Haz clic para cambiarla</p>
            </>
          ) : (
            <>
              <Camera className="h-10 w-10 mx-auto mb-3 text-white/30" />
              <p className="font-black text-white/70">Sube una foto de tu palma</p>
              <p className="text-xs text-white/35 mt-1">JPG, PNG — mano extendida, luz natural</p>
            </>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">O describe tu mano</p>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Ej: línea de la vida larga y curva, línea del corazón profunda pero fragmentada..."
            className="w-full resize-none rounded-md border border-white/10 bg-black/45 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime-300/55"
          />
        </div>
      </div>

      {/* Zone selector */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-2">¿Qué líneas te interesan más?</h2>
        <p className="text-sm text-white/50 mb-4">Selecciona las que quieres que ZODI analice con más detalle (o déjalas todas)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {zones.map(z => (
            <button
              key={z.id}
              onClick={() => toggleZone(z.id)}
              className={`flex items-center gap-3 rounded-md border p-3 text-left transition ${
                selectedZones.includes(z.id)
                  ? "border-lime-300/60 bg-lime-300/10"
                  : "border-white/10 hover:border-lime-300/25"
              }`}
            >
              <span className="text-xl">{z.emoji}</span>
              <div>
                <p className="font-black text-sm">{z.label}</p>
                <p className="text-xs text-white/40">{z.desc}</p>
              </div>
              {selectedZones.includes(z.id) && <Check className="h-4 w-4 text-lime-300 ml-auto shrink-0" />}
            </button>
          ))}
        </div>
        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={read}
          disabled={loading || (!imageUploaded && !description.trim())}
          className="mt-3 w-full rounded-md bg-lime-300 py-3 font-black text-black disabled:opacity-50 hover:bg-lime-200 transition"
        >
          {loading ? "Las líneas hablan..." : "Leer mi mano"}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPATIBILIDAD UI
// ─────────────────────────────────────────────────────────────────────────────

// Mapa explícito signo → nombre de archivo (sin acentos, capitalizado)
const SIGN_TO_FILE: Record<string, string> = {
  "Aries": "Aries", "Tauro": "Tauro", "Géminis": "Geminis",
  "Cáncer": "Cancer", "Leo": "Leo", "Virgo": "Virgo",
  "Libra": "Libra", "Escorpio": "Escorpio", "Sagitario": "Sagitario",
  "Capricornio": "Capricornio", "Acuario": "Acuario", "Piscis": "Piscis",
};
function signImgPath(sign: string): string {
  const file = SIGN_TO_FILE[sign]
    ?? sign.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return `/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${file}.webp`;
}

// Tarjeta grande de signo con imagen artwork + radio + sombra neon
function SignCard({ sign, label, sublabel }: { sign: string; label?: string; sublabel?: string }) {
  const neonColors: Record<string, string> = {
    Aries: "rgba(239,68,68,0.45)", Tauro: "rgba(34,197,94,0.45)",
    "Géminis": "rgba(234,179,8,0.45)", "Cáncer": "rgba(148,163,184,0.45)",
    Leo: "rgba(251,191,36,0.45)", Virgo: "rgba(132,204,22,0.45)",
    Libra: "rgba(244,114,182,0.45)", Escorpio: "rgba(168,85,247,0.45)",
    Sagitario: "rgba(139,92,246,0.45)", Capricornio: "rgba(120,113,108,0.45)",
    Acuario: "rgba(6,182,212,0.45)", Piscis: "rgba(20,184,166,0.45)",
  };
  const glow = neonColors[sign] ?? "rgba(184,255,23,0.35)";

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] uppercase tracking-widest text-white/40">{label ?? "Signo solar"}</p>
      <div
        className="relative w-full aspect-square max-w-[180px] rounded-2xl overflow-hidden border border-white/10"
        style={{ boxShadow: `0 0 28px ${glow}, 0 4px 20px rgba(0,0,0,0.6)` }}
      >
        <Image
          src={signImgPath(sign)}
          alt={sign}
          fill
          sizes="180px"
          className="object-cover transition-transform duration-500 hover:scale-105"
          priority
        />
        {/* Gradiente inferior para el texto */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-10 pb-3 px-3 text-center">
          <p className="text-lg font-black text-white drop-shadow-lg">{sign}</p>
          {sublabel && <p className="text-[10px] text-white/55 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    </div>
  );
}

function CompatibilidadUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const [theirSign, setTheirSign] = useState("");
  const [theirName, setTheirName] = useState("");
  const [relation, setRelation] = useState<"pareja" | "amistad" | "trabajo">("pareja");

  // Signo calculado siempre desde birthDate
  const od = session.onboardingData;
  const mySign = (od?.birthDate ? calculateSunSign(od.birthDate) : null)
    || session.astralProfile?.sunSign
    || "";

  const relations = [
    { key: "pareja",  label: "Pareja",  emoji: "💕" },
    { key: "amistad", label: "Amistad", emoji: "🤝" },
    { key: "trabajo", label: "Trabajo", emoji: "💼" },
  ] as const;

  async function analyze() {
    if (!theirSign) return;
    const extra = `Mi signo: ${mySign}. Signo de ${theirName || "la otra persona"}: ${theirSign}. Tipo de relación: ${relation}. Analiza química, comunicación, conflictos posibles, timing y consejo. Sé directo, ácido y útil.`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {/* Tipo de relación */}
      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-xl font-black mb-4">Tipo de relación</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {relations.map(r => (
            <button
              key={r.key}
              onClick={() => setRelation(r.key)}
              className={`rounded-xl border py-3 text-center font-black text-sm transition active:scale-95 ${
                relation === r.key
                  ? "border-lime-300 bg-lime-300/10 text-lime-200 shadow-[0_0_12px_rgba(184,255,23,0.15)]"
                  : "border-white/10 text-white/60 hover:border-lime-300/25"
              }`}
            >
              <span className="block text-xl mb-0.5">{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Los dos perfiles */}
      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-xl font-black mb-5">Los dos perfiles</h2>
        <div className="grid gap-5 sm:grid-cols-2">

          {/* ── MI SIGNO ── */}
          <div className="rounded-2xl border border-lime-300/20 bg-lime-300/5 p-4">
            {mySign ? (
              <SignCard sign={mySign} label="Tú" sublabel={ZODIAC.find(z => z.name === mySign)?.dates} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="text-5xl">⭐</div>
                <p className="text-sm font-bold text-white/50">Añade tu fecha de nacimiento en el perfil</p>
                <a href="/dashboard/perfil" className="text-xs font-black text-lime-300 underline underline-offset-4">Ir al perfil →</a>
              </div>
            )}
          </div>

          {/* ── SU SIGNO ── */}
          <div className="rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
            <input
              value={theirName}
              onChange={e => setTheirName(e.target.value)}
              placeholder="Nombre de la otra persona (opcional)"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime-300/40 transition"
            />

            {/* Si ya eligió signo, muestra card grande + botón cambiar */}
            {theirSign ? (
              <div className="relative">
                <SignCard sign={theirSign} label={theirName || "La otra persona"} sublabel={ZODIAC.find(z => z.name === theirSign)?.dates} />
                <button
                  onClick={() => setTheirSign("")}
                  className="mt-2 w-full rounded-xl border border-white/10 py-1.5 text-xs font-bold text-white/40 hover:text-white/70 transition"
                >
                  Cambiar signo
                </button>
              </div>
            ) : (
              /* Grid selector de signos */
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Elige su signo solar</p>
                <div className="grid grid-cols-4 gap-2">
                  {ZODIAC.map(z => (
                    <motion.button
                      key={z.name}
                      onClick={() => setTheirSign(z.name)}
                      title={z.name}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 transition-all"
                      style={theirSign === z.name
                        ? { boxShadow: "0 0 18px rgba(184,255,23,0.5)", border: "1px solid rgba(184,255,23,0.7)" }
                        : undefined
                      }
                    >
                      <Image
                        src={signImgPath(z.name)}
                        alt={z.name}
                        fill
                        sizes="80px"
                        className="object-cover transition-all duration-300 group-hover:scale-110"
                      />
                      {/* Overlay con nombre */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-4 pb-1 text-center">
                        <p className="text-[9px] font-black text-white/90 leading-tight">{z.name.slice(0, 5)}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VS badge central — solo cuando ambos signos están elegidos */}
        {mySign && theirSign && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-4 flex items-center justify-center gap-4"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-lime-300/30" />
            <span className="rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-1 text-xs font-black text-lime-300">
              {mySign} VS {theirSign}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-lime-300/30" />
          </motion.div>
        )}

        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={analyze}
          disabled={loading || !theirSign}
          className="mt-3 w-full rounded-2xl bg-lime-300 py-3.5 font-black text-black disabled:opacity-50 hover:bg-lime-200 transition active:scale-[0.99] text-sm sm:text-base"
        >
          {loading
            ? "Analizando la química..."
            : `Analizar compatibilidad ${relation === "pareja" ? "💕" : relation === "amistad" ? "🤝" : "💼"}`}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NUMEROLOGÍA UI
// ─────────────────────────────────────────────────────────────────────────────
function NumerologiaUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const ap = session.astralProfile;
  const lifePathNumber = ap?.lifePathNumber;

  const [targetNumber, setTargetNumber] = useState<number>(lifePathNumber ?? 1);
  const [cotilleoMode, setCotilleoMode] = useState(false);
  const [hasAutoConsulted, setHasAutoConsulted] = useState(false);

  const numberMeanings: Record<number, string> = {
    1: "El Pionero — liderazgo, independencia, inicio",
    2: "El Mediador — armonía, intuición, cooperación",
    3: "El Creador — expresión, alegría, comunicación",
    4: "El Constructor — orden, trabajo, estabilidad",
    5: "El Aventurero — libertad, cambio, versatilidad",
    6: "El Guardián — amor, responsabilidad, hogar",
    7: "El Buscador — espiritualidad, análisis, misterio",
    8: "El Manifestador — poder, ambición, abundancia",
    9: "El Sabio — compasión, humanidad, completud",
    11: "El Iluminado — inspiración, intuición elevada",
    22: "El Maestro Constructor — visión, poder, legado",
    33: "El Maestro Sanador — amor universal, guía",
  };

  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

  useEffect(() => {
    if (!hasAutoConsulted) {
      setHasAutoConsulted(true);
      const extra = `Camino de vida: ${targetNumber}. Haz una lectura general de este número y su significado. Añade contexto del año actual (${new Date().getFullYear()}).`;
      consult(`${section.prompt}\n${extra}`);
    }
  }, [hasAutoConsulted, targetNumber, consult, section.prompt]);

  async function analyzeCotilleo(n: number) {
    setTargetNumber(n);
    const extra = `Camino de vida: ${n}. Haz una lectura general de este número y su significado. Añade contexto del año actual (${new Date().getFullYear()}). Es en modo cotilleo (sobre otra persona).`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {/* Life path display */}
      <div className="glass-panel rounded-md overflow-hidden">
        {/* Large centered image */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[500px] bg-black">
          <Image
            src={`/zodi-art/nuevas/7-Numerologia/${targetNumber}.webp`}
            alt={`Número ${targetNumber}`}
            fill
            className="object-contain"
            priority
          />
          {/* Number overlay — bottom-center */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-lime-200/80 mb-1">
              {targetNumber === lifePathNumber ? "Tu camino de vida" : "Modo cotilleo"}
            </p>
            <p className="text-6xl font-black text-lime-300 drop-shadow-[0_0_20px_rgba(184,255,23,0.6)]">{targetNumber}</p>
            <p className="mt-2 text-lg font-black text-white">{numberMeanings[targetNumber] ?? "Número especial"}</p>
          </div>
        </div>

        {targetNumber === lifePathNumber && (
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Año personal", value: (() => { const y = new Date().getFullYear(); let s = String(y).split("").reduce((a,c)=>a+Number(c),0); while(s>9&&![11,22,33].includes(s)){s=String(s).split("").reduce((a,c)=>a+Number(c),0)} return s; })() },
                { label: "Mes personal", value: new Date().getMonth() + 1 },
                { label: "Día personal", value: new Date().getDate() },
                { label: "Camino de vida", value: lifePathNumber },
              ].map(item => (
                <div key={item.label} className="rounded-md border border-white/10 bg-black/30 p-3 text-center">
                  <p className="text-xs text-white/40 mb-1">{item.label}</p>
                  <p className="text-2xl font-black text-lime-300">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">Modo Cotilleo</h2>
          <button
            onClick={() => setCotilleoMode(!cotilleoMode)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cotilleoMode ? "bg-lime-300 text-black" : "border border-white/20 text-white/60 hover:text-white"}`}
          >
            {cotilleoMode ? "Activado" : "Activar"}
          </button>
        </div>
        
        {cotilleoMode && (
          <div>
            <p className="text-sm text-white/50 mb-4">Selecciona el número de alguien más para ver su perfil numerológico.</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {allNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => analyzeCotilleo(n)}
                  title={`Número ${n}`}
                  className={`relative aspect-square w-full rounded-md border transition overflow-hidden ${
                    targetNumber === n ? "border-lime-300 ring-2 ring-lime-300 shadow-[0_0_15px_rgba(184,255,23,0.3)] scale-105" : "border-white/10 opacity-70 hover:opacity-100 hover:border-lime-300/40"
                  }`}
                >
                  <Image src={`/zodi-art/nuevas/7-Numerologia/${n}.webp`} alt={`Número ${n}`} fill className="object-cover" />
                </button>
              ))}
            </div>
            <LengthSelector value={length} onChange={setLength} />
          </div>
        )}
      </div>

      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ROAST UI
// ─────────────────────────────────────────────────────────────────────────────
function RoastUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const [intensity, setIntensity] = useState(3);
  const [targetSign, setTargetSign] = useState(session.astralProfile?.sunSign ?? "");
  const [roastTarget, setRoastTarget] = useState<"yo" | "otro">("yo");

  const intensityLabels = ["", "Gentil 🌸", "Honesto 😏", "Directo ⚡", "Sin filtros 🔥", "Devastador 💀"];
  const intensityColors = ["", "text-green-300", "text-yellow-300", "text-orange-300", "text-red-400", "text-pink-500"];

  async function roast() {
    const intensityDesc = `Intensidad ${intensity}/5: ${intensityLabels[intensity]}`;
    const extra = `Signo a roastear: ${targetSign}. ${intensityDesc}. ${roastTarget === "otro" ? "Es una persona de mi entorno." : "Soy yo."} Sé creativo, específico, astuto y no cruel — el humor ácido con verdad es el objetivo.`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">¿A quién roasteamos?</h2>
        <div className="flex gap-3 mb-5">
          {[
            { key: "yo",   label: "A mí mismo", emoji: "😅" },
            { key: "otro", label: "A alguien más", emoji: "😈" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setRoastTarget(t.key as "yo" | "otro")}
              className={`flex-1 rounded-md border py-3 font-black text-sm transition ${
                roastTarget === t.key ? "border-orange-400 bg-orange-400/10 text-orange-300" : "border-white/10 text-white/60 hover:border-orange-400/30"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Signo solar del objetivo</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5">
          {ZODIAC.map(z => (
            <button
              key={z.name}
              onClick={() => setTargetSign(z.name)}
              title={z.name}
              aria-label={z.name}
              className={`rounded-md border p-2 text-center transition ${
                targetSign === z.name
                  ? "border-orange-400 bg-orange-400/15"
                  : "border-white/10 hover:border-orange-400/30"
              }`}
            >
              <div className="text-xl">{z.emoji}</div>
              <div className="text-[9px] text-white/40 mt-0.5 truncate">{z.name.slice(0,3)}</div>
            </button>
          ))}
        </div>

        {/* Intensity slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs uppercase tracking-widest text-white/40">Intensidad del roast</p>
            <span className={`text-sm font-black ${intensityColors[intensity]}`}>{intensityLabels[intensity]}</span>
          </div>
          <input
            type="range" min={1} max={5} value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full accent-orange-400"
          />
          <div className="flex justify-between text-[10px] text-white/25 mt-1">
            <span>Suave</span><span>Brutal</span>
          </div>
        </div>

        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={roast}
          disabled={loading || !targetSign}
          className="mt-3 w-full rounded-md bg-gradient-to-r from-orange-400 to-red-500 py-3 font-black text-black disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? "Preparando la verdad..." : `Roastear ${targetSign || "a alguien"} 🔥`}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. RUNAS UI
// ─────────────────────────────────────────────────────────────────────────────
function RunasUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<1 | 3>(3);

  function draw() {
    const indices: number[] = [];
    while (indices.length < spread) {
      const r = Math.floor(Math.random() * RUNAS.length);
      if (!indices.includes(r)) indices.push(r);
    }
    setDrawn(indices);
    setRevealed(Array(spread).fill(false));
  }

  function reveal(i: number) {
    setRevealed(prev => { const n = [...prev]; n[i] = true; return n; });
  }

  async function read() {
    const runasList = drawn.map((idx, i) => `${i + 1}. ${RUNAS[idx]} ${RUNA_NAMES[idx]}`).join(", ");
    const extra = `Runas tiradas: ${runasList}. ${question ? `Consulta: ${question}` : ""} Interpreta cada runa y su mensaje conjunto.`;
    await consult(`${section.prompt}\n${extra}`);
  }

  const positions = spread === 3 ? ["Pasado", "Presente", "Futuro"] : ["Tu runa"];

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">Tipo de tirada</h2>
        <div className="flex gap-3 mb-5">
          {([1, 3] as const).map(n => (
            <button
              key={n}
              onClick={() => { setSpread(n); setDrawn([]); setRevealed([]); }}
              className={`flex-1 rounded-md border py-3 font-black text-sm transition ${
                spread === n ? "border-lime-300 bg-lime-300/10 text-lime-200" : "border-white/10 text-white/60 hover:border-lime-300/25"
              }`}
            >
              {n === 1 ? "⚡ Una runa" : "ᚠ ᚢ ᚦ Tres runas"}
            </button>
          ))}
        </div>

        {drawn.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-6xl opacity-60 tracking-widest">ᚠ ᚢ ᚦ</div>
            <button
              onClick={draw}
              className="flex items-center gap-2 rounded-md bg-lime-300 px-8 py-3 font-black text-black hover:bg-lime-200 transition"
            >
              <Shuffle className="h-4 w-4" /> Tirar runas
            </button>
          </div>
        ) : (
          <div className={`grid gap-4 ${spread === 3 ? "grid-cols-3" : "max-w-xs mx-auto"}`}>
            {drawn.map((runaIdx, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-lime-200/50 uppercase tracking-widest mb-2">{positions[i]}</p>
                <button
                  onClick={() => reveal(i)}
                  className={`w-full aspect-square rounded-md border-2 flex flex-col items-center justify-center transition ${
                    revealed[i]
                      ? "border-lime-300/50 bg-lime-300/5"
                      : "border-white/20 hover:border-lime-300/30 cursor-pointer"
                  }`}
                >
                  {revealed[i] ? (
                    <>
                      <span className="text-4xl font-bold text-lime-300">{RUNAS[runaIdx]}</span>
                      <span className="text-xs text-white/60 mt-1">{RUNA_NAMES[runaIdx]}</span>
                    </>
                  ) : (
                    <span className="text-2xl opacity-30">✦</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {drawn.length > 0 && (
          <div className="mt-5 grid gap-3">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={2}
              placeholder="¿Qué querías saber? (opcional)"
              className="w-full resize-none rounded-md border border-white/10 bg-black/45 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime-300/55"
            />
            <div className="flex gap-3">
              <button onClick={draw} className="rounded-md border border-white/15 px-5 py-2.5 text-sm font-bold text-white/60 hover:text-white/80 transition">
                Nueva tirada
              </button>
              <LengthSelector value={length} onChange={setLength} />
              <button
                onClick={read}
                disabled={loading}
                className="flex-1 rounded-md bg-lime-300 py-2.5 font-black text-black disabled:opacity-50"
              >
                {loading ? "Las runas hablan..." : "Interpretar"}
              </button>
            </div>
          </div>
        )}
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CRISTALES UI
// ─────────────────────────────────────────────────────────────────────────────
function CristalesUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [intent, setIntent] = useState("");
  const [selectedCristal, setSelectedCristal] = useState<typeof CRISTALES[0] | null>(null);

  // Auto-select crystal of the day
  const dayIdx = new Date().getDate() % CRISTALES.length;
  const crystalOfDay = CRISTALES[dayIdx];

  async function getCrystalReading() {
    const cristalText = selectedCristal ? `Cristal elegido: ${selectedCristal.name}` : `Cristal del día: ${crystalOfDay.name}`;
    const intentText = intent ? `Intención: ${intent}` : "";
    await consult(`${section.prompt}\n${cristalText}. ${intentText}. Proporciona: propiedades del cristal, cómo usarlo hoy, ritual simple y advertencia energética.`);
  }

  return (
    <div className="grid gap-5">
      {/* Crystal of the day */}
      <div className="glass-panel rounded-md p-5">
        <p className="text-xs uppercase tracking-widest text-lime-200/60 mb-3">Cristal del día</p>
        <div className="flex items-center gap-4 p-4 rounded-md border border-lime-300/20 bg-lime-300/5">
          <span className="text-5xl">{crystalOfDay.emoji}</span>
          <div>
            <p className="text-2xl font-black text-lime-200">{crystalOfDay.name}</p>
            <p className="text-sm text-white/50">{crystalOfDay.intent}</p>
          </div>
        </div>
      </div>

      {/* Intent selector */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-2">¿Qué necesitas hoy?</h2>
        <p className="text-sm text-white/50 mb-4">Elige tu intención y ZODI te sugiere el cristal exacto</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {INTENTS.map(i => (
            <button
              key={i}
              onClick={() => setIntent(i)}
              className={`rounded-md border py-2 text-xs font-bold transition ${
                intent === i ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-white/50 hover:border-cyan-400/25"
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        <h2 className="text-xl font-black mb-3">O elige un cristal directamente</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CRISTALES.map(c => (
            <button
              key={c.name}
              onClick={() => setSelectedCristal(prev => prev?.name === c.name ? null : c)}
              className={`rounded-md border p-3 text-center transition ${
                selectedCristal?.name === c.name
                  ? `${c.color} ring-1 ring-lime-300/50`
                  : `${c.color} hover:ring-1 hover:ring-lime-300/20`
              }`}
            >
              <div className="text-2xl mb-1">{c.emoji}</div>
              <p className="text-xs font-black">{c.name}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{c.intent.split(" & ")[0]}</p>
            </button>
          ))}
        </div>

        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={getCrystalReading}
          disabled={loading}
          className="mt-3 w-full rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 py-3 font-black text-black disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? "Los cristales resuenan..." : "Obtener mi lectura de cristal"}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. BIORRITMO UI
// ─────────────────────────────────────────────────────────────────────────────
function BiorritmoUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const birthDate = session.onboardingData?.birthDate;

  const cycles = (() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate).getTime();
    const today = Date.now();
    const days = Math.floor((today - birth) / 86400000);
    const physical  = Math.round(Math.sin(2 * Math.PI * days / 23) * 100);
    const emotional = Math.round(Math.sin(2 * Math.PI * days / 28) * 100);
    const mental    = Math.round(Math.sin(2 * Math.PI * days / 33) * 100);
    return { physical, emotional, mental };
  })();

  function getColor(val: number) {
    if (val > 50)  return "bg-lime-400";
    if (val > 0)   return "bg-yellow-400";
    if (val > -50) return "bg-orange-400";
    return "bg-red-500";
  }

  function getLabel(val: number) {
    if (val > 70)  return "🔥 Pico";
    if (val > 30)  return "⬆️ Alto";
    if (val > -30) return "➡️ Neutro";
    if (val > -70) return "⬇️ Bajo";
    return "💤 Valle";
  }

  async function analyze() {
    const extra = cycles
      ? `Biorritmo actual — Físico: ${cycles.physical}%, Emocional: ${cycles.emotional}%, Mental: ${cycles.mental}%. Interpreta cómo aprovechar esta energía hoy.`
      : "Genera una lectura de biorritmo general.";
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {cycles ? (
        <div className="glass-panel rounded-md p-5">
          <p className="text-xs uppercase tracking-widest text-lime-200/60 mb-4">Tu estado hoy</p>
          <div className="grid gap-4">
            {[
              { label: "Físico",      icon: <Zap className="h-4 w-4 text-lime-300" />,   val: cycles.physical  },
              { label: "Emocional",   icon: <Heart className="h-4 w-4 text-pink-400" />,  val: cycles.emotional },
              { label: "Mental",      icon: <Brain className="h-4 w-4 text-cyan-400" />,  val: cycles.mental    },
            ].map(({ label, icon, val }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-sm font-black">{icon} {label}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">{getLabel(val)}</span>
                    <span className="font-black text-sm">{val > 0 ? "+" : ""}{val}%</span>
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
                  {val >= 0 ? (
                    <div className={`absolute inset-y-0 left-1/2 rounded-r-full ${getColor(val)}`} style={{ width: `${val / 2}%` }} />
                  ) : (
                    <div className={`absolute inset-y-0 right-1/2 rounded-l-full ${getColor(val)}`} style={{ width: `${Math.abs(val) / 2}%` }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <LengthSelector value={length} onChange={setLength} />
          <button
            onClick={analyze}
            disabled={loading}
            className="mt-3 w-full rounded-md bg-lime-300 py-3 font-black text-black disabled:opacity-50 hover:bg-lime-200 transition"
          >
            {loading ? "Calculando tu pulso..." : "Leer mi biorritmo completo"}
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-md p-5 text-center py-10">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-black text-lg">Completa tu perfil</p>
          <p className="text-sm text-white/50 mt-2">Necesitas tu fecha de nacimiento para calcular el biorritmo</p>
          <a href="/dashboard/perfil" className="mt-4 inline-block rounded-md bg-lime-300 px-6 py-2.5 font-black text-black text-sm">Ir al perfil</a>
        </div>
      )}
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. CHINO UI
// ─────────────────────────────────────────────────────────────────────────────
function ChinoUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const mySign = session.astralProfile?.chineseZodiac ?? "Dragón";
  const [targetSign, setTargetSign] = useState<string>(mySign);
  const [cotilleoMode, setCotilleoMode] = useState(false);
  const [hasAutoConsulted, setHasAutoConsulted] = useState(false);

  const animals = [
    { name: "Rata", img: "C_rata.png", years: "1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020" },
    { name: "Buey", img: "C_buey.png", years: "1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021" },
    { name: "Tigre", img: "C_tigre.png", years: "1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022" },
    { name: "Conejo", img: "C_conejo.png", years: "1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023" },
    { name: "Dragón", img: "C_dragon.png", years: "1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024" },
    { name: "Serpiente", img: "C_serpiente.png", years: "1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025" },
    { name: "Caballo", img: "C_caballo.png", years: "1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026" },
    { name: "Cabra", img: "C_cabra.png", years: "1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027" },
    { name: "Mono", img: "C_mono.png", years: "1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028" },
    { name: "Gallo", img: "C_gallo.png", years: "1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029" },
    { name: "Perro", img: "C_perro.png", years: "1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030" },
    { name: "Cerdo", img: "C_cerdo.png", years: "1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031" },
  ];

  const currentImg = animals.find(a => a.name === targetSign)?.img ?? "C_dragon.png";

  useEffect(() => {
    if (!hasAutoConsulted) {
      setHasAutoConsulted(true);
      const extra = `Animal: ${targetSign}. Haz una lectura general de este animal en el horóscopo chino.`;
      consult(`${section.prompt}\n${extra}`);
    }
  }, [hasAutoConsulted, targetSign, consult, section.prompt]);

  async function analyzeCotilleo(sign: string) {
    setTargetSign(sign);
    const extra = `Animal: ${sign}. Haz una lectura general de este animal en el horóscopo chino. Es en modo cotilleo (sobre otra persona).`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md overflow-hidden">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[500px]"
          style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(10,10,20,0.95))" }}>
          <Image
            src={`/zodi-art/chino/${currentImg}`}
            alt={targetSign}
            fill
            sizes="(max-width: 640px) 100vw, 800px"
            className="object-contain object-center"
            priority
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-lime-200/80 mb-1">
              {targetSign === mySign ? "Tu animal zodiacal chino" : "Modo cotilleo"}
            </p>
            <p className="text-4xl font-black text-lime-300">{targetSign}</p>
            <p className="mt-1 text-[10px] text-white/50 w-3/4 mx-auto leading-relaxed">
              Años: {animals.find(a => a.name === targetSign)?.years}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">Modo Cotilleo</h2>
          <button
            onClick={() => setCotilleoMode(!cotilleoMode)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cotilleoMode ? "bg-lime-300 text-black" : "border border-white/20 text-white/60 hover:text-white"}`}
          >
            {cotilleoMode ? "Activado" : "Activar"}
          </button>
        </div>
        
        {cotilleoMode && (
          <div>
            <p className="text-sm text-white/50 mb-4">Selecciona el animal de alguien más para ver su horóscopo chino.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {animals.map(a => (
                <button
                  key={a.name}
                  onClick={() => analyzeCotilleo(a.name)}
                  title={a.name}
                  className={`relative aspect-square w-full rounded-md border transition overflow-hidden ${
                    targetSign === a.name ? "border-lime-300 ring-2 ring-lime-300 shadow-[0_0_15px_rgba(184,255,23,0.3)] scale-105" : "border-white/10 opacity-70 hover:opacity-100 hover:border-lime-300/40"
                  }`}
                >
                  <Image src={`/zodi-art/chino/${a.img}`} alt={a.name} fill className="object-cover" />
                </button>
              ))}
            </div>
            <div className="mt-4"><LengthSelector value={length} onChange={setLength} /></div>
          </div>
        )}
      </div>

      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. HORÓSCOPO DIARIO UI (enhanced)
// ─────────────────────────────────────────────────────────────────────────────
function HoroscopoDiarioUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength, tone, setTone } = useConsult(section);
  const [question, setQuestion] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const ctx = getTodaysAstralContext();

  // Calcular signo desde birthDate (fuente de verdad) antes que del astralProfile guardado
  const od = session.onboardingData;
  const mySign = (od?.birthDate ? calculateSunSign(od.birthDate) : null)
    || session.astralProfile?.sunSign
    || "";
  const [targetSign, setTargetSign] = useState<string>(mySign);
  const [cotilleoMode, setCotilleoMode] = useState(false);
  const [hasAutoConsulted, setHasAutoConsulted] = useState(false);

  const categories = [
    { key: "amor",     label: "Amor",    emoji: "❤️" },
    { key: "trabajo",  label: "Trabajo", emoji: "💼" },
    { key: "dinero",   label: "Dinero",  emoji: "💰" },
    { key: "energia",  label: "Energía", emoji: "⚡" },
    { key: "senal",    label: "Señal",   emoji: "🔮" },
  ];

  const normalizeSign = (s: string) => { const n = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); return n.charAt(0).toUpperCase() + n.slice(1); };
  const currentImg = `${normalizeSign(targetSign)}.png`;

  useEffect(() => {
    if (!hasAutoConsulted) {
      setHasAutoConsulted(true);
      const extra = `Signo: ${targetSign}. Fecha: ${ctx.dateReadable}. ${ctx.dayName}. Sol en ${ctx.sunTransit}. Luna: ${ctx.moonPhase}. Vibración del día: ${ctx.dayVibration}. Tono: ${tone}.`;
      consult(`${section.prompt}\n${extra}`);
    }
  }, [hasAutoConsulted, targetSign, tone, ctx, consult, section.prompt]);

  async function getHoroscope(sign?: string) {
    const s = sign ?? targetSign;
    if (sign) setTargetSign(s);
    const catText = activeCategory ? `Enfócate especialmente en el área de: ${categories.find(c=>c.key===activeCategory)?.label}.` : "";
    const extra = `Signo: ${s}. Fecha: ${ctx.dateReadable}. ${ctx.dayName}. Sol en ${ctx.sunTransit}. Luna: ${ctx.moonPhase}. Vibración del día: ${ctx.dayVibration}. Tono: ${tone}. ${catText} ${question ? `Consulta: ${question}` : ""} ${s !== mySign ? "Es en modo cotilleo (sobre otra persona)." : ""}`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {/* Sign Image */}
      <div className="glass-panel rounded-md overflow-hidden">
        <div className="relative w-full aspect-[3/4] sm:aspect-[16/9] max-h-[520px]"
          style={{ background: "linear-gradient(to bottom, rgba(10,10,20,0.8), rgba(5,5,10,0.95))" }}>
          <Image
            src={`/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${currentImg}`}
            alt={targetSign}
            fill
            sizes="(max-width: 640px) 100vw, 800px"
            className="object-contain object-center"
            priority
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-lime-200/80 mb-1">
              {targetSign === mySign ? "Tu horóscopo occidental" : "Modo cotilleo"}
            </p>
            <p className="text-5xl font-black text-lime-300 drop-shadow-[0_0_20px_rgba(184,255,23,0.6)]">{targetSign}</p>
            <p className="mt-1 text-xs text-white/50">{ZODIAC.find(z => z.name === targetSign)?.dates}</p>
          </div>
        </div>
        
        <div className="p-5 border-t border-white/10">
          <p className="text-xs uppercase tracking-widest text-lime-200/60 mb-3">Contexto astral de hoy</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Fecha",     value: ctx.dateReadable,  emoji: "📅" },
              { label: "Sol en",    value: ctx.sunTransit,    emoji: "☀️" },
              { label: "Luna",      value: ctx.moonPhase,     emoji: "🌙" },
              { label: "Vibración", value: String(ctx.dayVibration), emoji: "🔢" },
            ].map(item => (
              <div key={item.label} className="rounded-md border border-white/10 bg-black/30 p-3 text-center">
                <p className="text-[10px] text-white/40">{item.label}</p>
                <p className="font-black text-xs mt-1 truncate">{item.emoji} {item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-md p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black">Modo Cotilleo</h2>
          <button
            onClick={() => setCotilleoMode(!cotilleoMode)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cotilleoMode ? "bg-lime-300 text-black" : "border border-white/20 text-white/60 hover:text-white"}`}
          >
            {cotilleoMode ? "Activado" : "Activar"}
          </button>
        </div>
        
        {cotilleoMode && (
          <div className="mb-6">
            <p className="text-sm text-white/50 mb-4">Selecciona el signo de alguien más para ver qué le deparan los astros hoy.</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ZODIAC.map(z => (
                <button
                  key={z.name}
                  onClick={() => getHoroscope(z.name)}
                  title={z.name}
                  className={`rounded-md border p-2 text-center transition ${
                    targetSign === z.name ? "border-lime-300 bg-lime-300/10 text-lime-200 ring-1 ring-lime-300" : "border-white/10 hover:border-lime-300/40"
                  }`}
                >
                  <div className="text-xl">{z.emoji}</div>
                  <div className="text-[9px] text-white/40 mt-1 uppercase truncate">{z.name.slice(0,3)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <hr className="border-white/10 mb-5" />

        <h2 className="text-xl font-black mb-3">Refinar la lectura</h2>
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-md border px-4 py-2 text-xs font-bold transition ${!activeCategory ? "border-lime-300 bg-lime-300/10 text-lime-200" : "border-white/10 text-white/50 hover:border-lime-300/25"}`}
          >
            🌟 Todo
          </button>
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(prev => prev === c.key ? null : c.key)}
              className={`rounded-md border px-4 py-2 text-xs font-bold transition ${
                activeCategory === c.key ? "border-lime-300 bg-lime-300/10 text-lime-200" : "border-white/10 text-white/50 hover:border-lime-300/25"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <ToneSelector value={tone} onChange={setTone} />
        <div className="mt-3"><LengthSelector value={length} onChange={setLength} /></div>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={2}
          placeholder="¿Algo concreto que quieras saber sobre este día? (opcional)"
          className="mt-4 w-full resize-none rounded-md border border-white/10 bg-black/45 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime-300/55"
        />
        <button
          onClick={() => getHoroscope()}
          disabled={loading}
          className="mt-4 w-full rounded-md bg-lime-300 py-3 font-black text-black disabled:opacity-50 hover:bg-lime-200 transition"
        >
          {loading ? "El cosmos habla..." : `Refrescar lectura`}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOCOMPLETE DE LUGAR — reutilizable en PerfilUI para ciudad y país
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePlaceInput({
  label, value, onChange, options, placeholder, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; disabled?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function openDrop() {
    if (!wrapRef.current || disabled) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const style: React.CSSProperties = { position: "fixed", left: rect.left, width: rect.width, zIndex: 9999 };
    if (spaceBelow >= 192 || spaceBelow >= rect.top) style.top = rect.bottom + 4;
    else style.bottom = window.innerHeight - rect.top + 4;
    setDropPos(style);
    setOpen(true);
  }

  const filtered = query.length === 0
    ? options.slice(0, 60)
    : options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 60);

  function select(opt: string) { onChange(opt); setQuery(opt); setOpen(false); }

  return (
    <div ref={wrapRef} className="block">
      <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
      <div
        onClick={openDrop}
        className={`mt-1 flex items-center gap-2 rounded-lg border bg-black/45 px-3 py-2.5 transition cursor-text ${
          open ? "border-lime-300/55" : "border-white/10 hover:border-white/20"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        <input
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          value={query}
          placeholder={placeholder ?? "Buscar..."}
          autoComplete="off"
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); if (!open) openDrop(); }}
          onFocus={openDrop}
          onKeyDown={e => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && filtered.length === 1) { select(filtered[0]); e.preventDefault(); }
          }}
        />
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && options.length > 0 && (
        <ul
          style={dropPos}
          className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d13] shadow-2xl no-scrollbar"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-white/40">No encontrado — escríbelo igual</li>
          ) : filtered.map(opt => (
            <li key={opt}>
              <button type="button" onClick={() => select(opt)}
                className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-lime-300/10 hover:text-lime-200 ${
                  opt === value ? "bg-lime-300/08 text-lime-300 font-bold" : "text-white/80"
                }`}
              >
                {opt === value && <Check className="mr-2 inline h-3 w-3 text-lime-300" />}{opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. PERFIL UI (full editor + sign out)
// ─────────────────────────────────────────────────────────────────────────────

// Extraído fuera de PerfilUI para evitar recreación en cada render (anti-pattern React)
function ProfileSaveBtn({ onClick, saving, saved, label = "Guardar cambios" }: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-2 rounded-md px-6 py-3 font-black text-sm transition disabled:opacity-60 ${
        saved ? "bg-green-400 text-black" : "bg-lime-300 text-black hover:bg-lime-200"
      }`}
    >
      {saved
        ? <><Check className="h-4 w-4" /> Guardado</>
        : saving
        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Guardando...</>
        : <><Save className="h-4 w-4" /> {label}</>}
    </button>
  );
}

// Avatares disponibles en /public/zodi-art/perfil/
const AVATAR_PRESETS = [
  "/zodi-art/perfil/perfil-1.webp",
  "/zodi-art/perfil/perfil-2.webp",
  "/zodi-art/perfil/perfil-3.webp",
  "/zodi-art/perfil/perfil-4.webp",
  "/zodi-art/perfil/perfil-5.webp",
  "/zodi-art/perfil/perfil-6.webp",
  "/zodi-art/perfil/perfil-7.webp",
  "/zodi-art/perfil/perfil8.webp",
  "/zodi-art/perfil/perfil-9.webp",
  "/zodi-art/perfil/perfil-10.webp",
  "/zodi-art/perfil/perfil-11.webp",
  "/zodi-art/perfil/perfil-12.webp",
  "/zodi-art/perfil/perfil-13.webp",
];

function PerfilUI() {
  const router = useRouter();

  // ── LAZY INITIALIZERS ─────────────────────────────────────────────────────
  // Usamos funciones para que los estados se lean desde localStorage en cliente.
  // Sin esto, en SSR/hidratación de Next.js los valores quedarían vacíos.
  const getOd = () => (typeof window !== "undefined" ? getLocalSession().onboardingData : undefined);
  const getSes = () => (typeof window !== "undefined" ? getLocalSession() : { isAuthenticated: false, onboardingCompleted: false, displayName: "" } as ReturnType<typeof getLocalSession>);

  // Editable: identidad
  const [displayName, setDisplayName] = useState(() => { const s = getSes(); return s.onboardingData?.displayName ?? s.displayName ?? ""; });
  const [lastName, setLastName]   = useState(() => getOd()?.lastName ?? "");
  const [username, setUsername]   = useState(() => getOd()?.username ?? "");
  const [avatar, setAvatar]       = useState(() => getOd()?.avatar ?? "/zodi-art/perfil/perfil-1.webp");
  // Editable: nacimiento
  const [birthDate, setBirthDate]     = useState(() => getOd()?.birthDate ?? "");
  const [birthTime, setBirthTime]     = useState(() => getOd()?.birthTime ?? "");
  const [birthCountry, setBirthCountry] = useState(() => getOd()?.birthCountry ?? "");
  const [birthCity, setBirthCity]     = useState(() => getOd()?.birthCity ?? "");
  // Editable: ubicación actual
  const [currentCountry, setCurrentCountry] = useState(() => getOd()?.currentCountry ?? "");
  const [currentCity, setCurrentCity]       = useState(() => getOd()?.currentCity ?? "");
  // Editable: contexto vital
  type RelStatus = "single" | "relationship" | "married" | "complicated" | "divorced" | "";
  const [relationshipStatus, setRelationshipStatus] = useState<RelStatus>(() => getOd()?.relationshipStatus ?? "");
  const [partnerName, setPartnerName]           = useState(() => getOd()?.partnerName ?? "");
  const [partnerBirthDate, setPartnerBirthDate] = useState(() => getOd()?.partnerBirthDate ?? "");
  const [hasKids, setHasKids]     = useState(() => getOd()?.hasKids ?? false);
  const [kidsCount, setKidsCount] = useState(() => getOd()?.kidsCount ?? 1);
  const [personalBio, setPersonalBio] = useState(() => getOd()?.personalBio ?? "");
  // Editable: tono
  const [readingTone, setReadingTone] = useState<"suave" | "directo" | "brutal" | "sarcastico">(() => getOd()?.readingTone ?? "directo");

  // Para acceder a datos no editables (email, astralProfile)
  const session = getSes();
  const od = getOd();

  // Solo lectura
  const email = session.email ?? "";

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [gems, setGems] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const ap = session.astralProfile;

  useEffect(() => {
    try { setGems(getGems().total); } catch { /* ignore */ }
  }, []);

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagen demasiado grande. Máximo 2 MB. Prueba con una imagen más pequeña.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setAvatar(reader.result); };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setSaving(true);
    const name = displayName.trim() || "Viajero ZODI";
    const newOd = {
      displayName: name,
      lastName: lastName.trim(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || od?.username || "",
      avatar,
      genderIdentity: od?.genderIdentity ?? "",
      birthDate,
      birthTime,
      birthCity,
      birthCountry,
      currentCity,
      currentCountry,
      readingTone,
      favoriteTopics: od?.favoriteTopics ?? [],
      notificationPreferences: od?.notificationPreferences ?? [],
      // Contexto vital
      relationshipStatus: (relationshipStatus || undefined) as "single" | "relationship" | "married" | "complicated" | "divorced" | undefined,
      partnerName: partnerName.trim() || undefined,
      partnerBirthDate: partnerBirthDate || undefined,
      hasKids,
      kidsCount: hasKids ? kidsCount : undefined,
      personalBio: personalBio.trim() || undefined,
    };
    // Regenerar astralProfile si hay fecha de nacimiento
    const newAp = newOd.birthDate ? generateAstralProfile(newOd) : (session.astralProfile ?? undefined);
    setLocalSession({ displayName: name, onboardingData: newOd, astralProfile: newAp });

    try {
      const [
        { getFirebaseAuth, getFirebaseDb },
        { doc, setDoc, serverTimestamp },
      ] = await Promise.all([
        import("@/lib/firebase/client"),
        import("firebase/firestore"),
      ]);
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const uid = auth?.currentUser?.uid ?? session.uid;
      if (db && uid && !uid.startsWith("local_")) {
        await Promise.all([
          setDoc(doc(db, "users", uid), {
            displayName: name,
            lastName: lastName.trim() || null,
            avatar,
            birthDate:    birthDate    || null,
            birthTime:    birthTime    || null,
            birthCity:    birthCity    || null,
            birthCountry: birthCountry || null,
            // Ubicación actual — dialecto ZODI
            currentCity:    currentCity    || null,
            currentCountry: currentCountry || null,
            // Contexto vital — para lecturas personalizadas
            readingTone,
            relationshipStatus: newOd.relationshipStatus ?? null,
            partnerName:        newOd.partnerName        ?? null,
            partnerBirthDate:   newOd.partnerBirthDate   ?? null,
            hasKids:            newOd.hasKids            ?? null,
            kidsCount:          newOd.kidsCount          ?? null,
            personalBio:        newOd.personalBio        ?? null,
            favoriteTopics:     newOd.favoriteTopics     ?? [],
            onboardingCompleted: true,
            updatedAt: serverTimestamp(),
          }, { merge: true }),
          setDoc(doc(db, "astralProfiles", uid), {
            birthDate:    birthDate    || null,
            birthTime:    birthTime    || null,
            birthCity:    birthCity    || null,
            birthCountry: birthCountry || null,
            // Incluir datos del astralProfile calculado
            ...(newAp ? {
              sunSign:       newAp.sunSign,
              moonSign:      newAp.moonSign,
              ascendant:     newAp.ascendant,
              lifePathNumber: newAp.lifePathNumber,
              chineseZodiac: newAp.chineseZodiac,
              mayanSign:     newAp.mayanSign,
              natalChartBase: newAp.natalChartBase,
            } : {}),
            updatedAt: serverTimestamp(),
          }, { merge: true }),
        ]);
      }
    } catch (e) {
      console.error("[ZODI] Profile update error:", e);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function signOut() {
    await signOutZodi();
    router.push("/");
  }

  async function deleteAccount() {
    if (deleteConfirm !== "ELIMINAR") return;

    try {
      const [
        { getFirebaseAuth, getFirebaseDb },
        { deleteUser },
        { deleteDoc, doc },
      ] = await Promise.all([
        import("@/lib/firebase/client"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);

      const auth = getFirebaseAuth();
      const db   = getFirebaseDb();
      const user = auth?.currentUser;

      if (!user) {
        // Sin sesión Firebase — solo limpiar datos locales
        localStorage.clear();
        router.push("/");
        return;
      }

      const uid = user.uid;

      // 1. Borrar datos de Firestore (no requiere Admin, solo auth de cliente)
      if (db) {
        await Promise.allSettled([
          deleteDoc(doc(db, "users", uid)),
          deleteDoc(doc(db, "astralProfiles", uid)),
        ]);
      }

      // 2. Borrar la cuenta de Firebase Auth (cliente, sin Admin)
      await deleteUser(user);

    } catch (e: any) {
      console.error("[ZODI] deleteAccount error:", e);
      // auth/requires-recent-login: pedir que vuelva a autenticarse
      if (e?.code === "auth/requires-recent-login") {
        alert("Por seguridad, vuelve a iniciar sesión antes de eliminar tu cuenta.");
      } else {
        alert("No se pudo eliminar la cuenta. Intenta de nuevo.");
      }
      return;
    }

    localStorage.clear();
    router.push("/");
  }

  const sunSign = birthDate ? calculateSunSign(birthDate) : ap?.sunSign;

  // normaliza acentos para los nombres de archivo (ej. "Géminis"→"Geminis", "Dragón"→"dragon")
  const toFilename = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "");

  // ── Datos astrales para los badges ─────────────────────────────────────────
  const solar = sunSign || ap?.sunSign || "";
  const astralBadges = [
    {
      key: "solar",
      label: "Signo Solar",
      value: solar || "–",
      desc: "Tu esencia, ego y energía central",
      img: solar ? signImgPath(solar) : null,
      emoji: "☀️",
      color: "from-amber-400/30 to-orange-500/20",
      border: "border-amber-400/30",
      glow: "rgba(251,191,36,0.25)",
    },
    {
      key: "luna",
      label: "Signo Lunar",
      value: ap?.moonSign || "–",
      desc: "Cómo sientes y tu mundo interior",
      img: ap?.moonSign ? signImgPath(ap.moonSign) : null,
      emoji: "🌙",
      color: "from-slate-400/30 to-blue-500/20",
      border: "border-slate-400/30",
      glow: "rgba(148,163,184,0.25)",
    },
    {
      key: "asc",
      label: "Ascendente",
      value: ap?.ascendant || "–",
      desc: "Cómo te perciben los demás",
      img: ap?.ascendant ? signImgPath(ap.ascendant) : null,
      emoji: "⬆️",
      color: "from-violet-400/30 to-purple-500/20",
      border: "border-violet-400/30",
      glow: "rgba(167,139,250,0.25)",
    },
    {
      key: "vida",
      label: "Número de Vida",
      value: ap?.lifePathNumber ? String(ap.lifePathNumber) : "–",
      desc: "Tu misión y camino de vida",
      img: ap?.lifePathNumber
        ? `/zodi-art/nuevas/7-Numerologia/${ap.lifePathNumber}.webp`
        : null,
      emoji: "🔢",
      color: "from-lime-400/30 to-emerald-500/20",
      border: "border-lime-400/30",
      glow: "rgba(163,230,53,0.25)",
      bigNumber: !ap?.lifePathNumber ? undefined : ap.lifePathNumber,
    },
    {
      key: "chino",
      label: "Zodíaco Chino",
      value: ap?.chineseZodiac || "–",
      desc: "Tu animal según el calendario chino",
      img: ap?.chineseZodiac
        ? `/zodi-art/chino/C_${toFilename(ap.chineseZodiac).toLowerCase()}.png`
        : null,
      emoji: "🐉",
      color: "from-red-400/30 to-orange-600/20",
      border: "border-red-400/30",
      glow: "rgba(248,113,113,0.25)",
    },
    {
      key: "maya",
      label: "Signo Maya",
      value: ap?.mayanSign || "–",
      desc: "Tu energía en el calendario sagrado maya",
      img: null,
      emoji: "🌿",
      color: "from-teal-400/30 to-cyan-500/20",
      border: "border-teal-400/30",
      glow: "rgba(45,212,191,0.25)",
    },
  ];

  return (
    <div className="grid gap-4 w-full max-w-full">

      {/* ══════════════════════════════════════════════════════
          CABECERA DE PERFIL — avatar grande + nombre + gemas
          ══════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0e0e18] to-[#080810] p-5"
        style={{ boxShadow: "0 0 40px rgba(184,255,23,0.06), inset 0 1px 0 rgba(255,255,255,0.05)" }}
      >
        {/* fondo decorativo */}
        <div className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(155,77,255,0.18), transparent)" }} />

        <div className="relative flex items-center gap-5">
          {/* Avatar grande con botón de cambio */}
          <div className="relative shrink-0">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-lime-300/50"
              style={{ boxShadow: "0 0 20px rgba(184,255,23,0.2)" }}>
              {avatar.startsWith("data:") ? (
                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <Image src={avatar} alt="Avatar" fill className="object-cover" />
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-lime-300/50 bg-black text-lime-300 shadow-lg transition hover:bg-lime-300/10 active:scale-90"
              title="Cambiar foto"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>

          {/* Nombre + signo + gemas */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-0.5">
              {username ? `@${username}` : "Tu perfil"}
            </p>
            <h2 className="text-2xl font-black text-white leading-tight truncate">
              {displayName || "Viajero ZODI"}
            </h2>
            {sunSign && (
              <p className="mt-1 text-sm font-bold text-lime-300">
                ☀️ {sunSign}{ap?.moonSign ? ` · 🌙 ${ap.moonSign}` : ""}
              </p>
            )}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lime-300/25 bg-lime-300/8 px-3 py-1">
              <Gem className="h-3.5 w-3.5 text-lime-300" />
              <span className="text-sm font-black text-lime-200" style={{ fontFamily: "var(--font-mono)" }}>{gems}</span>
              <span className="text-xs text-white/40">gemas</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════
          PERFIL ASTRAL — badges circulares con imagen + desc
          ══════════════════════════════════════════════════════ */}
      {ap && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="glass-panel rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black">Tu mapa astral</h2>
              <p className="text-xs text-white/40 mt-0.5">Los 6 pilares de tu carta natal</p>
            </div>
            <a href="/onboarding"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/40 hover:text-lime-200 hover:border-lime-300/25 transition">
              <RefreshCw className="h-3 w-3" /> Recalcular
            </a>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {astralBadges.map(b => {
              const displayEmoji = b.emoji;
              return (
                <div
                  key={b.key}
                  className={`relative flex flex-col items-center rounded-2xl border ${b.border} bg-gradient-to-b ${b.color} p-3 pt-4 text-center`}
                  style={{ boxShadow: `0 4px 20px ${b.glow}, inset 0 1px 0 rgba(255,255,255,0.06)` }}
                >
                  {/* Círculo imagen/emoji */}
                  <div
                    className="relative mb-2.5 h-14 w-14 rounded-full overflow-hidden border-2 border-white/15 bg-black/40"
                    style={{ boxShadow: `0 0 16px ${b.glow}` }}
                  >
                    {b.img ? (
                      <Image src={b.img} alt={b.value} fill className="object-cover scale-110" />
                    ) : (b as any).bigNumber ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-2xl font-black text-white" style={{ textShadow: `0 0 12px ${b.glow}` }}>
                          {(b as any).bigNumber}
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        {displayEmoji}
                      </div>
                    )}
                  </div>

                  {/* Nombre del signo */}
                  <p className="text-sm font-black text-white leading-tight mb-0.5 break-words w-full">
                    {b.value}
                  </p>
                  {/* Etiqueta tipo */}
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">
                    {b.label}
                  </p>
                  {/* Descripción */}
                  <p className="text-xs text-white/40 leading-tight">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Información personal ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="glass-panel rounded-xl p-4 sm:p-5"
      >
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-base font-black leading-tight">Información personal</h2>
          <p className="text-xs text-white/40 mt-0.5">El correo no se puede cambiar. Todo lo demás, sí.</p>
        </div>

        {/* Avatar mini + acciones */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden border-2 border-lime-300/30"
            style={{ boxShadow: "0 0 10px rgba(184,255,23,0.12)" }}>
            {avatar.startsWith("data:") ? (
              <img src={avatar} alt="Tu foto" className="h-full w-full object-cover" />
            ) : (
              <Image src={avatar} alt="Tu foto" fill className="object-cover" />
            )}
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-lime-300/30 bg-lime-300/10 px-4 py-2.5 text-sm font-black text-lime-200 transition hover:bg-lime-300/20 active:scale-95"
            >
              <Camera className="h-4 w-4" /> Cambiar foto
            </button>
            <p className="mt-1.5 text-xs text-white/35">JPG, PNG, WebP · Máx 2MB</p>
          </div>
        </div>

        {/* Email — solo lectura */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Correo</span>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 overflow-hidden">
            <span className="flex-1 text-sm text-white/45 truncate min-w-0">{email || "Sin correo"}</span>
            <Lock className="h-3 w-3 text-white/20 shrink-0" />
          </div>
        </div>

        {/* Usuario — necesario para que otros te encuentren en Amigos */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40">@Usuario</span>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/35 pointer-events-none">@</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="tu_usuario"
              maxLength={24}
              className="w-full rounded-lg border border-white/10 bg-black/45 pl-7 pr-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55"
            />
          </div>
          <p className="mt-1 text-[10px] text-white/30">Solo letras minúsculas, números y guión bajo. Tus amigos te buscan por aquí.</p>
        </div>

        {/* Nombre + Apellido — siempre columna única en móvil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Nombre</span>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Tu nombre o apodo"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Apellido(s)</span>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Tu apellido"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55"
            />
            <p className="mt-1 text-[10px] text-white/30">Para análisis de nombre y genealogía astral</p>
          </label>
        </div>

        <ProfileSaveBtn onClick={saveProfile} saving={saving} saved={saved} />
      </motion.div>

      {/* ── Datos de nacimiento ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="glass-panel rounded-xl p-4 sm:p-5"
      >
        <h2 className="text-lg font-black mb-0.5">Datos de nacimiento</h2>
        <p className="text-xs text-white/40 mb-4">ZODI usa estos datos para tus lecturas astrológicas personalizadas.</p>

        {/* Siempre columna única en móvil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Fecha de nacimiento</span>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55 [color-scheme:dark]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-white/40">Hora de nacimiento <span className="normal-case text-white/25">(opcional)</span></span>
            <input
              type="time"
              value={birthTime}
              onChange={e => setBirthTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55 [color-scheme:dark]"
            />
          </label>
          <ProfilePlaceInput
            label="Ciudad de nacimiento"
            value={birthCity}
            onChange={setBirthCity}
            options={getCitiesForCountry(birthCountry)}
            placeholder={birthCountry ? "Buscar ciudad..." : "Selecciona el país primero"}
            disabled={!birthCountry}
          />
          <ProfilePlaceInput
            label="País de nacimiento"
            value={birthCountry}
            onChange={v => { setBirthCountry(v); setBirthCity(""); }}
            options={COUNTRY_LIST}
            placeholder="Buscar país..."
          />
        </div>

        {sunSign && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-lime-300/20 bg-lime-300/5 px-3 py-2 text-sm">
            <span className="text-white/55 text-xs">Signo solar calculado:</span>
            <span className="font-black text-lime-300">{sunSign}</span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2.5">
          <ProfileSaveBtn onClick={saveProfile} saving={saving} saved={saved} label="Guardar datos" />
          <a href="/onboarding" className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white/55 hover:text-white/80 transition">
            <RefreshCw className="h-3.5 w-3.5" /> Recalcular
          </a>
        </div>
      </motion.div>

      {/* ── Dónde estás ahora (dialecto de ZODI) ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="glass-panel rounded-xl p-4 sm:p-5"
      >
        <h2 className="text-lg font-black mb-0.5">¿Dónde estás ahora?</h2>
        <p className="text-xs text-white/40 mb-4">ZODI ajusta su lenguaje al lugar donde vives. Chileno, mexicano, rioplatense… como uno de allí.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProfilePlaceInput
            label="País actual"
            value={currentCountry}
            onChange={v => { setCurrentCountry(v); setCurrentCity(""); }}
            options={COUNTRY_LIST}
            placeholder="Buscar país..."
          />
          <ProfilePlaceInput
            label="Ciudad actual (opcional)"
            value={currentCity}
            onChange={setCurrentCity}
            options={getCitiesForCountry(currentCountry)}
            placeholder={currentCountry ? "Buscar ciudad..." : "Selecciona el país primero"}
            disabled={!currentCountry}
          />
        </div>
        <ProfileSaveBtn onClick={saveProfile} saving={saving} saved={saved} label="Guardar ubicación" />
      </motion.div>

      {/* ── Contexto vital — para lecturas más personalizadas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-panel rounded-xl p-4 sm:p-5"
      >
        <h2 className="text-lg font-black mb-0.5">Tu contexto vital</h2>
        <p className="text-xs text-white/40 mb-4">Cuanto más sepa ZODI de ti, más exacta (y ácida) será la lectura. Todo opcional, todo privado.</p>

        {/* Estado sentimental — grid 2-col en mobile, wrap en desktop */}
        <div className="mb-5">
          <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Estado sentimental</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["single", "relationship", "married", "complicated", "divorced"] as const).map(key => {
              const labels: Record<string, string> = {
                single: "🤷 Soltero/a",
                relationship: "💕 En pareja",
                married: "💍 Casado/a",
                complicated: "🙃 Complicado",
                divorced: "💔 Separado/a"
              };
              return (
                <button
                  key={key}
                  onClick={() => setRelationshipStatus(prev => (prev === key ? "" : key) as RelStatus)}
                  className={`rounded-xl py-2.5 px-2 text-xs font-bold transition active:scale-95 ${
                    relationshipStatus === key
                      ? "bg-lime-300 text-black shadow-[0_0_12px_rgba(184,255,23,0.3)]"
                      : "border border-white/10 text-white/60 hover:border-lime-300/30 hover:text-white"
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pareja — solo si está en pareja/casado, con animación */}
        <AnimatePresence>
          {(relationshipStatus === "relationship" || relationshipStatus === "married") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-5 overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-lime-300/15 bg-lime-300/5 p-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Nombre de tu pareja</span>
                  <input
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    placeholder="Su nombre..."
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-white/40">Fecha de nacimiento</span>
                  <input
                    type="date"
                    value={partnerBirthDate}
                    onChange={e => setPartnerBirthDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-300/55 [color-scheme:dark]"
                  />
                  {partnerBirthDate && (
                    <p className="mt-1 text-[10px] font-bold text-lime-300">
                      Signo: {calculateSunSign(partnerBirthDate)}
                    </p>
                  )}
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hijos — toggle compacto */}
        <div className="mb-5">
          <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">¿Tienes hijos?</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setHasKids(!hasKids)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                hasKids ? "bg-violet-500 text-white shadow-[0_0_10px_rgba(155,77,255,0.3)]" : "border border-white/10 text-white/60 hover:border-violet-400/30"
              }`}
            >
              {hasKids ? "✓ Sí, tengo" : "No tengo"}
            </button>
            <AnimatePresence>
              {hasKids && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-white/40">Cuántos:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setKidsCount(n)}
                      className={`h-7 w-7 rounded-lg text-xs font-black transition active:scale-95 ${
                        kidsCount === n ? "bg-violet-500 text-white" : "border border-white/15 text-white/50 hover:text-white"
                      }`}
                    >{n}</button>
                  ))}
                  {kidsCount >= 5 && <span className="text-[10px] text-white/30">+</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Historia personal */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Tu historia en dos líneas</span>
          <p className="text-[10px] text-white/30 mb-2">ZODI alinea las constelaciones con tu vida real. Qué más.</p>
          <textarea
            value={personalBio}
            onChange={e => setPersonalBio(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Trabajo en..., llevo X años en..., acabo de..., lo que sea relevante."
            className="w-full resize-none rounded-xl border border-white/10 bg-black/45 p-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-lime-300/55 transition"
          />
          <p className="mt-0.5 text-right text-[10px] text-white/25">{personalBio.length}/400</p>
        </div>

        <ProfileSaveBtn onClick={saveProfile} saving={saving} saved={saved} label="Guardar contexto" />
      </motion.div>

      {/* ── Tono de lecturas ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="glass-panel rounded-xl p-4 sm:p-5"
      >
        <h2 className="text-lg font-black mb-0.5">Tono de lecturas</h2>
        <p className="text-xs text-white/40 mb-3">Cómo quieres que ZODI te hable.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(["suave", "directo", "brutal", "sarcastico"] as const).map(t => {
            const labels: Record<string, string> = {
              suave: "🌙 Suave", directo: "⚡ Directo", brutal: "🔥 Brutal", sarcastico: "💀 Sarcástico"
            };
            return (
              <button key={t} onClick={() => setReadingTone(t)}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  readingTone === t ? "bg-lime-300 text-black" : "border border-white/10 text-white/60 hover:border-lime-300/40"
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
        <ProfileSaveBtn onClick={saveProfile} saving={saving} saved={saved} label="Guardar preferencias" />
      </motion.div>

      <InstallPwaCard />

      {/* Embajadores */}
      <div className="glass-panel rounded-xl p-4 border border-yellow-400/15 bg-yellow-400/5">
        <div className="flex items-center gap-2.5 mb-3 min-w-0">
          <Gem className="h-4 w-4 shrink-0 text-yellow-400" />
          <div className="min-w-0">
            <h2 className="text-sm font-black text-yellow-100">Embajadores ZODI</h2>
            <p className="text-[10px] text-yellow-200/55">Invita amigos · Gana 500 gemas por registro</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2 overflow-hidden">
          <input
            readOnly
            value={typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${session.uid}` : ''}
            className="min-w-0 flex-1 bg-transparent text-xs text-white/40 outline-none truncate"
          />
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(`${window.location.origin}/auth/register?ref=${session.uid}`);
                const btn = document.getElementById("copy-btn");
                if (btn) { btn.innerText = "✓"; setTimeout(() => btn.innerText = "Copiar", 2000); }
              }
            }}
            id="copy-btn"
            className="shrink-0 rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-black text-black hover:bg-yellow-300 transition"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="glass-panel rounded-xl p-4 border border-purple-500/15 bg-purple-500/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0">🔔</span>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-purple-100 truncate">Notificaciones</h2>
              <p className="text-[10px] text-purple-200/50">Gemas y eventos astrales</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (typeof window !== 'undefined' && 'Notification' in window) {
                const p = await Notification.requestPermission();
                alert(p === 'granted' ? "¡Activadas!" : "Permiso denegado.");
              }
            }}
            className="shrink-0 rounded-lg bg-purple-500 px-3 py-1.5 text-xs font-black text-white hover:bg-purple-400 transition"
          >
            Activar
          </button>
        </div>
      </div>


      {/* Cuenta */}
      <div className="glass-panel rounded-xl p-4 sm:p-5">
        <h2 className="text-sm font-black mb-3 text-white/70">Cuenta</h2>
        <div className="grid gap-2.5">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 rounded-lg border border-white/12 px-4 py-3 text-sm font-bold text-white/65 hover:border-red-400/35 hover:text-red-400 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" /> Cerrar sesión
          </button>
          <button
            onClick={() => {
              if (typeof window === "undefined") return;
              if ("caches" in window) {
                caches.keys()
                  .then(keys => Promise.all(keys.map(k => caches.delete(k))))
                  .finally(() => (window as Window).location.reload());
              } else {
                (window as Window).location.reload();
              }
            }}
            className="flex items-center gap-2.5 rounded-lg border border-cyan-500/15 px-4 py-3 text-sm font-bold text-cyan-400/60 hover:border-cyan-500/40 hover:text-cyan-400 transition"
          >
            <RefreshCw className="h-4 w-4 shrink-0" /> Actualizar app
          </button>
          <button
            onClick={() => setShowDelete(!showDelete)}
            className="flex items-center gap-2.5 rounded-lg border border-red-500/15 px-4 py-3 text-sm font-bold text-red-400/60 hover:border-red-500/40 hover:text-red-400 transition"
          >
            <Trash2 className="h-4 w-4 shrink-0" /> Eliminar cuenta
          </button>
        </div>

        {showDelete && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="font-black text-red-400 text-xs">Esta acción es irreversible</p>
            </div>
            <p className="text-xs text-white/55 mb-2.5">Escribe <strong className="text-red-400">ELIMINAR</strong> para confirmar</p>
            <div className="flex gap-2">
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="ELIMINAR"
                className="flex-1 min-w-0 rounded-lg border border-red-500/30 bg-black/45 px-3 py-2 text-sm text-white outline-none"
              />
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== "ELIMINAR"}
                className="shrink-0 rounded-lg bg-red-500 px-4 py-2 font-black text-sm text-white disabled:opacity-40"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. CARTA NATAL UI
// ─────────────────────────────────────────────────────────────────────────────
function CartaNatalUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const od = session.onboardingData;
  // Si no hay astralProfile guardado pero tenemos birthDate, calculamos al vuelo
  const ap = session.astralProfile ?? (od?.birthDate ? generateAstralProfile(od) : null);

  const planets = ap
    ? [
        { label: "Signo solar",    value: ap.sunSign ?? "–",             emoji: "☀️", color: "border-yellow-400/30 bg-yellow-500/5" },
        { label: "Luna",           value: ap.moonSign ?? "–",            emoji: "🌙", color: "border-blue-400/30 bg-blue-500/5" },
        { label: "Ascendente",     value: ap.ascendant ?? "–",           emoji: "⬆️", color: "border-lime-400/30 bg-lime-500/5" },
        { label: "Camino de vida", value: String(ap.lifePathNumber ?? "–"), emoji: "🔢", color: "border-purple-400/30 bg-purple-500/5" },
        { label: "Horóscopo chino", value: ap.chineseZodiac ?? "–",     emoji: "🐉", color: "border-red-400/30 bg-red-500/5" },
        { label: "Sello maya",     value: ap.mayanSign ?? "–",           emoji: "🌿", color: "border-teal-400/30 bg-teal-500/5" },
      ]
    : null;

  async function generateReading() {
    const ctx = getTodaysAstralContext();
    const base = ap?.natalChartBase ?? "perfil no disponible";
    const extra = `Fecha: ${ctx.dateReadable}. Carta natal base: ${base}. Camino de vida: ${ap?.lifePathNumber}. Chino: ${ap?.chineseZodiac}. Maya: ${ap?.mayanSign}. Genera una lectura natal profunda y personalizada.`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      {/* Natal data visual grid */}
      {planets ? (
        <div className="glass-panel rounded-md p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-lime-300 text-black shrink-0">
              <ChartNoAxesCombined className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-lime-200/60">Tu mapa base</p>
              <h2 className="text-xl font-black">Carta natal</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {planets.map(({ label, value, emoji, color }) => (
              <div
                key={label}
                className={`rounded-md border ${color} p-4 transition hover:-translate-y-0.5`}
              >
                <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
                <p className="mt-2 text-lg font-black">
                  <span className="mr-1.5">{emoji}</span>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {ap?.summary && (
            <p className="mt-4 rounded-md border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white/68 italic">
              {ap.summary}
            </p>
          )}

          <LengthSelector value={length} onChange={setLength} />
          <button
            onClick={generateReading}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-lime-300 py-3 font-black text-black transition hover:bg-lime-200 disabled:opacity-60 sm:w-auto sm:px-8"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Leyendo tu carta natal..." : "Generar lectura completa"}
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-md p-8 text-center">
          <ChartNoAxesCombined className="mx-auto mb-3 h-10 w-10 text-lime-300/40" />
          <p className="font-black text-lg">Completa tu perfil astral</p>
          <p className="mt-2 text-sm text-white/50">
            Necesitas tu fecha de nacimiento y ciudad para calcular la carta natal
          </p>
          <a
            href="/onboarding"
            className="mt-4 inline-block rounded-md bg-lime-300 px-6 py-2.5 font-black text-black text-sm"
          >
            Ir al onboarding
          </a>
        </div>
      )}
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. SUEÑOS UI
// ─────────────────────────────────────────────────────────────────────────────
function SuenosUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [dreamText, setDreamText] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);

  const moods = [
    { key: "luminoso",     label: "Luminoso",     emoji: "🌟" },
    { key: "emocional",    label: "Emocional",    emoji: "🌊" },
    { key: "angustiante",  label: "Angustiante",  emoji: "😨" },
    { key: "confuso",      label: "Confuso",      emoji: "🌀" },
    { key: "recurrente",   label: "Recurrente",   emoji: "🔁" },
    { key: "mistico",      label: "Místico",      emoji: "🌙" },
  ] as const;

  const symbolList = [
    "Agua", "Volar", "Caer", "Perdido", "Persecución",
    "Casa", "Muerte", "Transformación", "Animales", "Fuego",
    "Oscuridad", "Luz", "Personas conocidas", "Lugares extraños",
  ];

  function toggleSymbol(s: string) {
    setSymbols(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function interpret() {
    if (!dreamText.trim() && !mood) return;
    const moodLabel = mood ? `Tono emocional: ${mood}.` : "";
    const symbolLabel = symbols.length ? `Símbolos presentes: ${symbols.join(", ")}.` : "";
    const extra = `Descripción del sueño: "${dreamText || "no especificada"}". ${moodLabel} ${symbolLabel}\nInterpreta el sueño con símbolos, mensaje central y acción práctica.`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-blue-200/60">Diario de sueños</p>
            <h2 className="text-xl font-black">Describe tu sueño</h2>
          </div>
        </div>

        <textarea
          value={dreamText}
          onChange={e => setDreamText(e.target.value)}
          rows={5}
          placeholder="Cuéntame lo que soñaste con el máximo detalle que recuerdes. Colores, personas, sensaciones, lugares..."
          className="w-full resize-none rounded-md border border-white/10 bg-black/45 p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300/50"
        />

        {/* Mood selector */}
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-white/40">Tono del sueño</p>
          <div className="flex flex-wrap gap-2">
            {moods.map(m => (
              <button
                key={m.key}
                onClick={() => setMood(mood === m.key ? null : m.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition ${
                  mood === m.key
                    ? "bg-blue-400 text-black"
                    : "border border-white/10 text-white/60 hover:border-blue-300/40 hover:text-blue-200"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol tags */}
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-widest text-white/40">Símbolos presentes (opcional)</p>
          <div className="flex flex-wrap gap-2">
            {symbolList.map(s => (
              <button
                key={s}
                onClick={() => toggleSymbol(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  symbols.includes(s)
                    ? "bg-fuchsia-400/20 border border-fuchsia-400/50 text-fuchsia-200"
                    : "border border-white/10 text-white/50 hover:border-fuchsia-300/30 hover:text-fuchsia-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={interpret}
          disabled={loading || (!dreamText.trim() && !mood)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-lime-300 py-3 font-black text-black transition hover:bg-lime-200 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          <NotebookPen className="h-4 w-4" />
          {loading ? "Interpretando señales..." : "Interpretar sueño"}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}


// 15. GENERIC CONSULT UI (improved, for other sections)
// ─────────────────────────────────────────────────────────────────────────────

function EmailSubscriptionBanner() {
  const [email, setEmail] = require("react").useState("");
  const [subscribed, setSubscribed] = require("react").useState(false);
  const [loading, setLoading] = require("react").useState(false);

  require("react").useEffect(() => {
    // Basic init
  }, []);

  const handleSubscribe = async () => {
    if (!email.includes("@")) return alert("Ingresa un correo válido");
    setLoading(true);
    try {
      let token = "";
      let uid = "user";
      try {
        const { getFirebaseAuth } = await import("@/lib/firebase/client");
        const auth = getFirebaseAuth();
        if (auth?.currentUser) {
          token = await auth.currentUser.getIdToken();
          uid = auth.currentUser.uid;
        }
      } catch (e) {}

      if (!token) {
        alert("Necesitas iniciar sesión para suscribirte.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ uid, email, subscribe: true })
      });
      if (res.ok) {
        setSubscribed(true);
        alert("¡Te has suscrito al caos diario de ZODI!");
      } else {
        alert("Hubo un error al procesar tu suscripción.");
      }
    } catch (e) { }
    setLoading(false);
  };

  if (subscribed) return null;

  return (
    <div className="glass-panel p-5 rounded-md mb-6 border border-lime-300/30 bg-lime-300/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div>
        <h3 className="font-black text-lime-300 text-lg">El Caos Diario en tu Correo</h3>
        <p className="text-sm text-white/70">Suscríbete para recibir tu horóscopo ZODI cada mañana en tu bandeja de entrada.</p>
      </div>
      <div className="flex w-full sm:w-auto gap-2">
        <input 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com" 
          className="bg-black/50 border border-white/20 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-lime-300/50 flex-1 sm:w-48"
        />
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="bg-lime-300 text-black font-bold px-4 py-2 rounded-md text-sm hover:bg-lime-200 disabled:opacity-50"
        >
          {loading ? "..." : "Suscribir"}
        </button>
      </div>
    </div>
  );
}

function GenericConsultUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, length, setLength, tone, setTone } = useConsult(section);
  const [question, setQuestion] = useState("");
  const ctx = getTodaysAstralContext();

  const SECTION_PROMPTS: Record<string, string[]> = {
    chino:        ["¿Qué dice mi animal chino sobre este momento?", "¿Cuál es mi compatibilidad con el Dragón?", "Dame una predicción según mi animal chino", "¿Qué ciclo estoy atravesando según el calendario chino?"],
    maya:         ["¿Qué dice mi sello maya sobre mi misión?", "¿Cómo afecta mi tono al mes?", "Dame una lectura de energía ancestral para hoy", "¿Qué significa mi sello en el amor?"],
    predicciones: ["Dame mis predicciones de amor para este mes", "¿Qué cambiará en mi trabajo próximamente?", "Dame una predicción de energía general", "¿Qué conviene sembrar este ciclo lunar?"],
    ranking:      ["¿Qué misión debo cumplir hoy para subir de rango?", "Dame una misión de alta vibración", "¿Cómo subo mi nivel espiritual esta semana?", "Dame un desafío ZODI de 24 horas"],
    puntos:       ["¿Cómo puedo ganar más puntos hoy?", "Dame una misión express de 5 minutos", "¿Qué acciones dan más puntos?", "Dame una rutina para subir al siguiente nivel"],
    logros:       ["¿Qué logros me faltan desbloquear?", "Dame un logro semanal alcanzable", "¿Qué insignia debería perseguir primero?", "Dame un desafío de racha para esta semana"],
    rachas:       ["¿Cómo mantengo mi racha cuando tengo poco tiempo?", "Dame un micro ritual de menos de 2 minutos", "¿Qué recompensa tengo en mi próximo hito de racha?", "Dame motivación para volver después de romper racha"],
  };

  const quickPrompts = SECTION_PROMPTS[section.slug] ?? [
    "¿Qué me conviene evitar esta semana?",
    "Dame una señal concreta para hoy",
    "¿Qué patrón necesito romper?",
    "¿Cuál es mi mayor bloqueo ahora mismo?",
  ];

  async function run() {
    await consult(`${section.prompt}\nTono: ${tone}.\nFecha real: ${ctx.dateReadable}.\n${question || "Lectura general."}`);
  }

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-2">Haz tu consulta</h2>
        <p className="text-sm text-white/50 mb-4">Pregunta lo que quieras o deja el campo vacío para una lectura general</p>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPrompts.map(p => (
            <button
              key={p}
              onClick={() => setQuestion(p)}
              className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:border-lime-300/30 hover:text-lime-200 transition"
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={4}
          placeholder="Tu consulta..."
          className="w-full resize-none rounded-md border border-white/10 bg-black/45 p-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime-300/55"
        />
        <div className="mt-4 grid gap-3">
          <ToneSelector value={tone} onChange={setTone} />
          <LengthSelector value={length} onChange={setLength} />
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="mt-4 flex items-center justify-center gap-2 rounded-md bg-lime-300 px-8 py-3 font-black text-black disabled:opacity-60 hover:bg-lime-200 transition w-full sm:w-auto"
        >
          <Send className="h-4 w-4" />
          {loading ? "Consultando..." : "Consultar ahora"}
        </button>
      </div>
      <ReplyBox reply={reply} loading={loading} sectionTitle={section.title} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. HISTORIAL UI
// ─────────────────────────────────────────────────────────────────────────────
function HistorialUI() {
  type SavedReading = { id: number; date: string; section: string; text: string };
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("Todas");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zodi.readings");
      if (raw) setReadings(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function deleteReading(id: number) {
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    localStorage.setItem("zodi.readings", JSON.stringify(updated));
    if (expanded === id) setExpanded(null);
  }

  async function shareReading(r: SavedReading) {
    const text = `Mi lectura ZODI — ${r.section}:\n\n${r.text.slice(0, 600)}${r.text.length > 600 ? "..." : ""}\n\n🔮 zodi.aibueno.es`;
    if ("share" in navigator) {
      try { await navigator.share({ title: `ZODI: ${r.section}`, text }); return; } catch { /* cancelled */ }
    }
    navigator.clipboard.writeText(text);
  }

  const sections = ["Todas", ...Array.from(new Set(readings.map(r => r.section)))];
  const filtered = filter === "Todas" ? readings : readings.filter(r => r.section === filter);

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  }

  if (readings.length === 0) {
    return (
      <div className="glass-panel rounded-md p-10 text-center">
        <div className="text-5xl mb-4">📜</div>
        <h2 className="text-2xl font-black">Sin lecturas guardadas aun</h2>
        <p className="mt-3 text-sm text-white/55 max-w-sm mx-auto">
          Cuando hagas una consulta y pulses "Guardar", aparecera aqui. Hasta 30 lecturas.
        </p>
        <a href="/dashboard" className="mt-5 inline-block rounded-md bg-lime-300 px-6 py-3 font-black text-black">
          Hacer mi primera lectura
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {/* Filters */}
      <div className="glass-panel rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black">{readings.length} lectura{readings.length !== 1 ? "s" : ""} guardada{readings.length !== 1 ? "s" : ""}</h2>
          <button
            onClick={() => { if (confirm("Borrar todo el historial?")) { setReadings([]); localStorage.removeItem("zodi.readings"); } }}
            className="text-xs text-red-400/60 hover:text-red-400 transition"
          >
            Borrar todo
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold transition ${
                filter === s ? "border-lime-300 bg-lime-300/10 text-lime-200" : "border-white/10 text-white/50 hover:border-lime-300/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reading list */}
      <div className="grid gap-3">
        {filtered.map(r => (
          <div key={r.id} className="glass-panel rounded-md overflow-hidden">
            <button
              onClick={() => setExpanded(prev => prev === r.id ? null : r.id)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md border border-lime-300/25 bg-lime-300/5 px-2 py-0.5 text-xs font-bold text-lime-200">
                    {r.section}
                  </span>
                  <span className="text-xs text-white/40">{formatDate(r.date)}</span>
                </div>
                <p className="mt-1.5 text-sm text-white/70 line-clamp-2">{r.text}</p>
              </div>
              <span className="shrink-0 text-white/30 text-lg">{expanded === r.id ? "−" : "+"}</span>
            </button>

            {expanded === r.id && (
              <div className="border-t border-white/10 px-4 pb-4 pt-3">
                <div className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-white/80 overflow-x-auto">{r.text}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => shareReading(r)}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/55 hover:text-white/80 transition"
                  >
                    <Share2 className="h-3 w-3" /> Compartir
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(r.text); }}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/55 hover:text-white/80 transition"
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </button>
                  <button
                    onClick={() => { if (confirm("¿Borrar esta lectura?")) deleteReading(r.id); }}
                    className="flex items-center gap-1.5 rounded-md border border-red-500/20 px-3 py-2 text-xs font-bold text-red-400/60 hover:text-red-400 transition ml-auto"
                  >
                    <X className="h-3 w-3" /> Borrar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. LOGROS UI
// ─────────────────────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first",    emoji: "🔮", title: "Primera señal",      desc: "Hiciste tu primera consulta en ZODI",          check: (xp: number) => xp >= 10,   next: "Haz tu primera consulta" },
  { id: "xp100",   emoji: "⭐", title: "100 puntos de luz",  desc: "Acumulaste 100 XP",                             check: (xp: number) => xp >= 100,  next: "100 XP en total" },
  { id: "level2",  emoji: "🌙", title: "Lector de señales",  desc: "Alcanzaste el nivel 2",                        check: (xp: number) => xp >= 150,  next: "150 XP" },
  { id: "streak3", emoji: "🔥", title: "Racha de 3 días",    desc: "3 días seguidos consultando el cosmos",         check: (xp: number, s: number) => s >= 3,  next: "Consulta 3 días seguidos", streak: true },
  { id: "xp500",   emoji: "💎", title: "Medio camino",       desc: "500 XP acumulados",                            check: (xp: number) => xp >= 500,  next: "500 XP en total" },
  { id: "level3",  emoji: "🌟", title: "Buscador astral",    desc: "Nivel 3 desbloqueado",                         check: (xp: number) => xp >= 350,  next: "350 XP" },
  { id: "streak7", emoji: "💥", title: "Racha semanal",      desc: "7 días seguidos sin fallar",                   check: (xp: number, s: number) => s >= 7,  next: "7 días seguidos", streak: true },
  { id: "xp1000",  emoji: "🏆", title: "Mil puntos de luz",  desc: "1.000 XP — ya eres de los nuestros",          check: (xp: number) => xp >= 1000, next: "1000 XP" },
  { id: "level5",  emoji: "🔱", title: "Custodio de Runas",  desc: "Nivel 5 — estás en el top de usuarios ZODI",  check: (xp: number) => xp >= 2000, next: "2000 XP" },
  { id: "streak30",emoji: "🌈", title: "Constancia astral",  desc: "30 días seguidos. Esto es dedicación real.",   check: (xp: number, s: number) => s >= 30, next: "30 días seguidos", streak: true },
  { id: "xp5000",  emoji: "🌌", title: "Navegante del cosmos",desc: "5.000 XP — leyenda en camino",               check: (xp: number) => xp >= 5000, next: "5000 XP" },
  { id: "level10", emoji: "⚡", title: "Arcana Hacker",      desc: "Nivel 10. El 1% de usuarios ZODI.",            check: (xp: number) => xp >= 14000,next: "14000 XP" },
];

function LogrosUI() {
  const [xpData, setXpData]       = useState({ total: 0, today: 0, lastDate: "" });
  const [streakData, setStreak]   = useState({ count: 0, lastDate: "" });
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    setXpData(getXpData());
    setStreak(getStreak());
    setMounted(true);
  }, []);

  const xp      = xpData.total;
  const streak  = streakData.count;
  const unlocked = ACHIEVEMENTS.filter(a => a.check(xp, streak));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(xp, streak));

  if (!mounted) return <div className="flex justify-center py-12 text-white/30"><div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" /></div>;

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="glass-panel rounded-2xl p-5">
        <p className="zodi-kicker mb-3">Tu progreso</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Desbloqueados", value: unlocked.length, color: "text-lime-300" },
            { label: "Bloqueados",    value: locked.length,   color: "text-white/40" },
            { label: "Total",         value: ACHIEVEMENTS.length, color: "text-violet-300" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/08 bg-black/30 py-3">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desbloqueados */}
      {unlocked.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-lime-300/70 mb-2">✦ Desbloqueados ({unlocked.length})</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {unlocked.map(a => (
              <motion.div key={a.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl border border-lime-300/20 bg-lime-300/05 p-3">
                <span className="text-2xl shrink-0">{a.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-lime-200 truncate">{a.title}</p>
                  <p className="text-[11px] text-white/45 leading-snug">{a.desc}</p>
                </div>
                <span className="ml-auto shrink-0 text-lime-300 text-lg">✓</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bloqueados */}
      {locked.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-2">🔒 Por desbloquear ({locked.length})</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {locked.map(a => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/06 bg-black/25 p-3 opacity-60">
                <span className="text-2xl shrink-0 grayscale">{a.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white/50 truncate">{a.title}</p>
                  <p className="text-[11px] text-white/30">Necesitas: {a.next}</p>
                </div>
                <span className="ml-auto shrink-0 text-white/20 text-lg">🔒</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. RACHAS UI
// ─────────────────────────────────────────────────────────────────────────────
function RachasUI() {
  const [streakData, setStreak] = useState({ count: 0, lastDate: "" });
  const [xpData, setXpData]     = useState({ total: 0, today: 0, lastDate: "" });
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setStreak(getStreak());
    setXpData(getXpData());
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex justify-center py-12 text-white/30"><div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" /></div>;

  const streak       = streakData.count;
  const today        = new Date().toISOString().slice(0, 10);
  const consultedToday = xpData.today > 0 || xpData.lastDate === today;

  // Últimos 14 días
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    const isToday = iso === today;
    // Aproximación: si está dentro de la racha, consideramos activo
    const daysSinceToday = 13 - i;
    const active = daysSinceToday < streak || (isToday && consultedToday);
    return { iso, isToday, active };
  });

  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak) ?? 100;

  return (
    <div className="space-y-4">
      {/* Racha actual */}
      <div className="glass-panel rounded-2xl p-6 text-center">
        <p className="zodi-kicker mb-2">Racha actual</p>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="text-7xl font-black text-white my-2"
        >
          {streak}
        </motion.div>
        <div className="flex items-center justify-center gap-1.5">
          <Flame className="h-5 w-5 text-orange-400" />
          <span className="text-lg font-black text-orange-300">{streak === 1 ? "día seguido" : "días seguidos"}</span>
        </div>
        {!consultedToday && streak > 0 && (
          <p className="mt-3 text-sm text-orange-200/70 font-medium">⚠️ Consulta hoy para mantener la racha</p>
        )}
        {consultedToday && (
          <p className="mt-3 text-sm text-lime-300/70 font-medium">✓ Ya consultaste hoy — racha a salvo</p>
        )}
      </div>

      {/* Calendario últimos 14 días */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="zodi-kicker mb-3">Últimos 14 días</p>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(({ iso, isToday, active }) => (
            <div
              key={iso}
              className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition ${
                isToday
                  ? active ? "bg-lime-300 text-black" : "border-2 border-lime-300/50 text-lime-300/50"
                  : active ? "bg-orange-400/70 text-white" : "bg-white/05 text-white/20"
              }`}
              title={iso}
            >
              {active ? (isToday ? "✓" : "🔥") : "·"}
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-3 text-[10px] text-white/35">
          <span>🔥 = día activo</span>
          <span>✓ = hoy</span>
          <span>· = sin consulta</span>
        </div>
      </div>

      {/* Próximo hito */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="zodi-kicker mb-2">Próximo hito</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold">{streak} / {nextMilestone} días</span>
          <span className="text-sm font-black text-orange-300">{Math.round((streak / nextMilestone) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (streak / nextMilestone) * 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-[11px] text-white/40">Te faltan {Math.max(0, nextMilestone - streak)} días para desbloquear el hito de {nextMilestone}d</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. PUNTOS UI
// ─────────────────────────────────────────────────────────────────────────────
function PuntosUI() {
  const [xpData, setXpData]   = useState({ total: 0, today: 0, lastDate: "" });
  const [gems, setGems]        = useState(0);
  const [mounted, setMounted]  = useState(false);

  useEffect(() => {
    setXpData(getXpData());
    setGems(getGems().total);
    setMounted(true);
  }, []);

  if (!mounted) return <div className="flex justify-center py-12 text-white/30"><div className="h-6 w-6 animate-spin rounded-full border-2 border-lime-300 border-t-transparent" /></div>;

  const level      = getLevel(xpData.total);
  const title      = getLevelTitle(level);
  const { current, needed, percent } = xpToNextLevel(xpData.total);
  const nextTitle  = getLevelTitle(level + 1);

  const topActions = Object.entries(XP_PER_ACTION)
    .filter(([k]) => k !== "_default")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Nivel actual */}
      <div className="glass-panel rounded-2xl p-5">
        <p className="zodi-kicker mb-3">Tu nivel</p>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-lime-300/40 bg-lime-300/10 text-3xl font-black text-lime-300">
            {level}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-black text-white">{title}</p>
            <p className="text-[11px] text-white/40 mt-0.5">Siguiente nivel: {nextTitle}</p>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300"
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1 text-[10px] text-white/35">{current}/{needed} XP ({percent}%)</p>
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "XP Total",    value: xpData.total, color: "text-lime-300",  emoji: "⚡" },
          { label: "XP Hoy",     value: xpData.today, color: "text-cyan-300",  emoji: "📅" },
          { label: "Gemas",      value: gems,          color: "text-fuchsia-300",emoji: "💎" },
        ].map(({ label, value, color, emoji }) => (
          <div key={label} className="glass-panel rounded-xl p-3 text-center">
            <p className="text-lg">{emoji}</p>
            <p className={`text-xl font-black ${color} mt-0.5`}>{value}</p>
            <p className="text-[10px] text-white/35 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabla de XP por acción */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="zodi-kicker mb-3">¿Qué da más XP?</p>
        <div className="space-y-1.5">
          {topActions.map(([action, xp]) => (
            <div key={action} className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-white/08 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime-300/60 to-lime-300/20"
                  style={{ width: `${(xp / 100) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-white/60 w-32 truncate text-right">{action}</span>
              <span className="text-[11px] font-black text-lime-300 w-12 text-right">+{xp}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-white/30">El XP se acumula con cada lectura completada. Cuanto más profunda la consulta, más XP.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTER
// ─────────────────────────────────────────────────────────────────────────────
export function SectionSpecificUI({ section }: { section: DashboardSection }) {
  switch (section.slug) {
    case "tarot":
    case "celta":
      return <TarotUI section={section} />;
    case "nombre":
      return <NombreUI section={section} />;
    case "mano":
      return <ManoUI section={section} />;
    case "compatibilidad":
      return <CompatibilidadUI section={section} />;
    case "amigos":
      return <AmigosSectionUI />;
    case "numerologia":
      return <NumerologiaUI section={section} />;
    case "roast":
      return <RoastUI section={section} />;
    case "runas":
      return <RunasUI section={section} />;
    case "cristales":
      return <CristalesUI section={section} />;
    case "biorritmo":
      return <BiorritmoUI section={section} />;
    case "carta-natal":
      return <CartaNatalUI section={section} />;
    case "suenos":
      return <SuenosUI section={section} />;
    case "oraculo":
      return <AIAssistant />;
    case "chino":
      return <ChinoUI section={section} />;
    case "horoscopo":
    case "semana":
    case "mes":
    case "transitos":
      return <HoroscopoDiarioUI section={section} />;
    case "perfil":
      return <PerfilUI />;
    case "historial":
    case "guardados":
    case "favoritos":
      return <HistorialUI />;
    case "logros":
      return <LogrosUI />;
    case "rachas":
      return <RachasUI />;
    case "puntos":
    case "ranking":
      return <PuntosUI />;
    default:
      return <GenericConsultUI section={section} />;
  }
}
