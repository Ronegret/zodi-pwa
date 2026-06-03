"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getLocalSession } from "@/lib/session";

// ── Frases por franja horaria ─────────────────────────────────────────────────
// 7+ frases por franja → con rotación por día nunca se repite en semanas
const PHRASES: Record<string, string[]> = {
  madrugada: [ // 0-5h
    "A estas horas solo se hacen las preguntas que importan. Adelante.",
    "El cosmos también duerme. Contigo hace una excepción.",
    "Las {h}am no mienten. ¿Qué no te deja dormir?",
    "Bienvenido al club de los que piensan demasiado de noche.",
    "El astral nocturno habla más claro. Escucha bien.",
    "A esta hora el ego baja la guardia. La verdad entra sola.",
    "Las madrugadas son para las preguntas que el día no se atreve a hacer.",
    "Consultando el universo a las {h} de la madrugada. Esto es serio.",
    "A esta hora solo están despiertos los elegidos y los perdidos. Bienvenido.",
  ],
  temprano: [ // 5-9h
    "¿Ya viniste a cotillar tan temprano? El cosmos acaba de despertar.",
    "Buenos días. Los astros llevan horas moviéndose. Tú llegas justo.",
    "Tan temprano y ya buscando señales. El universo te lo agradece.",
    "El sol ni ha calentado y ya estás aquí. Eso se llama energía.",
    "Mañanero y consultando el cosmos. Esto es productividad real.",
    "Buenos días. Lo que decidas antes de las 10 marca el resto del día.",
    "A esta hora el ego baja la guardia. El cosmos habla más claro.",
    "Tan madrugador. Los astros también se sorprenden, pero te reciben.",
  ],
  manana: [ // 9-13h
    "La mañana en marcha. Perfecta hora para recibir lo que el cosmos tiene.",
    "¿Ya tienes el día claro? El oráculo ayuda con lo que falta.",
    "A media mañana y consultando el universo. Prioridades claras.",
    "El Sol está subiendo. Tú también. Buena sincronía.",
    "Mañana activa. El cosmos también tiene agenda hoy.",
    "Esta hora es tuya. Las estrellas llevan preparando tu lectura desde el amanecer.",
    "A esta hora el cerebro funciona al 100. Aprovecha que el cosmos también.",
    "La mañana es el mejor momento para hacer las preguntas que pesan.",
  ],
  tarde: [ // 13-18h
    "Tarde de señales. El universo ya procesó tu mañana.",
    "Mitad del día. ¿Cómo va ese plan que tenías?",
    "La tarde es para los que saben que el día no se improvisa todo.",
    "Ya va la mitad. El cosmos pregunta: ¿qué hiciste con la mañana?",
    "Tarde de decisiones. O de procrastinación. ZODI no juzga.",
    "El día ya tiene vida propia. Hora de recalibrar.",
    "A esta hora el Sol está bajando. Ideal para tomar decisiones con perspectiva.",
    "Tarde adentro. El universo tiene algo concreto que decirte.",
  ],
  atardecer: [ // 18-22h
    "El día ya dio lo que tenía. ¿Viniste a procesar o a cotillar?",
    "El crepúsculo es la hora de las decisiones. ¿Qué decidiste hoy?",
    "A esta hora ya se saben las respuestas. Las preguntas cambian.",
    "Cerrando el día con el cosmos. Buenas elecciones.",
    "Noche que entra. Las mejores preguntas llegan con el sol cayendo.",
    "Final de día. ZODI tiene mucho que decirte antes de que cierres.",
    "La tarde se fue. El universo espera tu informe del día.",
    "A esta hora el ego empieza a cansarse. Las verdades salen más fácil.",
  ],
  noche: [ // 22-24h
    "A estas horas solo están despiertos los que piensan demasiado. Bienvenido.",
    "La noche es honesta. Cuéntame qué no te dejas decir de día.",
    "Las estrellas están en turno. Tú también llegas puntual.",
    "Los mejores pensamientos llegan de noche. ¿Qué traes hoy?",
    "Noche de señales. El cosmos también trabaja en turno nocturno.",
    "A esta hora el universo habla en voz baja. Escucha bien.",
    "Noche adentro y aquí estás. El cosmos también esperaba esto.",
    "A esta hora el ego descansa. Buena hora para la verdad.",
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
  const slot   = getSlot(h);
  const pool   = PHRASES[slot];
  // Semilla por día del año → cada día distinta frase del mismo slot
  const now    = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const idx    = dayOfYear % pool.length;
  const phrase = pool[idx];
  // Sustituir {h} por la hora actual si aparece
  return phrase.replace("{h}", String(h));
}

// ── Estrellas CSS-only ────────────────────────────────────────────────────────
const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  top:  `${5 + Math.floor(((i * 37 + 13) * 97) % 90)}%`,
  left: `${3 + Math.floor(((i * 53 + 7) * 83) % 93)}%`,
  size: 1 + (i % 3),
  delay: (i * 0.18) % 3,
  dur:   2 + (i % 3) * 0.7,
}));

// ── Lógica de sesión ──────────────────────────────────────────────────────────
function shouldShow(): boolean {
  if (typeof window === "undefined") return false;
  const key  = "zodi.splashed";
  const seen = sessionStorage.getItem(key);
  if (seen) return false;
  sessionStorage.setItem(key, "1");
  return true;
}

// ── Componente principal ──────────────────────────────────────────────────────
export function WelcomeSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [name, setName]       = useState("");
  const [phrase, setPhrase]   = useState("");

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

    // Auto-dismiss después de 3s
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 600);
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    if (!exiting) {
      setExiting(true);
      setTimeout(() => setVisible(false), 600);
    }
  };

  return (
    <>
      {/* Dashboard se renderiza en background — listo cuando el splash desaparece */}
      <div className={visible ? "pointer-events-none select-none" : undefined}>
        {children}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
            onClick={dismiss}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black cursor-pointer overflow-hidden"
            aria-hidden="true"
          >
            {/* Estrellas — CSS only, sin JS extra */}
            {STARS.map(s => (
              <span
                key={s.id}
                className="absolute rounded-full bg-white"
                style={{
                  top: s.top,
                  left: s.left,
                  width: s.size,
                  height: s.size,
                  opacity: 0,
                  animation: `zodi-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
                }}
              />
            ))}

            {/* Contenido central */}
            <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-lg">

              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.75, y: -12 }}
                animate={{ opacity: 1,  scale: 1,    y: 0   }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              >
                <Image
                  src="/zodi-art/brand/logo.png"
                  alt="ZODI"
                  width={120}
                  height={60}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </motion.div>

              {/* Bienvenido, [nombre] */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1,  y: 0  }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.55 }}
                className="flex flex-col items-center gap-1"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-lime-300/60">
                  ✦ bienvenido de vuelta
                </p>
                <h1
                  className="text-4xl sm:text-5xl font-black text-white leading-tight"
                  style={{ fontFamily: "var(--font-display, sans-serif)" }}
                >
                  {name}
                </h1>
              </motion.div>

              {/* Frase del día */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1,  y: 0  }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 1.05 }}
                className="text-base sm:text-lg text-white/65 leading-relaxed font-light max-w-sm"
              >
                {phrase}
              </motion.p>

              {/* Hint de click */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 1.9 }}
                className="text-[10px] text-white/20 uppercase tracking-[0.3em]"
              >
                Toca para entrar
              </motion.p>
            </div>

            {/* Barra de progreso */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-lime-300/60"
              initial={{ width: "0%" }}
              animate={{ width: exiting ? "100%" : "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframes de estrellas — inline style para no necesitar config tailwind */}
      <style>{`
        @keyframes zodi-twinkle {
          0%, 100% { opacity: 0;    transform: scale(1);    }
          50%       { opacity: 0.65; transform: scale(1.35); }
        }
      `}</style>
    </>
  );
}
