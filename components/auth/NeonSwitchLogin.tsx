"use client";

import { useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthForm } from "@/components/auth/AuthForm";

// ── Sonido del interruptor (Web Audio API, sin archivos externos) ────────────
function playSwitchSound(on: boolean) {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx() as AudioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(on ? 900 : 600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(on ? 200 : 80, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* silencio si no hay Web Audio */ }
}

// ── Chispa animada ───────────────────────────────────────────────────────────
function Spark({ angle }: { angle: number }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-lime-300 pointer-events-none"
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: Math.cos(angle) * 40, y: Math.sin(angle) * 40, opacity: 0, scale: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  );
}

// ── Interruptor de pared ─────────────────────────────────────────────────────
function WallSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  const [sparks, setSparks] = useState<number[]>([]);

  function handleToggle() {
    onToggle();
    if (!isOn) {
      setSparks(Array.from({ length: 8 }, (_, i) => i));
      setTimeout(() => setSparks([]), 600);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Etiqueta de estado */}
      <motion.div
        key={isOn ? "on" : "off"}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-xs font-black uppercase tracking-[0.28em]"
          style={{ color: isOn ? "rgba(184,255,23,0.85)" : "rgba(255,255,255,0.6)" }}>
          {isOn ? "⚡ Oráculo activo" : "🌑 Oráculo dormido"}
        </p>
        {!isOn && (
          <p className="mt-1 text-[11px] text-white/40">Toca el interruptor para entrar</p>
        )}
      </motion.div>

      {/* Placa del interruptor */}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={isOn}
        aria-label={isOn ? "Apagar oráculo" : "Encender oráculo"}
        onClick={handleToggle}
        onTouchEnd={e => { e.preventDefault(); handleToggle(); }}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleToggle(); }}
        className="relative cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Halo al encender */}
        <AnimatePresence>
          {isOn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute -inset-10 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(184,255,23,0.15) 0%, transparent 70%)" }}
            />
          )}
        </AnimatePresence>

        {/* Chispas */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence>
            {sparks.map(i => (
              <Spark key={i} angle={(Math.PI * 2 * i) / sparks.length} />
            ))}
          </AnimatePresence>
        </div>

        {/* Caja del interruptor */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          style={{
            width: 96,
            height: 130,
            borderRadius: 16,
            background: isOn
              ? "linear-gradient(160deg, #141420, #0c0c14)"
              : "linear-gradient(160deg, #1e1e2a, #141420)",
            border: isOn
              ? "2px solid rgba(184,255,23,0.7)"
              : "2px solid rgba(255,255,255,0.35)",
            boxShadow: isOn
              ? "0 0 32px rgba(184,255,23,0.4), 0 0 80px rgba(184,255,23,0.1), inset 0 1px 0 rgba(184,255,23,0.2)"
              : "0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
            transition: "all 0.35s ease",
            position: "relative",
          }}
        >
          {/* Tornillo sup-izq */}
          <div style={{
            position: "absolute", top: 8, left: 8, width: 10, height: 10,
            borderRadius: "50%", background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
          }} />
          {/* Tornillo inf-der */}
          <div style={{
            position: "absolute", bottom: 8, right: 8, width: 10, height: 10,
            borderRadius: "50%", background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
          }} />

          {/* Rocker — bascula según estado */}
          <motion.div
            animate={{ rotateX: isOn ? -16 : 16 }}
            transition={{ type: "spring", stiffness: 450, damping: 26 }}
            style={{
              position: "absolute", left: 14, right: 14, top: 16, bottom: 16,
              borderRadius: 10, transformOrigin: "center center",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Cara del rocker */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 10,
              background: isOn
                ? "linear-gradient(180deg, rgba(184,255,23,0.1) 0%, rgba(0,0,0,0.65) 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.55) 100%)",
              border: isOn
                ? "1px solid rgba(184,255,23,0.4)"
                : "1px solid rgba(255,255,255,0.15)",
              boxShadow: isOn
                ? "0 2px 16px rgba(184,255,23,0.25), inset 0 1px 0 rgba(184,255,23,0.3)"
                : "0 8px 20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)",
              transition: "all 0.3s ease",
            }} />

            {/* "I" (encendido) arriba */}
            <div style={{
              position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
              fontFamily: "monospace", fontSize: 18, fontWeight: 900, lineHeight: 1,
              color: isOn ? "rgba(184,255,23,1)" : "rgba(255,255,255,0.3)",
              textShadow: isOn ? "0 0 10px rgba(184,255,23,0.9)" : "none",
              transition: "all 0.3s ease",
            }}>I</div>

            {/* "O" (apagado) abajo */}
            <div style={{
              position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
              fontFamily: "monospace", fontSize: 13, fontWeight: 900, lineHeight: 1,
              color: isOn ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
              transition: "all 0.3s ease",
            }}>O</div>

            {/* LED */}
            <motion.div
              animate={{
                backgroundColor: isOn ? "#b8ff17" : "#1a1a2e",
                boxShadow: isOn ? "0 0 8px rgba(184,255,23,1), 0 0 16px rgba(184,255,23,0.5)" : "none",
              }}
              transition={{ duration: 0.2 }}
              style={{
                position: "absolute", left: "50%", top: "50%",
                transform: "translate(-50%, -50%)",
                width: 7, height: 7, borderRadius: "50%",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Etiqueta ZODI debajo */}
      <div className="flex items-center gap-2">
        <div className="h-px w-8" style={{ background: isOn ? "rgba(184,255,23,0.5)" : "rgba(255,255,255,0.15)" }} />
        <span className="text-[9px] font-black uppercase tracking-[0.35em]"
          style={{ color: isOn ? "rgba(184,255,23,0.6)" : "rgba(255,255,255,0.25)" }}>
          ZODI
        </span>
        <div className="h-px w-8" style={{ background: isOn ? "rgba(184,255,23,0.5)" : "rgba(255,255,255,0.15)" }} />
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export function NeonSwitchLogin({ mode }: { mode: "login" | "register" }) {
  // Login: OFF por defecto. Register: ON (el oráculo te recibe al crear cuenta)
  const [isOn, setIsOn] = useState(mode === "register");

  const toggle = useCallback(() => {
    playSwitchSound(!isOn);
    setIsOn(v => !v);
  }, [isOn]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-8">
      {/* El interruptor — siempre visible, centrado */}
      <WallSwitch isOn={isOn} onToggle={toggle} />

      {/* El formulario aparece / desaparece con AnimatePresence */}
      <AnimatePresence mode="wait">
        {isOn ? (
          <motion.div
            key="form-on"
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <Suspense fallback={
              <div className="flex items-center justify-center py-12 text-white/40 text-sm">
                Cargando...
              </div>
            }>
              <AuthForm mode={mode} />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            key="form-off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center px-4"
          >
            <p className="text-sm text-white/25 leading-relaxed">
              El oráculo no revela nada en la oscuridad.<br />
              <span className="text-white/40">
                {mode === "login" ? "Activa el interruptor para iniciar sesión." : "Activa el interruptor para crear tu cuenta."}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
