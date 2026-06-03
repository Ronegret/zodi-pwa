"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getLocalSession } from "@/lib/session";

// ── Frases por franja horaria ─────────────────────────────────────────────────
const PHRASES: Record<string, string[]> = {
  madrugada: [
    "A estas horas solo se hacen las preguntas que importan.",
    "El cosmos también duerme. Contigo hace una excepción.",
    "Las {h}am no mienten. ¿Qué no te deja dormir?",
    "Bienvenido al club de los que piensan demasiado de noche.",
    "El astral nocturno habla más claro. Escucha bien.",
    "A esta hora el ego baja la guardia. La verdad entra sola.",
    "Las madrugadas son para las preguntas que el día no se atreve a hacer.",
    "Consultando el universo a las {h} de la madrugada. Esto es serio.",
    "A esta hora solo están despiertos los elegidos y los perdidos.",
  ],
  temprano: [
    "¿Ya viniste a cotillar tan temprano? El cosmos acaba de despertar.",
    "Buenos días. Los astros llevan horas moviéndose. Tú llegas justo.",
    "Tan temprano y ya buscando señales. El universo te lo agradece.",
    "El sol ni ha calentado y ya estás aquí. Eso se llama energía.",
    "Mañanero y consultando el cosmos. Esto es productividad real.",
    "Lo que decidas antes de las 10 marca el resto del día.",
    "A esta hora el ego baja la guardia. El cosmos habla más claro.",
    "Tan madrugador. Los astros también se sorprenden, pero te reciben.",
    "Buenos días. El oráculo también madruga. Qué remedio.",
  ],
  manana: [
    "La mañana en marcha. El cosmos tiene algo preparado para ti hoy.",
    "¿Ya tienes el día claro? El oráculo ayuda con lo que falta.",
    "A media mañana y consultando el universo. Prioridades claras.",
    "El Sol está subiendo. Tú también. Buena sincronía.",
    "Mañana activa. El cosmos también tiene agenda hoy.",
    "Las estrellas llevan preparando tu lectura desde el amanecer.",
    "A esta hora el cerebro funciona al 100. El cosmos también.",
    "La mañana es el mejor momento para las preguntas que pesan.",
    "Buen momento para recibir lo que el universo tiene que decirte.",
  ],
  tarde: [
    "Tarde de señales. El universo ya procesó tu mañana.",
    "Mitad del día. ¿Cómo va ese plan que tenías?",
    "La tarde es para los que saben que el día no se improvisa todo.",
    "Ya va la mitad. El cosmos pregunta: ¿qué hiciste con la mañana?",
    "Tarde de decisiones. O de procrastinación. ZODI no juzga.",
    "El día ya tiene vida propia. Hora de recalibrar con el cosmos.",
    "El Sol está bajando. Ideal para tomar decisiones con perspectiva.",
    "Tarde adentro. El universo tiene algo concreto que decirte.",
    "¿La mañana fue caótica? La tarde siempre da una segunda oportunidad.",
  ],
  atardecer: [
    "El día ya dio lo que tenía. ¿Viniste a procesar o a cotillar?",
    "El crepúsculo es la hora de las decisiones. ¿Qué decidiste hoy?",
    "A esta hora ya se saben las respuestas. Las preguntas cambian.",
    "Cerrando el día con el cosmos. Buenas elecciones.",
    "Noche que entra. Las mejores preguntas llegan con el sol cayendo.",
    "Final de día. El cosmos tiene mucho que decirte antes de que cierres.",
    "La tarde se fue. El universo espera tu informe del día.",
    "A esta hora el ego empieza a cansarse. Las verdades salen más fácil.",
    "El atardecer es honesto. ¿Qué fue lo real de hoy?",
  ],
  noche: [
    "A estas horas solo están despiertos los que piensan demasiado.",
    "La noche es honesta. Cuéntame qué no te dejas decir de día.",
    "Las estrellas están en turno. Tú también llegas puntual.",
    "Los mejores pensamientos llegan de noche. ¿Qué traes hoy?",
    "Noche de señales. El cosmos también trabaja en turno nocturno.",
    "A esta hora el universo habla en voz baja. Escucha bien.",
    "Noche adentro y aquí estás. El cosmos también lo esperaba.",
    "A esta hora el ego descansa. Buena hora para la verdad.",
    "La noche tiene sus propias respuestas. Aquí estamos para encontrarlas.",
  ],
};

function getSlot(h: number): string {
  if (h < 5)  return "madrugada";
  if (h < 9)  return "temprano";
  if (h < 13) return "manana";
  if (h < 18) return "tarde";
  if (h < 22) return "atardecer";
  return "noche";
}

function getDailyPhrase(h: number): string {
  const slot  = getSlot(h);
  const pool  = PHRASES[slot];
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const day   = Math.floor((now.getTime() - start) / 86400000);
  const phrase = pool[day % pool.length];
  return phrase.replace("{h}", String(h));
}

// ── Estrellas CSS-only (sin JS extra) ────────────────────────────────────────
const STARS = Array.from({ length: 36 }, (_, i) => ({
  id:    i,
  top:   `${4 + ((i * 37 + 13) * 97) % 88}%`,
  left:  `${2 + ((i * 53 + 7)  * 83) % 94}%`,
  size:  1 + (i % 3) * 0.5,
  delay: (i * 0.22) % 3.5,
  dur:   1.8 + (i % 4) * 0.6,
}));

// ── Hook: máquina de escribir ─────────────────────────────────────────────────
function useTypewriter(text: string, startDelay = 1300, charMs = 36) {
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping]       = useState(false);
  const [done, setDone]           = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setDone(false);
    setTyping(false);
    let charIdx = 0;
    let interval: ReturnType<typeof setInterval>;

    const startTimer = setTimeout(() => {
      setTyping(true);
      interval = setInterval(() => {
        charIdx++;
        setDisplayed(text.slice(0, charIdx));
        if (charIdx >= text.length) {
          clearInterval(interval);
          setTyping(false);
          setDone(true);
        }
      }, charMs);
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [text, startDelay, charMs]);

  return { displayed, typing, done };
}

// ── Session gate ──────────────────────────────────────────────────────────────
function shouldShow(): boolean {
  if (typeof window === "undefined") return false;
  const key = "zodi.splashed";
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, "1");
  return true;
}

// ── Componente ────────────────────────────────────────────────────────────────
export function WelcomeSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [name, setName]       = useState("");
  const [phrase, setPhrase]   = useState("");
  const dismissRef = useRef(false);

  const { displayed, typing, done } = useTypewriter(phrase, 1350, 36);

  useEffect(() => {
    if (!shouldShow()) return;

    const session = getLocalSession();
    const first   = (
      session.onboardingData?.displayName ||
      session.displayName ||
      "viajero"
    ).split(" ")[0];
    const h = new Date().getHours();

    setName(first);
    setPhrase(getDailyPhrase(h));
    setVisible(true);
  }, []);

  // Auto-dismiss cuando termina de escribir + 1.8s de pausa
  useEffect(() => {
    if (!done || dismissRef.current) return;
    const t = setTimeout(dismiss, 1800);
    return () => clearTimeout(t);
  }, [done]);

  function dismiss() {
    if (dismissRef.current) return;
    dismissRef.current = true;
    setLeaving(true);
    setTimeout(() => setVisible(false), 650);
  }

  // Duración de la barra = startDelay + texto * charMs + pausa
  const barDuration = 1.35 + phrase.length * 0.036 + 1.8;

  return (
    <>
      {/* Dashboard se renderiza en background — 0 overhead de performance */}
      <div className={visible ? "pointer-events-none select-none" : undefined}>
        {children}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: leaving ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            onClick={dismiss}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black cursor-pointer overflow-hidden"
            aria-hidden="true"
          >
            {/* Estrellas parpadeantes — CSS keyframes, GPU */}
            {STARS.map(s => (
              <span
                key={s.id}
                className="absolute rounded-full bg-white pointer-events-none"
                style={{
                  top: s.top, left: s.left,
                  width: s.size, height: s.size,
                  opacity: 0,
                  animation: `zodi-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}

            {/* Contenido central */}
            <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center max-w-md w-full">

              {/* ── Logo efecto estampilla ── */}
              <motion.div
                initial={{ scale: 2.2, rotate: -6, opacity: 0, y: -20 }}
                animate={{ scale: 1,   rotate: 0,  opacity: 1, y: 0   }}
                transition={{
                  type: "spring",
                  stiffness: 480,
                  damping: 14,
                  opacity: { duration: 0.18, ease: "easeIn" },
                }}
                className="relative"
              >
                {/* Anillo de "tinta" al sellar */}
                <motion.div
                  className="absolute inset-0 -m-3 rounded-full"
                  initial={{ scale: 1.8, opacity: 0.55 }}
                  animate={{ scale: 3,   opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
                  style={{ background: "radial-gradient(circle, rgba(184,255,23,0.25) 0%, transparent 70%)" }}
                />
                <Image
                  src="/zodi-art/brand/logo.webp"
                  alt="ZODI"
                  width={140}
                  height={70}
                  className="h-16 w-auto object-contain drop-shadow-[0_0_18px_rgba(184,255,23,0.35)]"
                  priority
                />
              </motion.div>

              {/* ── Bienvenido + nombre ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1,  y: 0  }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.55 }}
                className="flex flex-col items-center gap-1"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.42em] text-lime-300/55">
                  ✦ bienvenido de vuelta
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                  {name}
                </h1>
              </motion.div>

              {/* ── Máquina de escribir ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phrase ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 1.2 }}
                className="min-h-[3.5rem] flex items-center justify-center"
              >
                <p className="text-base sm:text-lg text-white/70 leading-relaxed font-light">
                  {displayed}
                  {/* cursor parpadeante mientras escribe */}
                  {typing && (
                    <span
                      className="inline-block w-[2px] h-[1em] bg-lime-300 ml-0.5 align-middle"
                      style={{ animation: "zodi-blink 0.65s step-end infinite" }}
                    />
                  )}
                </p>
              </motion.div>

              {/* ── Hint ── */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: done ? 0.3 : 0 }}
                transition={{ duration: 0.5 }}
                className="text-[10px] text-white/40 uppercase tracking-[0.3em]"
              >
                Toca para entrar
              </motion.p>
            </div>

            {/* Barra de progreso sincronizada con duración real */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-lime-300/50 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: leaving ? 1 : 1 }}
              transition={{ duration: barDuration, ease: "linear" }}
              style={{ width: "100%" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes zodi-twinkle {
          0%, 100% { opacity: 0;    transform: scale(1);    }
          50%       { opacity: 0.6;  transform: scale(1.4); }
        }
        @keyframes zodi-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </>
  );
}
