"use client";

import { useRef, useState } from "react";
import { Bot, Check, Copy, Send, Share2, Star } from "lucide-react";
import { getLocalSession, getSessionProfile } from "@/lib/session";
import { demoProfile } from "@/lib/data";
import { addXp, updateStreak } from "@/lib/gamification";
import { getFirebaseToken } from "@/lib/firebase/client";

// ── Inline markdown renderer ───────────────────────────────────────────────
function MarkdownText({ text }: { text: string }) {
  function parseInline(s: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index));
      if (m[2]) parts.push(<strong key={m.index} className="font-black text-white">{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={m.index} className="italic text-white/80">{m[3]}</em>);
      else if (m[4]) parts.push(<code key={m.index} className="rounded bg-white/10 px-1 text-lime-300 font-mono text-[0.8em]">{m[4]}</code>);
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(s.slice(last));
    return parts.length > 0 ? parts : s;
  }
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^-{3,}$/.test(line.trim()))              nodes.push(<hr key={i} className="border-white/15 my-3" />);
    else if (line.startsWith("### "))             nodes.push(<h3 key={i} className="mt-4 mb-1 text-sm font-black text-lime-300">{parseInline(line.slice(4))}</h3>);
    else if (line.startsWith("## "))              nodes.push(<h2 key={i} className="mt-4 mb-1 text-base font-black text-lime-200">{parseInline(line.slice(3))}</h2>);
    else if (line.startsWith("# "))               nodes.push(<h1 key={i} className="mt-4 mb-2 text-lg font-black text-white">{parseInline(line.slice(2))}</h1>);
    else if (line.startsWith("- ") || line.startsWith("* ")) nodes.push(<div key={i} className="flex gap-2"><span className="mt-1 text-lime-300 shrink-0">·</span><span>{parseInline(line.slice(2))}</span></div>);
    else if (line.trim() === "")                  nodes.push(<div key={i} className="h-2" />);
    else                                          nodes.push(<p key={i} className="leading-7 text-white/85">{parseInline(line)}</p>);
  }
  return <div className="space-y-0.5">{nodes}</div>;
}

const quickPrompts = [
  "Que energia debo cuidar hoy?",
  "Dame una senal sobre trabajo.",
  "Hazme una lectura brutal pero util.",
  "Que patron repito que ya deberia haber cortado?",
  "Cual es mi mayor bloqueo en este momento?",
  "Dame un consejo corto y sin adornos.",
];

export function AIAssistant() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [length, setLength] = useState<"breve" | "normal" | "extensa">("normal");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const lengthHints: Record<string, string> = {
    breve:   " [Respuesta BREVE: máximo 4 frases directas, sin introducciones largas.]",
    extensa: " [Respuesta EXTENSA: lectura amplia y detallada, desarrolla cada aspecto.]",
  };

  // Lazy init: read localStorage once on mount, not on every re-render
  const [sign] = useState(() => getLocalSession().astralProfile?.sunSign);

  const personalizedPrompts = sign
    ? [
        `Que le espera hoy a ${sign}?`,
        "Hazme una lectura brutal pero util.",
        "Que patron repito que ya deberia haber cortado?",
        "Dame una senal concreta sobre amor.",
        "Cual es mi mayor bloqueo ahora mismo?",
        "Dame un consejo corto y sin adornos.",
      ]
    : quickPrompts;

  async function ask(text?: string) {
    const query = (text ?? input).trim();
    if (!query) return;

    setLoading(true);
    setReply("");
    setSaved(false);
    const sessionProfile = getSessionProfile();
    const profile = sessionProfile ?? demoProfile;
    const fullQuery = query + (lengthHints[length] ?? "");
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
            kind: "assistant",
            input: fullQuery,
            profile: {
              zodiac:             profile.zodiac,
              moonSign:           profile.moonSign,
              ascendant:          profile.ascendant,
              birthDate:          profile.birthDate,
              birthTime:          profile.birthTime,
              birthCity:          profile.birthCity,
              birthCountry:       profile.birthCountry,
              currentCity:        profile.currentCity,
              currentCountry:     profile.currentCountry,
              lifePathNumber:     profile.lifePathNumber,
              chineseZodiac:      profile.chineseZodiac,
              mayanSign:          profile.mayanSign,
              readingTone:        profile.readingTone ?? "sarcastico",
              favoriteTopics:     profile.favoriteTopics,
              displayName:        profile.displayName,
              level:              profile.level,
              relationshipStatus: (profile as any).relationshipStatus,
              partnerName:        (profile as any).partnerName,
              partnerBirthDate:   (profile as any).partnerBirthDate,
              hasKids:            (profile as any).hasKids,
              kidsCount:          (profile as any).kidsCount,
              personalBio:        (profile as any).personalBio,
            },
          }),
          signal: AbortSignal.timeout(20000),
        });
      } catch (fetchErr: any) {
        // Error de red o timeout
        const isTimeout = fetchErr?.name === "TimeoutError";
        setReply(isTimeout
          ? "El oráculo tardó demasiado. Puede que los astros estén ocupados. Reintenta. ⏳"
          : "No hay conexión con el servidor. Asegúrate de que la app está corriendo. 🔌");
        return;
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        setReply("El servidor respondió algo raro. Recarga la página e inténtalo de nuevo. 🔄");
        return;
      }

      if (!response.ok) {
        const errMsg = data?.error || data?.text || "Error del servidor";
        setReply(`ZODI tuvo un problema: ${errMsg}. Reintenta en un momento.`);
        return;
      }

      const text = data.text || `${data.reading ?? ""} ${data.roast ?? ""}`.trim() || "ZODI no encontró respuesta esta vez. Reintenta.";
      setReply(text);
      if (text) { addXp("Oráculo personal"); updateStreak(); }
    } catch {
      setReply("Algo falló en la consulta. Recarga la página si persiste. 🔮");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  }

  function pickPrompt(prompt: string) {
    setInput(prompt);
    ask(prompt);
    inputRef.current?.focus();
  }

  function copy() {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function saveReading() {
    if (!reply) return;
    try {
      const existing = JSON.parse(localStorage.getItem("zodi.readings") ?? "[]");
      const entry = { id: Date.now(), date: new Date().toISOString(), section: "Oraculo personal", text: reply };
      localStorage.setItem("zodi.readings", JSON.stringify([entry, ...existing].slice(0, 30)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
  }

  async function share() {
    if (!reply) return;
    const text = `Mi consulta ZODI:\n\n${reply.slice(0, 600)}${reply.length > 600 ? "..." : ""}\n\n🔮 zodi.aibueno.es`;
    if ("share" in navigator) {
      try { await navigator.share({ title: "ZODI: Oraculo personal", text }); return; } catch { /* cancelled */ }
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Chat panel */}
      <div className="glass-panel rounded-md p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-purple-400 text-black shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-lime-200/60">ZODI responde</p>
            <h2 className="text-2xl font-black">Oraculo personal</h2>
          </div>
        </div>

        {/* Reply area */}
        <div className="min-h-[80px] rounded-md border border-purple-300/20 bg-black/35 p-4 text-sm leading-7">
          {loading ? (
            <div className="flex items-center gap-3 text-lime-300/70">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-lime-300 border-t-transparent shrink-0" />
              <span className="animate-pulse">Consultando el caos...</span>
            </div>
          ) : reply ? (
            <MarkdownText text={reply} />
          ) : (
            <p className="text-white/35 italic">Tu lectura aparecera aqui. Escribe una pregunta o elige una de la lista.</p>
          )}
        </div>

        {/* Action buttons — only when there's a reply */}
        {reply && !loading && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={copy} className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/55 transition hover:text-white/80">
              {copied ? <><Check className="h-3 w-3 text-lime-300" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
            </button>
            <button onClick={saveReading} className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-bold transition ${saved ? "border-lime-300/50 bg-lime-300/10 text-lime-300" : "border-lime-300/20 text-lime-200/70 hover:text-lime-200"}`}>
              {saved ? <><Check className="h-3 w-3" /> Guardado</> : <><Star className="h-3 w-3" /> Guardar</>}
            </button>
            <button onClick={share} className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-white/55 transition hover:text-white/80">
              <Share2 className="h-3 w-3" /> Compartir
            </button>
          </div>
        )}

        {/* Length selector */}
        <div className="mt-3 flex flex-wrap gap-2">
          <p className="w-full text-[10px] uppercase tracking-widest text-white/35">Longitud</p>
          {(["breve", "normal", "extensa"] as const).map(l => (
            <button
              key={l}
              onClick={() => setLength(l)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition ${
                length === l
                  ? "bg-cyan-300 text-black"
                  : "border border-white/10 text-white/50 hover:border-cyan-300/40 hover:text-cyan-200"
              }`}
            >
              {l === "breve" ? "⚡ Breve" : l === "extensa" ? "📜 Extensa" : "📖 Normal"}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Pregunta lo que pesa... (Enter para enviar)"
            className="min-w-0 flex-1 resize-none rounded-md border border-white/10 bg-black/45 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-lime-300/50"
          />
          <button
            onClick={() => ask()}
            disabled={loading || !input.trim()}
            aria-label="Enviar consulta a ZODI"
            className="grid h-full w-12 place-items-center rounded-md bg-lime-300 text-black transition hover:bg-lime-200 disabled:opacity-50 active:scale-95"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-white/30">Enter para enviar · Shift+Enter para nueva linea</p>
      </div>

      {/* Quick prompts panel */}
      <div className="glass-panel rounded-md p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-fuchsia-200/70 mb-4">
          {sign ? `Preguntas para ${sign}` : "Ideas para preguntar"}
        </p>
        <div className="grid gap-2">
          {personalizedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => pickPrompt(prompt)}
              disabled={loading}
              className="rounded-md border border-white/10 bg-white/[0.03] p-3 text-left text-sm font-bold text-white/72 transition hover:border-lime-300/40 hover:bg-lime-300/5 hover:text-lime-100 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
