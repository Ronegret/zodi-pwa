"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Upload, RefreshCw, Star, Flame, Zap, Heart, Brain,
  LogOut, Trash2, Save, Camera, Check, X, Shuffle, Moon,
  Sun, CloudLightning, Droplets, Wind, Eye, EyeOff, Plus, Minus,
  Copy, Share2, BookOpen, AlertTriangle, Sparkles, ChartNoAxesCombined,
  Waves, NotebookPen, Gem
} from "lucide-react";
import { getLocalSession, setLocalSession, signOutZodi } from "@/lib/session";
import { getTodaysAstralContext, calculateSunSign } from "@/lib/astral";
import type { DashboardSection } from "@/lib/dashboard-sections";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { PremiumUI } from "@/components/dashboard/PremiumUI";
import { addXp, updateStreak, XP_PER_ACTION } from "@/lib/gamification";
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
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState<"breve" | "normal" | "extensa">("normal");
  // Lazy init: reads localStorage exactly ONCE per mount, not on every re-render.
  // Prevents unnecessary reads and avoids potential re-render cascades.
  const [session] = useState(getLocalSession);
  const [profile] = useState(() => buildProfile(getLocalSession()));

  const lengthHints: Record<string, string> = {
    breve:   "\n[LONGITUD: Respuesta BREVE. Máximo 4 frases directas, sin introducciones ni conclusiones largas.]",
    extensa: "\n[LONGITUD: Respuesta EXTENSA. Lectura amplia y detallada, desarrolla cada aspecto con matices concretos.]",
  };

  async function consult(input: string) {
    if (!input.trim() && !section.prompt) return;
    setLoading(true);
    setReply("");
    const fullInput = input + (lengthHints[length] ?? "");
    try {
      const { getFirebaseToken } = await import("@/lib/firebase/client");
      const token = await getFirebaseToken();

      const res = await fetch("/api/ai/reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ provider: "auto", kind: section.kind, input: fullInput, profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReply(data.error || "Necesitas iniciar sesión para consultar a ZODI.");
        return;
      }
      setReply(data.text || data.reading || "El universo tardó demasiado. Reintenta.");
    } catch {
      setReply("Señal cortada. El universo también tiene días de mala cobertura.");
    } finally {
      setLoading(false);
    }
  }

  return { reply, loading, consult, session, profile, length, setLength };
}

function buildProfile(session: ReturnType<typeof getLocalSession>) {
  if (!session.astralProfile) return null;
  const od = session.onboardingData;
  const ap = session.astralProfile;
  // Always recalculate sunSign from birthDate to fix any stored stale values
  const zodiac = od?.birthDate ? calculateSunSign(od.birthDate) : ap.sunSign;
  return {
    uid: session.uid,
    displayName: session.displayName,
    zodiac,
    moonSign: ap.moonSign,
    ascendant: ap.ascendant,
    birthDate: od?.birthDate,
    birthTime: od?.birthTime,
    birthCity: od?.birthCity,
    birthCountry: od?.birthCountry,
    lifePathNumber: ap.lifePathNumber,
    chineseZodiac: ap.chineseZodiac,
    mayanSign: ap.mayanSign,
    readingTone: od?.readingTone ?? "directo",
    favoriteTopics: od?.favoriteTopics ?? [],
    level: 1,
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
      <span className="animate-pulse text-sm text-lime-300/70">El cosmos esta procesando tu senal...</span>
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
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [spread, setSpread] = useState<"1" | "3" | "celta">("3");
  const [tone, setTone] = useState("directo");
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
          <div className={`grid gap-4 ${cardCount === 1 ? "max-w-xs mx-auto" : cardCount === 3 ? "grid-cols-3" : "grid-cols-3"}`}>
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
                      <div className="absolute inset-0 bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/Imagen-general-tarot-ZODI.png')] bg-cover bg-center opacity-80 hover:opacity-100 hover:scale-105 transition duration-500" />
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
                        ["bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Verdad.png')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/El-Karma.png')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Red-Flag.png')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/El-Destino.png')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Mala-Idea.png')]", "bg-[url('/zodi-art/nuevas/8-Tarot-ZODI/La-Venganza-Cosmica.png')]"][i % 6]
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
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [nombre, setNombre] = useState("");
  const [ap1, setAp1] = useState("");
  const [ap2, setAp2] = useState("");
  const [mode, setMode] = useState<"vibracion" | "historia" | "genealogia">("historia");

  const modes = [
    { key: "historia",   label: "Historia ZODI",    emoji: "📖", desc: "Tu nombre convertido en mito" },
    { key: "vibracion",  label: "Vibración",         emoji: "🔢", desc: "Energía numerológica de tu nombre" },
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
    const modeLabel = mode === "historia" ? "Inventa una historia mística en estilo ZODI (cyberpunk, oscuro, divertido) sobre el origen y energía del nombre completo. Que sea memorable y única."
      : mode === "vibracion" ? "Analiza la vibración numerológica de cada parte del nombre (nombre, primer apellido, segundo apellido) y su significado. Sé directo y concreto."
      : "Analiza el significado genealógico y energético de los apellidos. Qué herencia emocional, karma familiar y vibración pública cargan.";
    const extra = `Nombre: ${nombre}. Primer apellido: ${ap1 || "no indicado"}. Segundo apellido: ${ap2 || "no indicado"}. Nombre completo: ${nombreCompleto}. Vibración total: ${vibrTotal}.\n${modeLabel}`;
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
          {loading ? "ZODI descifra tu nombre..." : `Analizar ${mode === "historia" ? "mi historia" : mode === "vibracion" ? "mi vibración" : "mi genealogía"}`}
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
function CompatibilidadUI({ section }: { section: DashboardSection }) {
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const [theirSign, setTheirSign] = useState("");
  const [theirName, setTheirName] = useState("");
  const [relation, setRelation] = useState<"pareja" | "amistad" | "trabajo">("pareja");
  const mySign = session.astralProfile?.sunSign ?? "";

  const relations = [
    { key: "pareja",   label: "Pareja",   emoji: "💕" },
    { key: "amistad",  label: "Amistad",  emoji: "🤝" },
    { key: "trabajo",  label: "Trabajo",  emoji: "💼" },
  ] as const;

  async function analyze() {
    if (!theirSign) return;
    const extra = `Mi signo: ${mySign}. Signo de ${theirName || "la otra persona"}: ${theirSign}. Tipo de relación: ${relation}. Analiza química, comunicación, conflictos posibles, timing y consejo. Sé directo y útil.`;
    await consult(`${section.prompt}\n${extra}`);
  }

  return (
    <div className="grid gap-5">
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">Tipo de relación</h2>
        <div className="flex gap-3">
          {relations.map(r => (
            <button
              key={r.key}
              onClick={() => setRelation(r.key)}
              className={`flex-1 rounded-md border py-3 text-center font-black text-sm transition ${
                relation === r.key ? "border-lime-300 bg-lime-300/10 text-lime-200" : "border-white/10 text-white/60 hover:border-lime-300/25"
              }`}
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">Los dos perfiles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* My sign */}
          <div className="rounded-md border border-lime-300/20 bg-lime-300/5 p-4 flex flex-col items-center">
            <p className="text-xs uppercase tracking-widest text-lime-200/60 mb-2 w-full text-left">Tú</p>
            {mySign ? (
              <div className="relative w-32 h-32 mb-2">
                <Image src={`/zodi-art/nuevas/2-Compatibilidad/${mySign}.png`} alt={mySign} fill className="object-contain" />
              </div>
            ) : (
              <div className="text-4xl mb-2">⭐</div>
            )}
            <p className="font-black text-lime-200 text-lg">{mySign || "Desconocido"}</p>
            <p className="text-xs text-white/40">Signo solar</p>
          </div>
          {/* Their sign */}
          <div className="rounded-md border border-white/10 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">La otra persona</p>
            <input
              value={theirName}
              onChange={e => setTheirName(e.target.value)}
              placeholder="Nombre (opcional)"
              className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime-300/40 mb-3"
            />
            <p className="text-xs text-white/40 mb-2">Su signo solar</p>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {ZODIAC.map(z => (
                <button
                  key={z.name}
                  onClick={() => setTheirSign(z.name)}
                  title={z.name}
                  className={`relative aspect-square w-full rounded-md transition overflow-hidden ${
                    theirSign === z.name ? "ring-2 ring-lime-300 shadow-[0_0_15px_rgba(184,255,23,0.3)] scale-105" : "hover:bg-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={`/zodi-art/nuevas/2-Compatibilidad/${z.name}.png`} alt={z.name} fill className="object-contain p-1" />
                </button>
              ))}
            </div>
            {theirSign && <p className="mt-2 text-xs font-black text-lime-300">{theirSign} seleccionado</p>}
          </div>
        </div>

        <LengthSelector value={length} onChange={setLength} />
        <button
          onClick={analyze}
          disabled={loading || !theirSign}
          className="mt-3 w-full rounded-md bg-lime-300 py-3 font-black text-black disabled:opacity-50 hover:bg-lime-200 transition"
        >
          {loading ? "Analizando la química..." : `Analizar compatibilidad ${relation === "pareja" ? "💕" : relation === "amistad" ? "🤝" : "💼"}`}
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
            src={`/zodi-art/nuevas/7-Numerologia/${targetNumber}.png`}
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
                  <Image src={`/zodi-art/nuevas/7-Numerologia/${n}.png`} alt={`Número ${n}`} fill className="object-cover" />
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
        <div className="grid grid-cols-6 gap-2 mb-5">
          {ZODIAC.map(z => (
            <button
              key={z.name}
              onClick={() => setTargetSign(z.name)}
              title={z.name}
              className={`rounded-md border p-2 text-center transition ${
                targetSign === z.name
                  ? "border-orange-400 bg-orange-400/15"
                  : "border-white/10 hover:border-orange-400/30"
              }`}
            >
              <div className="text-xl">{z.emoji}</div>
              <div className="text-[9px] text-white/40 mt-0.5">{z.name.slice(0,3)}</div>
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
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[500px] bg-black">
          <Image
            src={`/zodi-art/chino/${currentImg}`}
            alt={targetSign}
            fill
            className="object-contain"
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
  const { reply, loading, consult, session, length, setLength } = useConsult(section);
  const [tone, setTone] = useState("directo");
  const [question, setQuestion] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const ctx = getTodaysAstralContext();

  const mySign = session.astralProfile?.sunSign ?? "Aries";
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
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] max-h-[500px] bg-black">
          <Image
            src={`/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${currentImg}`}
            alt={targetSign}
            fill
            className="object-contain"
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
// 11. PERFIL UI (full editor + sign out)
// ─────────────────────────────────────────────────────────────────────────────
function PerfilUI() {
  const router = useRouter();
  const session = getLocalSession();
  const [displayName, setDisplayName] = useState(session.displayName ?? "");
  const [email, setEmail] = useState(session.email ?? "");
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const ap = session.astralProfile;

  function saveProfile() {
    setLocalSession({ displayName, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

    // 3. Limpiar todo local y redirigir
    localStorage.clear();
    router.push("/");
  }

  return (
    <div className="grid gap-5">
      {/* Profile info */}
      <div className="glass-panel rounded-md p-5 relative">
        <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 shadow-[0_0_15px_rgba(184,255,23,0.2)]">
            <Gem className="h-4 w-4 text-lime-300" />
            <span className="text-sm font-bold text-lime-200" style={{ fontFamily: "var(--font-mono)" }}>
              {getLocalSession().isAuthenticated ? 200 : 0}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-black mb-5">Tu perfil (o lo que crees que eres)</h2>
        <div className="grid gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-white/40">Cómo quieres que te llame</span>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/45 px-4 py-3 text-white outline-none focus:border-lime-300/55"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-white/40">Correo electrónico</span>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-md border border-white/10 bg-black/45 px-4 py-3 text-white outline-none focus:border-lime-300/55"
            />
          </label>
        </div>
        <button
          onClick={saveProfile}
          className={`mt-4 flex items-center gap-2 rounded-md px-6 py-3 font-black text-sm transition ${
            saved ? "bg-green-400 text-black" : "bg-lime-300 text-black hover:bg-lime-200"
          }`}
        >
          {saved ? <><Check className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
        </button>
      </div>

      {/* PWA Install Card (will return null if not installable or dismissed) */}
      <InstallPwaCard />

      {/* Rewards & Referrals */}
      <div className="glass-panel rounded-md p-5 border border-yellow-400/20 bg-yellow-400/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20">
            <Gem className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-yellow-100">Programa Embajadores ZODI</h2>
            <p className="text-xs text-yellow-200/60">Invita amigos y gana recompensas</p>
          </div>
        </div>
        <p className="text-sm text-white/70 mb-4">
          Gana <strong className="text-yellow-400">500 gemas</strong> por cada amigo que se registre con tu enlace. Ellos recibirán <strong className="text-yellow-400">200 gemas extra</strong> para empezar.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 p-2">
          <input 
            readOnly 
            value={typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${session.uid}` : ''}
            className="w-full bg-transparent text-sm text-white/50 outline-none px-2"
          />
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(`${window.location.origin}/auth/register?ref=${session.uid}`);
                const btn = document.getElementById("copy-btn");
                if (btn) { btn.innerText = "¡Copiado!"; setTimeout(() => btn.innerText = "Copiar", 2000); }
              }
            }}
            id="copy-btn"
            className="shrink-0 rounded bg-yellow-400 px-4 py-2 text-xs font-black text-black hover:bg-yellow-300 transition"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Push Notifications UI */}
      <div className="glass-panel rounded-md p-5 border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
              <span className="text-xl">🔔</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-purple-100">Notificaciones del Cosmos</h2>
              <p className="text-xs text-purple-200/60">Avisos de gemas y eventos astrales</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (typeof window !== 'undefined' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  alert("¡El cosmos te avisará! (Pronto configuraremos Firebase Messaging completo)");
                } else {
                  alert("Permiso denegado. No podremos avisarte de premios.");
                }
              }
            }}
            className="shrink-0 rounded bg-purple-500 px-4 py-2 text-xs font-black text-white hover:bg-purple-400 transition"
          >
            Activar
          </button>
        </div>
      </div>

      {/* Astral data */}
      {ap && (
        <div className="glass-panel rounded-md p-5">
          <h2 className="text-xl font-black mb-4">Tu perfil astral</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Signo solar", value: ap.sunSign ?? "–", type: "zodiac", img: `/zodiac/${ap.sunSign?.toLowerCase() === 'piscis' ? 'picis' : ap.sunSign?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()}.png` },
              { label: "Luna",        value: ap.moonSign ?? "–",   emoji: "🌙" },
              { label: "Ascendente",  value: ap.ascendant ?? "–",  emoji: "⬆️" },
              { label: "Camino vida", value: String(ap.lifePathNumber ?? "–"), type: "numerology", img: `/zodi-art/nuevas/7-Numerologia/${ap.lifePathNumber}.png` },
              { label: "Chino",       value: ap.chineseZodiac ?? "–", type: "chinese", img: `/zodi-art/chino/C_${ap.chineseZodiac ? ap.chineseZodiac.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""}.png` },
              { label: "Maya",        value: ap.mayanSign ?? "–",  emoji: "🌿" },
            ].map(item => (
              <div key={item.label} className="rounded-md border border-white/10 bg-black/30 p-3 flex flex-col items-center text-center">
                <p className="text-xs text-white/40 mb-2 w-full text-left">{item.label}</p>
                {item.img && item.value !== "–" ? (
                  <div className="relative w-16 h-16 mb-2">
                    <Image src={item.img} alt={item.value} fill className="object-contain" />
                  </div>
                ) : (
                  <p className="text-3xl mb-2">{item.emoji}</p>
                )}
                <p className="font-black text-sm">{item.value}</p>
              </div>
            ))}
          </div>
          <a
            href="/onboarding"
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/15 px-5 py-2.5 text-sm font-bold text-white/60 hover:text-white/90 transition"
          >
            <RefreshCw className="h-4 w-4" /> Recalcular mi destino
          </a>
        </div>
      )}

      {/* Account actions */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-xl font-black mb-4">Cuenta</h2>
        <div className="grid gap-3">
          <button
            onClick={signOut}
            className="flex items-center gap-3 rounded-md border border-white/15 px-5 py-3 font-bold text-white/70 hover:border-red-400/40 hover:text-red-400 transition"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
          <button
            onClick={() => setShowDelete(!showDelete)}
            className="flex items-center gap-3 rounded-md border border-red-500/20 px-5 py-3 font-bold text-red-400/70 hover:border-red-500/50 hover:text-red-400 transition"
          >
            <Trash2 className="h-4 w-4" /> Eliminar cuenta
          </button>
        </div>

        {showDelete && (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <p className="font-black text-red-400 text-sm">Esta acción es irreversible</p>
            </div>
            <p className="text-sm text-white/60 mb-3">Escribe <strong className="text-red-400">ELIMINAR</strong> para confirmar</p>
            <div className="flex gap-3">
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="ELIMINAR"
                className="flex-1 rounded-md border border-red-500/30 bg-black/45 px-4 py-2 text-sm text-white outline-none"
              />
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== "ELIMINAR"}
                className="rounded-md bg-red-500 px-5 py-2 font-black text-sm text-white disabled:opacity-40"
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
  const ap = session.astralProfile;

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
  const { reply, loading, consult, length, setLength } = useConsult(section);
  const [question, setQuestion] = useState("");
  const [tone, setTone] = useState("directo");
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
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-white/80">{r.text}</pre>
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
                    onClick={() => deleteReading(r.id)}
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
    case "amigos":
      return <CompatibilidadUI section={section} />;
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
    default:
      return <GenericConsultUI section={section} />;
  }
}
