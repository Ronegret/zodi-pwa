"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, ChevronDown, ChevronRight, Download,
  Sparkles, X, Zap, Star, Shield, Smile, Moon
} from "lucide-react";
import { featureModules, plans } from "@/lib/data";

const readingTitles = [
  "Horóscopo diario","Horóscopo semanal","Horóscopo mensual","Carta natal",
  "Lectura de tarot","Tirada celta","Compatibilidad","Interpretación de sueños",
  "Numerología","Tránsitos astrológicos","Lectura de nombre","Horóscopo chino",
  "Horóscopo maya","Runas vikingas","Lecturas de cristales","Horóscopo roast",
  "Predicciones personalizadas"
];

const mainConsultas = [
  {
    title: "Horóscopo personal",
    body: "Abre el día con una lectura clara sobre amor, dinero, trabajo y energía. Sin sermones: señales útiles, humor ácido y algo que puedas aplicar hoy mismo.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.webp",
    action: "Ver horóscopos",
    href: "/auth/register",
    badge: "🔥 Más popular",
    badgeColor: "bg-orange-400/20 border-orange-400/40 text-orange-300",
  },
  {
    title: "Tarot y tiradas",
    body: "Elige el tono y deja que ZODI traduzca el caos: situación, bloqueo, consejo y esa verdad incómoda que probablemente ya sabías.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tarot-acido.webp",
    action: "Tirar las cartas",
    href: "/auth/register",
    badge: "🃏 7 cartas ZODI",
    badgeColor: "bg-violet-400/20 border-violet-400/40 text-violet-300",
  },
  {
    title: "Numerología profunda",
    body: "Calcula camino de vida, vibración del nombre y fechas clave. Los números no te salvan, pero sí delatan patrones con una precisión molesta.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.webp",
    action: "Calcular números",
    href: "/auth/register",
    badge: "🔢 IA avanzada",
    badgeColor: "bg-cyan-400/20 border-cyan-400/40 text-cyan-300",
  },
  {
    title: "Horóscopo chino",
    body: "Tu animal, elemento, ciclos y compatibilidades. Ideal para entender ritmos largos y no llamar \"destino\" a una mala costumbre que repites desde 2018.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-chino.webp",
    action: "Descubrir mi ciclo",
    href: "/auth/register",
    badge: "🐉 Ciclo 12 años",
    badgeColor: "bg-red-400/20 border-red-400/40 text-red-300",
  }
];

const steps = [
  { n: "01", title: "Crea tu cuenta gratis", body: "En menos de un minuto. Sin tarjeta de crédito, sin trampas. Solo tú y el cosmos." },
  { n: "02", title: "Completa tu perfil astral", body: "Fecha, hora y lugar de nacimiento. Con eso armamos tu mapa: signo solar, luna, ascendente, numerología y ciclos." },
  { n: "03", title: "Elige qué quieres consultar", body: "17 tipos de lectura: horóscopo, tarot, carta natal, sueños, runas, nombre, compatibilidad y más." },
  { n: "04", title: "Elige tu tono", body: "Suave, directo, brutal o sarcástico. ZODI se adapta a cómo quieres recibir la verdad." },
  { n: "05", title: "Guarda lo que resuena", body: "Lecturas guardadas, favoritos e historial para releerlos cuando el universo diga: te lo advertí." },
  { n: "06", title: "Sube de nivel", body: "Rachas, logros y comunidad. Abrir tu oráculo también puede sentirse como una misión desbloqueada." }
];

const TESTIMONIALS = [
  { name: "Sofía M.", sign: "Escorpio ♏", stars: 5, location: "Madrid", text: "ZODI me dijo en enero que febrero iba a ser brutal en trabajo. Era sarcástico pero exacto. Ya no consulto decisiones sin leerlo primero." },
  { name: "Tomás R.", sign: "Aries ♈", stars: 5, location: "Buenos Aires", text: "Pensé que era otra app de horóscopo genérico. Me equivoqué. Le pedí un análisis de mi situación con mi ex y fue más útil que tres sesiones de terapia." },
  { name: "Daniela V.", sign: "Piscis ♓", stars: 5, location: "Ciudad de México", text: "El tono brutal es adictivo. Te dice cosas incómodas pero de una forma que no puedes ignorarlas. Lo uso cada mañana antes del café." },
  { name: "Marcos A.", sign: "Capricornio ♑", stars: 5, location: "Santiago de Chile", text: "La carta natal me dejó sin palabras. Detalles que nunca le había contado a nadie pero que resonaron tanto que lo guardé en favoritos." },
  { name: "Lucía T.", sign: "Géminis ♊", stars: 5, location: "Barcelona", text: "Lo instalé como PWA en el móvil y lo uso a diario. La racha me motiva más de lo que esperaba. Ya voy por 23 días seguidos." },
  { name: "Andrés F.", sign: "Sagitario ♐", stars: 5, location: "Bogotá", text: "Le pregunté sobre compatibilidad con alguien y el análisis fue tan preciso sobre los choques que tiene que haber algo real en esto. Increíble." },
];

const faqData = [
  ["¿ZODI es gratis?", "Sí. Entras gratis, completas tu perfil y consultas lecturas sin pagar nada. El plan gratuito es generoso: queremos que pruebes si ZODI te habla claro antes de sacar la tarjeta."],
  ["¿Tengo que saber astrología?", "No. ZODI está pensado para gente normal con preguntas normales. Explicamos cada lectura con palabras simples: qué significa, cómo te afecta y qué puedes hacer."],
  ["¿Por qué piden fecha y lugar de nacimiento?", "Para crear tu perfil astral real. Sin esos datos solo tienes un horóscopo de revista, igual para todos los Escorpio del planeta. Con tu información, las lecturas se sienten tuyas."],
  ["¿Puedo guardar lecturas?", "Sí. Guardadas, favoritas e historial. Muy útil para cuando en lunes no te creas la lectura y el jueves estés viviendo exactamente eso."],
  ["¿Puedo usarlo desde el móvil?", "Sí. Está diseñado primero para móvil: navegación táctil, botones grandes y una experiencia que se siente como app nativa. Instálala en tu pantalla de inicio gratis."],
  ["¿Las lecturas son destino absoluto?", "No. Son guía simbólica, emocional y práctica. Si una lectura te ayuda a ver algo con más claridad, perfecto. Si te dice que escribas a alguien a las 2 AM, eso eras tú, no el cosmos."],
  ["¿Hay comunidad?", "Sí. Publicaciones por signo, reacciones, comentarios y confesiones cósmicas. Anónimo o con tu perfil astral, como quieras."],
  ["¿ZODI tiene app?", "Es una PWA: una app web que funciona como app nativa en iOS y Android. Se instala en dos toques desde el navegador, sin pasar por ninguna tienda."],
];

// ── Stats de confianza ──────────────────────────────────────────────────────
const trustStats = [
  { n: "17+", label: "tipos de lectura", icon: "🔮" },
  { n: "4",   label: "tonos de respuesta", icon: "🎭" },
  { n: "IA",  label: "personalizada", icon: "⚡" },
  { n: "100%", label: "gratis para empezar", icon: "✓" },
];

// ── FAQ Acordeón ─────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? "border-lime-300/30 bg-lime-300/04" : "border-white/08 bg-black/25"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left"
      >
        <span className="font-black text-sm sm:text-base text-white/90 leading-snug">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-lime-300/60"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 pb-5 text-sm leading-7 text-white/65">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sticky bottom CTA — aparece al salir del hero ──────────────────────────
function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("hero-cta-sentinel");
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (!dismissed) setVisible(!entry.isIntersecting); },
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-[60] md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-2xl border border-lime-300/30 bg-black/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <Link
              href="/auth/register"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-lime-300 py-3.5 text-sm font-black text-black active:scale-95 transition"
            >
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 transition"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          className="relative max-h-[92vh] max-w-[95vw] sm:max-w-[85vw]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Vista ampliada" className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl" />
          <button
            onClick={onClose}
            className="absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 transition"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── MarketingHome ─────────────────────────────────────────────────────────────
export function MarketingHome() {
  const readings = featureModules.filter((module) => readingTitles.includes(module.title));
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <StickyMobileCTA />

      {/* ══════════════════════════════════════════════════════════════
          HERO — mobile-first: personaje visible en todos los tamaños
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">

        {/* Fondo */}
        <div className="absolute inset-0 bg-[url('/zodi-art/poster-chaos.webp')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(5,5,7,0.6)] via-[rgba(5,5,7,0.5)] to-[rgba(5,5,7,1)] lg:bg-[linear-gradient(110deg,rgba(5,5,7,.92)_40%,rgba(5,5,7,0.2)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-0 lg:grid lg:min-h-[92vh] lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-12 lg:pt-16 lg:pb-16">

          {/* ── Texto + CTAs ── */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime-300/35 bg-lime-300/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-lime-300 sm:text-xs"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-300 animate-pulse" />
              Oráculo Astral con IA · Gratis
            </motion.p>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl text-[2.6rem] font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-[4.2rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tu oráculo personal.<br />
              <span className="text-lime-300">Con personalidad.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.55 }}
              className="mt-4 max-w-md text-base leading-7 text-white/68 sm:text-lg"
            >
              Horóscopo, tarot, carta natal, numerología y comunidad. Con IA que te conoce de verdad y un tono que te habla sin postureo espiritual.
            </motion.p>

            {/* Trust pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {["✓ Gratis para empezar", "✓ Sin tarjeta de crédito", "✓ App móvil incluida"].map(t => (
                <span key={t} className="rounded-full border border-white/12 bg-white/05 px-3 py-1 text-[11px] font-semibold text-white/55">{t}</span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-6 flex flex-wrap gap-3 sm:mt-8"
              id="hero-cta-sentinel"
            >
              <Link
                href="/auth/register"
                className="hero-cta-pulse flex items-center gap-2.5 rounded-2xl bg-lime-300 px-6 py-4 text-sm font-black text-black shadow-[0_0_24px_rgba(184,255,23,0.3)] transition hover:bg-lime-200 active:scale-95 sm:text-base"
              >
                Empezar gratis <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <a
                href="#consultas"
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/05 px-5 py-4 text-sm font-bold text-white/75 transition hover:border-white/30 hover:text-white active:scale-95 sm:text-base"
              >
                Ver lecturas
              </a>
            </motion.div>
          </div>

          {/* ── Personaje ZODI — visible en TODOS los tamaños ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-6 flex justify-center lg:mt-0"
          >
            {/* Mobile: personaje apuntando al usuario, compacto */}
            <div className="relative lg:hidden w-full max-w-xs mx-auto">
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,5,7,1)] via-transparent to-transparent z-10 h-full" style={{ top: "60%" }} />
              <Image
                src="/zodi-art/nuevas/2-Portada--Home/ZODI-senalando-al-usuario.webp"
                alt="ZODI apuntando — tu oráculo personal"
                width={380}
                height={480}
                className="relative z-0 h-72 w-full object-contain object-bottom drop-shadow-[0_0_40px_rgba(184,255,23,0.2)]"
                priority
              />
            </div>

            {/* Desktop: imagen hero principal en panel glass */}
            <div className="hidden lg:block glass-panel neon-border rounded-2xl p-4 w-full max-w-lg">
              <button
                onClick={() => setLightbox("/zodi-art/nuevas/2-Portada--Home/Hero-principal-portada.webp")}
                className="group relative block w-full overflow-hidden rounded-xl"
                aria-label="Ver imagen completa"
              >
                <Image
                  src="/zodi-art/nuevas/2-Portada--Home/Hero-principal-portada.webp"
                  alt="Oráculo cyberpunk ZODI"
                  width={540}
                  height={540}
                  className="h-auto w-full rounded-xl opacity-95 transition duration-500 group-hover:scale-[1.02]"
                  priority
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </button>
              {/* Mini stats bajo la imagen */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["🔮", "17+", "lecturas"], ["🎭", "4", "tonos"], ["⚡", "IA", "real"]].map(([e, n, l]) => (
                  <div key={l} className="rounded-xl border border-white/08 bg-black/30 py-2.5">
                    <div className="text-base">{e}</div>
                    <div className="text-sm font-black text-lime-300">{n}</div>
                    <div className="text-[10px] text-white/40">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SOCIAL PROOF STRIP — trust signals
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/06 bg-black/40 py-5 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trustStats.map(({ n, label, icon }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-lg font-black text-white leading-tight">{n}</p>
                  <p className="text-[11px] text-white/45 leading-snug">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CONSULTAS — 4 tarjetas principales
      ══════════════════════════════════════════════════════════════ */}
      <Section id="consultas" kicker="Empieza por aquí" title="Elige qué quieres consultar hoy.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mainConsultas.map((item, index) => (
            <FadeUp key={item.title} delay={index * 0.08}>
              <motion.div whileHover={{ y: -6 }} className="glass-panel group flex h-full flex-col overflow-hidden rounded-2xl">
                {/* Imagen */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-white/65">{item.body}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95"
                  >
                    {item.action} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          QUÉ ES ZODI — 5 pilares
      ══════════════════════════════════════════════════════════════ */}
      <Section id="que-es" kicker="Qué es ZODI" title="Un oráculo moderno para consultar sin hablar en modo gurú.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: Moon,    color: "text-violet-300", bg: "bg-violet-500/15 border-violet-400/25", title: "Astrología personal", body: "Lecturas construidas alrededor de tu perfil real. No un texto genérico que le sirve a tu vecino." },
            { icon: Sparkles,color: "text-cyan-300",   bg: "bg-cyan-500/15 border-cyan-400/25",     title: "Tarot directo",      body: "Tiradas con mensajes claros para cuando necesitas respuesta y no otra nube de incienso verbal." },
            { icon: Zap,     color: "text-lime-300",   bg: "bg-lime-500/15 border-lime-400/25",     title: "Oráculo con IA",     body: "Escribe lo que te pasa. ZODI responde con tono humano: suave, directo, brutal o sarcástico." },
            { icon: Star,    color: "text-fuchsia-300",bg: "bg-fuchsia-500/15 border-fuchsia-400/25",title: "Comunidad mística",  body: "Publicaciones, reacciones y confesiones cósmicas. Como terapia grupal, pero más neón." },
            { icon: Shield,  color: "text-amber-300",  bg: "bg-amber-500/15 border-amber-400/25",   title: "Progreso y rituales",body: "Rachas, logros y puntos para que volver cada día se sienta útil, divertido y un poco adictivo." },
          ].map(({ icon: Icon, color, bg, title, body }, i) => (
            <FadeUp key={title} delay={i * 0.08}>
              <motion.div whileHover={{ y: -5 }} className="glass-panel rounded-2xl p-5 h-full flex flex-col gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h3 className="font-black text-base">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          TAROT ZODI — carrusel horizontal con indicador
      ══════════════════════════════════════════════════════════════ */}
      <Section id="tarot" kicker="Tarot ZODI" title="Respuestas que pican. Pero que necesitas escuchar.">
        <div className="relative">
          {/* Gradiente scroll right hint */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-6 w-16 bg-gradient-to-l from-[#050507] to-transparent z-10" />
          <div className="no-scrollbar flex snap-x gap-3 sm:gap-4 overflow-x-auto pb-4" style={{ scrollPaddingLeft: "1rem" }}>
            {["La-Red-Flag.png","El-Karma.png","La-Verdad.png","El-Destino.png","El-Ego.png","La-Mala-Idea.png","La-Venganza-Cosmica.png"].map((card, idx) => (
              <FadeUp key={card} delay={idx * 0.07}>
                <button
                  type="button"
                  aria-label={`Ampliar carta ${card.replace(".png","").replaceAll("-"," ")}`}
                  onClick={() => setLightbox(`/zodi-art/nuevas/8-Tarot-ZODI/${card}`)}
                  className="group relative block w-40 sm:w-52 shrink-0 snap-center overflow-hidden rounded-2xl glass-panel p-2 transition hover:border-lime-300/50 active:scale-95"
                >
                  <Image
                    src={`/zodi-art/nuevas/8-Tarot-ZODI/${card}`}
                    alt={`Carta Tarot ZODI ${card}`}
                    width={300}
                    height={500}
                    className="h-auto w-full rounded-xl object-contain transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="mt-2 pb-1 text-center">
                    <p className="text-[11px] font-black text-white/50 truncate">{card.replace(".png","").replaceAll("-"," ")}</p>
                  </div>
                </button>
              </FadeUp>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-white/30 sm:hidden">← Desliza para ver más →</p>
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-6 py-3.5 text-sm font-black text-violet-200 transition hover:bg-violet-500/20 active:scale-95"
          >
            <Sparkles className="h-4 w-4" /> Hacer mi tirada gratis
          </Link>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          AVATARES ZODIACALES — carrusel horizontal
      ══════════════════════════════════════════════════════════════ */}
      <Section id="signos" kicker="Tu identidad astral" title="12 avatares, uno para cada signo. El tuyo está aquí.">
        <div className="relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050507] to-transparent z-10" />
          <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-4">
            {["Avatar_Aries.png","Avatar_Tauro.png","Avatar_Geminis.png","Avatar_Cancer.png","Avatar_Leo.png","Avatar_Virgo.png","Avatar_Libra.png","Avatar_Escorpio.png","Avatar_Sagitario.png","Avatar_Capricornio.png","Avatar_Acuario.png","Avatar_Piscis.png"].map((avatar, idx) => {
              const signo = avatar.replace("Avatar_","").replace(".png","");
              return (
                <FadeUp key={avatar} delay={idx * 0.04}>
                  <button
                    type="button"
                    aria-label={`Avatar ${signo}`}
                    onClick={() => setLightbox(`/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${avatar}`)}
                    className="group flex w-28 sm:w-36 shrink-0 snap-center flex-col items-center gap-2 rounded-2xl glass-panel p-2.5 transition hover:border-lime-300/40 active:scale-95"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-full">
                      <Image
                        src={`/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${avatar}`}
                        alt={`Avatar ${signo}`}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                    </div>
                    <p className="text-[11px] font-black text-white/60">{signo}</p>
                  </button>
                </FadeUp>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-white/30 sm:hidden">← Desliza para ver todos →</p>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          TODAS LAS LECTURAS — grid módulos
      ══════════════════════════════════════════════════════════════ */}
      <Section id="lecturas" kicker="Lecturas" title="Todo lo que puedes consultar. 17 tipos de lectura.">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {readings.map((module, index) => (
            <FadeUp key={module.title} delay={Math.min(index * 0.04, 0.32)}>
              <motion.article
                whileHover={{ y: -5 }}
                className="glass-panel group flex items-start gap-3 rounded-xl p-4 h-full transition"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${module.accent}`}>
                  <module.icon className="h-5 w-5 text-black/80" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm leading-tight">{module.title}</h3>
                  <p className="mt-1 text-[12px] leading-5 text-white/55 line-clamp-2">{module.description}</p>
                </div>
              </motion.article>
            </FadeUp>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-2xl bg-lime-300 px-8 py-4 text-base font-black text-black shadow-[0_0_24px_rgba(184,255,23,0.25)] transition hover:bg-lime-200 active:scale-95">
            Probar todas gratis <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          DEMO READING — valor antes del registro
      ══════════════════════════════════════════════════════════════ */}
      <DemoReadingSection />

      {/* ══════════════════════════════════════════════════════════════
          CÓMO FUNCIONA — 6 pasos
      ══════════════════════════════════════════════════════════════ */}
      <Section id="como-funciona" kicker="Cómo funciona" title="En seis pasos. No hace falta conocer el ascendente de Mercurio.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.08}>
              <motion.div whileHover={{ y: -5 }} className="glass-panel relative overflow-hidden rounded-2xl p-5 h-full flex gap-4">
                <span className="shrink-0 text-4xl font-black text-lime-300/20 leading-none mt-0.5">{step.n}</span>
                <div>
                  <h3 className="font-black text-base text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{step.body}</p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          3 FEATURES CON PERSONAJES
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-14">
        <div className="absolute inset-0 bg-[url('/zodi-art/oracle-frame-tall.webp')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/70">Lecturas con carácter</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">La verdad que ZODI te dice no viene suavizada.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { img: "/zodi-art/nuevas/2-Portada--Home/ZODI-con-cartas-flotando.webp", title: "Tarot vivo", body: "Cartas, energía y respuestas directas. A veces abraza. A veces te mira fijo hasta que entiendes.", cta: "Tirar cartas" },
              { img: "/zodi-art/nuevas/2-Portada--Home/ZODI-con-energia-en-la-mano.webp", title: "Rituales diarios", body: "Misiones pequeñas, rachas y recordatorios para ordenar la energía sin convertir tu agenda en un monasterio.", cta: "Mis rituales" },
              { img: "/zodi-art/nuevas/2-Portada--Home/ZODI-riendose-con-sarcasmo.webp", title: "Humor ácido", body: "Lecturas con carácter y frases para compartir. Sinceridad que duele poquito pero ilumina bastante.", cta: "Roast horóscopo" },
            ].map((card, i) => (
              <FadeUp key={card.title} delay={i * 0.1}>
                <motion.article whileHover={{ y: -8 }} className="glass-panel group overflow-hidden rounded-2xl h-full flex flex-col">
                  <div className="relative overflow-hidden bg-black/40">
                    <Image
                      src={card.img}
                      alt={card.title}
                      width={560}
                      height={680}
                      className="h-64 w-full object-contain transition duration-500 group-hover:scale-105 sm:h-72"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-xl font-black">{card.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-white/65">{card.body}</p>
                    <Link href="/auth/register" className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-lime-300 transition hover:text-lime-200">
                      {card.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          COMUNIDAD
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-14 sm:py-20">
        <div className="absolute inset-0 bg-[url('/zodi-art/hoodie-phone-wide.webp')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,7,.96)_0%,rgba(5,5,7,.7)_60%,rgba(5,5,7,.5)_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/70">Magia social</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">Tu futuro, sin filtro.<br />Tu comunidad, sin postureo.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/65 sm:text-lg">Comparte lecturas, reacciona, sube de rango y mira lo que están viviendo otros signos. Confesionario cósmico con mejor estética y menos gente diciendo "todo pasa por algo".</p>
            <Link href="/auth/register" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-lime-300 px-6 py-4 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95 sm:text-base">
              Unirme a la comunidad <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PLANES — mejorados
      ══════════════════════════════════════════════════════════════ */}
      <Section id="premium" kicker="Planes" title="Empieza gratis. Profundiza cuando quieras.">
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const isHighlighted = i === 1;
            return (
              <motion.article
                key={plan.name}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col rounded-2xl p-5 sm:p-6 transition ${
                  isHighlighted
                    ? "border-2 border-lime-300/50 bg-gradient-to-b from-lime-300/08 to-transparent shadow-[0_0_40px_rgba(184,255,23,0.15)]"
                    : "glass-panel"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-lime-300 px-4 py-1 text-[11px] font-black text-black uppercase tracking-wider shadow-[0_0_12px_rgba(184,255,23,0.4)]">
                      Más popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-black mt-2">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-white/55">{plan.signal}</p>
                <p className="mt-4 text-4xl font-black text-lime-300">{plan.price}</p>
                <div className="mt-5 flex-1 space-y-3">
                  {plan.perks.map((perk) => (
                    <div key={perk} className="flex items-start gap-2.5 text-sm text-white/75">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-lime-300" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/register"
                  className={`mt-6 flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition active:scale-95 ${
                    isHighlighted
                      ? "bg-lime-300 text-black hover:bg-lime-200 shadow-[0_0_20px_rgba(184,255,23,0.25)]"
                      : "border border-white/15 text-white/80 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {isHighlighted ? "Empezar ahora" : "Elegir este plan"}
                  {isHighlighted && <ArrowRight className="h-4 w-4" />}
                </Link>
              </motion.article>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-white/35">Sin permanencia. Cancela cuando quieras.</p>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIOS
      ══════════════════════════════════════════════════════════════ */}
      <Section id="testimonios" kicker="Lo que dicen" title="Gente real. Señales reales.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.05}>
              <div className="glass-panel rounded-2xl p-5 flex flex-col gap-3 h-full border border-white/07 hover:border-lime-300/20 transition">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-lime-300 text-lime-300" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-white/78 flex-1">"{t.text}"</p>
                <div className="flex items-center gap-2.5 pt-1 border-t border-white/06">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-black text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight">{t.name}</p>
                    <p className="text-[10px] text-white/40">{t.sign} · {t.location}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          EMBAJADORES / REFERIDOS
      ══════════════════════════════════════════════════════════════ */}
      <section id="referidos" className="px-4 py-10 sm:py-14">
        <FadeUp>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-950/60 via-black/80 to-fuchsia-950/40 p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(167,139,250,0.12)_0%,transparent_70%)]" />
            <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-violet-300/70 mb-3">Programa de embajadores</p>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
                  Gana <span className="text-lime-300">100 gemas</span> por cada amigo que se una a ZODI
                </h2>
                <p className="text-white/55 text-sm leading-7 max-w-md">
                  Comparte tu código personal. Cuando alguien se registra con él, tú recibes 100 gemas y ellos 50. Sin límite de referidos.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/55">
                  <span className="flex items-center gap-1.5"><span className="text-lime-300">✓</span> Tú ganas 100 gemas</span>
                  <span className="flex items-center gap-1.5"><span className="text-lime-300">✓</span> Tu amigo recibe 50</span>
                  <span className="flex items-center gap-1.5"><span className="text-lime-300">✓</span> Sin límite de referidos</span>
                </div>
              </div>
              <Link
                href="/auth/register"
                className="shrink-0 rounded-2xl bg-lime-300 px-6 py-3.5 text-sm font-black text-black shadow-[0_0_20px_rgba(184,255,23,0.25)] transition hover:bg-lime-200 active:scale-95 whitespace-nowrap"
              >
                Ver mi código →
              </Link>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ — acordeón animado
      ══════════════════════════════════════════════════════════════ */}
      <Section id="faq" kicker="FAQ" title="Preguntas antes de darle tus datos al cosmos.">
        <div className="grid gap-2 md:grid-cols-2">
          {faqData.map(([q, a]) => (
            <FaqItem key={q} question={q} answer={a} />
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════════════
          CTA FINAL — móvil y escritorio
      ══════════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-8 sm:pb-16">
        <FadeUp>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-lime-300/20 bg-gradient-to-br from-lime-950/60 via-black/80 to-violet-950/50 p-8 sm:p-12 text-center">
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(184,255,23,0.12)_0%,transparent_65%)]" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-300/70 mb-3">Tu oráculo te espera</p>
              <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-4">Empieza a consultar gratis.<br className="hidden sm:block" /> Sin excusas, sin tarjeta.</h2>
              <p className="text-base text-white/55 max-w-md mx-auto mb-8">Crea tu perfil astral en menos de 2 minutos. ZODI te leerá con más precisión cuanto más lo uses.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/register" className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-lime-300 px-8 py-4 text-base font-black text-black shadow-[0_0_30px_rgba(184,255,23,0.3)] transition hover:bg-lime-200 active:scale-95">
                  Crear cuenta gratis <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/auth/login" className="flex w-full sm:w-auto items-center justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-bold text-white/65 transition hover:border-white/30 hover:text-white active:scale-95">
                  Ya tengo cuenta →
                </Link>
              </div>
              <p className="mt-5 text-[11px] text-white/30">✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Sin permanencia &nbsp;·&nbsp; ✓ App móvil gratis</p>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/08 px-4 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href="/">
              <Image src="/zodi-logo.png" alt="ZODI" width={420} height={280} className="h-auto w-48 max-w-full drop-shadow-[0_0_15px_rgba(184,255,23,0.3)] mix-blend-screen" />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
              Un espacio místico, visual y social para consultar señales, guardar lecturas y reírte un poco de tus patrones. Con cariño. Con neón. Sin paz falsa.
            </p>
            {/* App badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/05 px-3 py-2">
              <Download className="h-4 w-4 text-lime-300" />
              <span className="text-xs font-bold text-lime-200/70">Disponible como App (PWA)</span>
            </div>
          </div>
          <FooterColumn title="Explorar" links={[["Lecturas", "#lecturas"], ["Cómo funciona", "#como-funciona"], ["Planes", "#premium"], ["Referidos", "#referidos"], ["Preguntas", "#faq"]]} />
          <FooterColumn title="Cuenta" links={[["Crear cuenta", "/auth/register"], ["Entrar", "/auth/login"], ["Privacidad", "/legal/privacidad"], ["Términos", "/legal/terminos"]]} />
          <FooterColumn title="Horóscopo diario" links={[["Aries", "/horoscopo-diario/aries"], ["Tauro", "/horoscopo-diario/tauro"], ["Géminis", "/horoscopo-diario/geminis"], ["Leo", "/horoscopo-diario/leo"], ["Escorpio", "/horoscopo-diario/escorpio"], ["Piscis", "/horoscopo-diario/piscis"]]} />
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/08 pt-6 text-xs text-white/35 sm:flex-row">
          <p>© 2026 ZODI — Tu futuro, sin filtro.</p>
          <p className="max-w-xl text-center sm:text-right">Las lecturas son contenido de entretenimiento y guía simbólica. No constituyen asesoramiento médico, legal, financiero ni psicológico. Para decisiones importantes, consulta a un profesional.</p>
        </div>
      </footer>
    </>
  );
}

// ── Demo Reading — lectura sin registro ──────────────────────────────────────
function DemoReadingSection() {
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sign: string; reading: string } | null>(null);
  const [error, setError] = useState("");

  async function getDemo() {
    if (!birthDate) { setError("Introduce tu fecha de nacimiento."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthDate }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al obtener tu lectura."); return; }
      setResult(data);
    } catch {
      setError("Sin conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="demo" className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <FadeUp>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/65">Pruébalo ahora</p>
          <h2 className="mt-3 mb-2 text-3xl font-black sm:text-4xl">Mira lo que ZODI sabe de ti</h2>
          <p className="mb-8 text-base text-white/50">Solo con tu fecha de nacimiento. Sin registro. Sin tarjeta. Una muestra de lo que te espera.</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/08">
            <div className="flex gap-3">
              <input
                type="date"
                value={birthDate}
                onChange={e => { setBirthDate(e.target.value); setError(""); }}
                max={new Date().toISOString().split("T")[0]}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-lime-300/50 transition [color-scheme:dark]"
              />
              <button
                onClick={getDemo}
                disabled={loading}
                className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "..." : "Ver mi lectura"}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-orange-400">{error}</p>}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-300">
                      ☀️ {result.sign}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">Tu lectura demo</span>
                  </div>
                  <p className="text-base leading-[1.85] text-white/88 rounded-xl border border-lime-300/20 bg-black/40 p-4">
                    {result.reading}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href="/auth/register"
                      className="flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 text-sm font-black text-black hover:bg-lime-200 transition active:scale-95"
                    >
                      Lectura completa gratis <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="text-xs text-white/35">Sin tarjeta · En 2 minutos</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Scroll fade-up ──────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/65">{kicker}</p>
          <h2 className="mt-3 mb-8 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
        </FadeUp>
        {children}
      </div>
    </section>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-black text-lime-100 text-sm">{title}</h3>
      <div className="mt-4 flex flex-col gap-3 text-sm text-white/55">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className="transition hover:text-lime-200">{label}</Link>
        ))}
      </div>
    </div>
  );
}
