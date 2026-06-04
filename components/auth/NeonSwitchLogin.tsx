"use client";

import { useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { AuthForm } from "@/components/auth/AuthForm";

// ── Sintetiza el clic del interruptor con Web Audio API ────────────────────
function playSwitchSound(on: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Click mecánico
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(on ? 900 : 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(on ? 200 : 120, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);

    if (on) {
      // Chispa de encendido adicional
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(3000, ctx.currentTime + 0.02);
      osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc2.start(ctx.currentTime + 0.02);
      osc2.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Silencio si el navegador no soporta Web Audio
  }
}

// ── Partícula de chispa ────────────────────────────────────────────────────
function Spark({ x, y, angle }: { x: number; y: number; angle: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-lime-300 pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      animate={{
        opacity: 0,
        scale: 0,
        x: Math.cos(angle) * 32,
        y: Math.sin(angle) * 32,
      }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    />
  );
}

interface Props {
  mode: "login" | "register";
}

export function NeonSwitchLogin({ mode }: Props) {
  const [isOn, setIsOn] = useState(mode === "register");
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);
  const [sparkId, setSparkId] = useState(0);

  const toggle = useCallback(() => {
    const next = !isOn;
    setIsOn(next);
    playSwitchSound(next);

    if (next) {
      const newSparks = Array.from({ length: 8 }, (_, i) => ({
        id: sparkId + i,
        x: 12 + Math.random() * 8,
        y: 12 + Math.random() * 8,
        angle: (Math.PI * 2 * i) / 8 + Math.random() * 0.5,
      }));
      setSparkId(s => s + 8);
      setSparks(prev => [...prev, ...newSparks]);
      setTimeout(() => setSparks(prev => prev.filter(s => !newSparks.find(n => n.id === s.id))), 500);
    }
  }, [isOn, sparkId]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* ── Interruptor de pared ────────────────────────────────────────────── */}
      <div className="flex flex-col items-center mb-8">
        {/* Texto de estado */}
        <motion.p
          key={isOn ? "on" : "off"}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="mb-6 text-xs font-black uppercase tracking-[0.35em] text-center"
          style={{ color: isOn ? "rgba(184,255,23,0.7)" : "rgba(255,255,255,0.25)" }}
        >
          {isOn
            ? "⚡ El oráculo está activo"
            : mode === "login"
              ? "🌑 Activa el interruptor para entrar"
              : "🌑 Activa el interruptor para crear tu cuenta"}
        </motion.p>

        {/* Placa del interruptor */}
        <motion.div
          className="relative cursor-pointer select-none"
          whileTap={{ scale: 0.97 }}
          onClick={toggle}
          onTouchEnd={e => { e.preventDefault(); toggle(); }}
          role="button"
          aria-label={isOn ? "Apagar" : "Encender"}
          aria-pressed={isOn}
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") toggle(); }}
        >
          {/* Sparks container */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <AnimatePresence>
              {sparks.map(s => <Spark key={s.id} x={s.x} y={s.y} angle={s.angle} />)}
            </AnimatePresence>
          </div>

          {/* Halo de luz cuando está ON */}
          <AnimatePresence>
            {isOn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -inset-8 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(184,255,23,0.18) 0%, rgba(184,255,23,0.05) 50%, transparent 75%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Placa exterior — marco de pared */}
          <motion.div
            className="relative rounded-2xl"
            style={{
              width: 88,
              height: 120,
              background: isOn
                ? "linear-gradient(145deg, #111118, #0a0a0f)"
                : "linear-gradient(145deg, #0e0e14, #070710)",
              border: isOn
                ? "2px solid rgba(184,255,23,0.55)"
                : "2px solid rgba(255,255,255,0.12)",
              boxShadow: isOn
                ? "0 0 28px rgba(184,255,23,0.35), 0 0 60px rgba(184,255,23,0.12), inset 0 1px 0 rgba(184,255,23,0.15)"
                : "0 4px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
              transition: "box-shadow 0.4s ease, border-color 0.3s ease, background 0.3s ease",
            }}
          >
            {/* Tornillo decorativo sup izq */}
            <div
              className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)"
              }}
            />
            {/* Tornillo decorativo inf der */}
            <div
              className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)"
              }}
            />

            {/* Rocker button — el interruptor propiamente */}
            <motion.div
              className="absolute"
              style={{
                left: 12,
                right: 12,
                top: 14,
                bottom: 14,
                borderRadius: 10,
                transformOrigin: "center center",
                transformStyle: "preserve-3d",
              }}
              animate={{
                rotateX: isOn ? -14 : 14,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.6 }}
            >
              {/* Cara del rocker */}
              <div
                className="absolute inset-0 rounded-[10px]"
                style={{
                  background: isOn
                    ? "linear-gradient(180deg, rgba(184,255,23,0.08) 0%, rgba(0,0,0,0.7) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 100%)",
                  border: isOn
                    ? "1px solid rgba(184,255,23,0.3)"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isOn
                    ? "0 2px 12px rgba(184,255,23,0.2), inset 0 1px 0 rgba(184,255,23,0.2)"
                    : "0 6px 16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4)",
                  transition: "all 0.3s ease",
                }}
              />

              {/* Indicador "I" (ON) arriba del rocker */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  left: "50%",
                  top: 10,
                  transform: "translateX(-50%)",
                  width: 20,
                  height: 20,
                }}
              >
                <div
                  className="font-black text-xs"
                  style={{
                    color: isOn ? "rgba(184,255,23,0.9)" : "rgba(255,255,255,0.2)",
                    textShadow: isOn ? "0 0 8px rgba(184,255,23,0.8)" : "none",
                    fontFamily: "monospace",
                    fontSize: 16,
                    lineHeight: 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  I
                </div>
              </div>

              {/* LED indicator — pequeño punto luminoso */}
              <motion.div
                className="absolute"
                style={{
                  left: "50%",
                  bottom: 12,
                  transform: "translateX(-50%)",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                }}
                animate={{
                  backgroundColor: isOn ? "#b8ff17" : "#1a1a2e",
                  boxShadow: isOn
                    ? "0 0 6px rgba(184,255,23,1), 0 0 12px rgba(184,255,23,0.6)"
                    : "none",
                }}
                transition={{ duration: 0.25 }}
              />
            </motion.div>

            {/* Sombra dinámica inferior del rocker */}
            <motion.div
              className="absolute rounded-[10px] pointer-events-none"
              style={{
                left: 12, right: 12,
                top: 14, bottom: 14,
                borderRadius: 10,
              }}
              animate={{
                boxShadow: isOn
                  ? "0 8px 20px rgba(0,0,0,0.6)"
                  : "0 2px 8px rgba(0,0,0,0.3)",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Label debajo */}
        <motion.div
          className="mt-4 flex items-center gap-1.5"
          animate={{ opacity: isOn ? 0.6 : 0.3 }}
        >
          <div
            className="w-4 h-[1px]"
            style={{ background: isOn ? "rgba(184,255,23,0.6)" : "rgba(255,255,255,0.2)" }}
          />
          <span
            className="text-[9px] font-black uppercase tracking-[0.3em]"
            style={{ color: isOn ? "rgba(184,255,23,0.7)" : "rgba(255,255,255,0.3)" }}
          >
            ZODI
          </span>
          <div
            className="w-4 h-[1px]"
            style={{ background: isOn ? "rgba(184,255,23,0.6)" : "rgba(255,255,255,0.2)" }}
          />
        </motion.div>
      </div>

      {/* ── Formulario — aparece al activar el interruptor ────────────────────── */}
      <AnimatePresence mode="wait">
        {isOn && (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Línea de energía del interruptor al form */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-[1px] pointer-events-none"
              style={{ top: -24, height: 24, background: "linear-gradient(to bottom, rgba(184,255,23,0.4), transparent)" }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />

            <Suspense fallback={<div className="h-40 flex items-center justify-center text-white/30">Cargando...</div>}>
              <AuthForm mode={mode} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlay oscuro cuando está OFF (solo en login) ──────────────────── */}
      <AnimatePresence>
        {!isOn && mode === "login" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
          >
            <p className="text-sm text-white/20 max-w-xs leading-relaxed">
              El oráculo no revela nada en la oscuridad.<br />
              <span className="text-white/35">Activa el interruptor para encender la sesión.</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
