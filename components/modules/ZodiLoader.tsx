"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Frases ácidas por tipo de lectura ─────────────────────────────────────────
const LOADING_PHRASES: Record<string, string[]> = {
  "daily-horoscope": [
    "Consultando las órbitas... el cosmos cobra por hora.",
    "Mercurio está procesando. Ya sabes cómo es él.",
    "Filtrando drama cósmico innecesario...",
    "Tu horóscopo está siendo revisado por una entidad sin paciencia.",
    "Los planetas están en reunión. Tardará lo que tarde.",
  ],
  tarot: [
    "Las cartas están siendo barajadas con manos invisibles...",
    "El tarot no tiene prisa. Tú sí. Soporta.",
    "Interpretando símbolos que preferirías ignorar...",
    "Las cartas han decidido. Ahora te preparan la verdad.",
    "Consulta aceptada. Verdad incómoda en camino.",
  ],
  compatibility: [
    "Analizando si tienen futuro o solo química temporal...",
    "Comparando energías. Los planetas levantan una ceja.",
    "Calculando probabilidad de que esto acabe bien...",
    "Compatibilidad en proceso. Spoiler: hay señales rojas.",
    "Tu conexión está siendo evaluada sin piedad.",
  ],
  numerology: [
    "Los números no mienten. Tú sí, a veces.",
    "Calculando tu vibración... y no es la que creías.",
    "Analizando patrones numéricos que llevas ignorando.",
    "El cosmos suma. El resultado te va a incomodar.",
    "Numerología en proceso. Prepárate para los patrones.",
  ],
  "palm-reading": [
    "Leyendo líneas que ya contaban lo que pasa...",
    "Tu palma tiene cosas que decir. ZODI las traduce.",
    "Las manos no mienten. Las palabras sí.",
    "Interpretando tu mapa personal sin exagerar (mucho).",
  ],
  runes: [
    "Las runas están hablando en nórdico antiguo...",
    "Invocando sabiduría vikinga con actitud moderna.",
    "Las runas han caído. Ahora te dicen qué ignorar.",
    "Órdenes nórdicas recibidas. Traducción en proceso.",
  ],
  "natal-chart": [
    "Calculando tu carta natal... esto tiene capas.",
    "Mapeando el caos que es tu psique astrológica.",
    "Tu carta astral es compleja. Como tú.",
    "Sol, luna, ascendente... ZODI lo une todo sin llorar.",
  ],
  dream: [
    "Analizando lo que tu mente dibujó mientras dormías...",
    "Traduciendo símbolos raros a mensajes útiles.",
    "Tu inconsciente es interesante. ZODI lo descifra.",
    "Interpretación de sueño en proceso. Sin Freud.",
  ],
  assistant: [
    "ZODI está pensando. No lo apures.",
    "Procesando tu pregunta con la calma que merece.",
    "El oráculo tarda lo que tarda. Respira.",
    "Consulta recibida. Respuesta siendo filtrada de drama.",
    "ZODI está en su dimensión. Ya vuelve.",
  ],
  _default: [
    "Consultando el cosmos. Tarda menos que tu ex en responder.",
    "Procesando señales astrales... sin prisa pero sin pausa.",
    "ZODI está leyendo las entrañas del universo. Un momento.",
    "El oráculo está en línea. Cargando tu destino.",
    "Señal astral recibida. Filtrando el ruido del universo.",
    "Las estrellas están alineando tu respuesta. Literalmente.",
    "Tu lectura está siendo preparada con actitud.",
    "Cargando sabiduría cósmica... y algo de sarcasmo.",
  ]
};

function getPhrases(kind?: string): string[] {
  if (!kind) return LOADING_PHRASES._default;
  return LOADING_PHRASES[kind] ?? LOADING_PHRASES._default;
}

type ZodiLoaderProps = {
  /** Si true, muestra el loader en pantalla completa (overlay) */
  fullscreen?: boolean;
  /** Si false o undefined, muestra inline/compacto */
  compact?: boolean;
  /** Tipo de lectura para las frases contextuales */
  kind?: string;
  /** Mensaje personalizado (reemplaza el ciclo de frases) */
  message?: string;
};

export function ZodiLoader({ fullscreen = false, compact = false, kind, message }: ZodiLoaderProps) {
  const phrases = getPhrases(kind);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [showPhrase, setShowPhrase] = useState(true);

  useEffect(() => {
    if (message) return; // no ciclar si hay mensaje fijo

    const interval = setInterval(() => {
      setShowPhrase(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % phrases.length);
        setShowPhrase(true);
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, [phrases.length, message]);

  const currentPhrase = message ?? phrases[phraseIdx];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-5 ${compact ? "py-8" : "py-12"}`}>
      {/* ZODI logo girando como un vinilo */}
      <div className="relative">
        {/* Anillo exterior giratorio */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-3 rounded-full border border-dashed border-lime-300/25"
        />
        {/* Anillo medio pulsante */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-1.5 rounded-full border border-lime-300/35"
        />
        {/* Logo ZODI girando */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className={`relative rounded-full overflow-hidden border-2 border-lime-300/50 shadow-[0_0_24px_rgba(184,255,23,0.30)] ${compact ? "h-16 w-16" : "h-24 w-24"}`}
        >
          <Image
            src="/zodi-logo-mark.png"
            alt="ZODI cargando"
            fill
            className="object-contain p-1.5"
            priority
          />
        </motion.div>
        {/* Punto central estático (aguja del vinilo) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(184,255,23,0.80)]" />
        </div>
      </div>

      {/* Puntos de carga */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full bg-lime-300"
          />
        ))}
      </div>

      {/* Frase contextual */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentPhrase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className={`text-center font-medium leading-snug text-white/60 ${compact ? "max-w-xs text-sm" : "max-w-sm text-base"}`}
        >
          {currentPhrase}
        </motion.p>
      </AnimatePresence>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="glass-panel rounded-2xl p-8 mx-4 max-w-sm w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

/** Versión inline ultra-compacta para usar dentro de botones o cards */
export function ZodiSpinner({ size = 20 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
      className="relative flex-shrink-0"
    >
      <Image src="/zodi-logo-mark.png" alt="Cargando" fill className="object-contain opacity-80" />
    </motion.div>
  );
}
