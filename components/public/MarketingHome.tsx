"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronRight, Download, Sparkles, X, ZoomIn, Zap } from "lucide-react";
import { featureModules, plans } from "@/lib/data";

const readingTitles = [
  "Horóscopo diario",
  "Horóscopo semanal",
  "Horóscopo mensual",
  "Carta natal",
  "Lectura de tarot",
  "Tirada celta",
  "Compatibilidad",
  "Interpretación de sueños",
  "Numerología",
  "Tránsitos astrológicos",
  "Lectura de nombre",
  "Horóscopo chino",
  "Horóscopo maya",
  "Runas vikingas",
  "Lecturas de cristales",
  "Horóscopo roast",
  "Predicciones personalizadas"
];

const mainConsultas = [
  {
    title: "Horóscopo personal",
    body: "Abre el día con una lectura clara sobre amor, dinero, trabajo y energía. Sin sermones celestiales: señales útiles, humor ácido y una recomendación que puedas aplicar hoy.",
    image: "/zodi-art/sections/horoscopo-diario.png",
    action: "Ver horóscopos",
    href: "/auth/register",
    fit: "contain"
  },
  {
    title: "Tarot y tiradas",
    body: "Haz una pregunta, elige el tono y deja que ZODI traduzca el caos: situación, bloqueo, consejo y esa verdad incómoda que probablemente ya sabías.",
    image: "/zodi-art/sections/tarot-acido.png",
    action: "Consultar tarot",
    href: "/auth/register",
    fit: "contain"
  },
  {
    title: "Horóscopo chino",
    body: "Mira tu animal, elemento, ciclos y compatibilidades con una lectura visual amplia. Ideal para entender ritmos largos y no llamar \"destino\" a una mala costumbre.",
    image: "/zodi-art/sections/horoscopo-chino.png",
    action: "Descubrir mi ciclo",
    href: "/auth/register",
    fit: "contain"
  },
  {
    title: "Numerología",
    body: "Calcula camino de vida, vibración del nombre y fechas clave. Los números no te van a salvar la vida, pero sí pueden delatar patrones con una precisión molesta.",
    image: "/zodi-art/sections/numerologia.png",
    action: "Calcular números",
    href: "/auth/register",
    fit: "contain"
  }
];

const steps = [
  {
    title: "Crea tu cuenta",
    body: "Entras gratis y guardas tu espacio. Nada de ritual eterno de registro: lo justo para que ZODI recuerde tus lecturas."
  },
  {
    title: "Completa tu perfil astral",
    body: "Fecha, hora y lugar de nacimiento. Con eso armamos tu base: signo solar, luna, ascendente, numerología y ciclos."
  },
  {
    title: "Elige qué quieres consultar",
    body: "Horóscopo, tarot, sueños, compatibilidad, runas, nombre, carta natal o una pregunta directa cuando el caos no trae manual."
  },
  {
    title: "Recibe una lectura clara",
    body: "Puedes pedir tono suave, directo, brutal o sarcástico. ZODI se adapta, pero no se vuelve tibio."
  },
  {
    title: "Guarda lo importante",
    body: "Favoritos, historial y lecturas guardadas para volver cuando el universo diga: \"te lo advertí, cariño\"."
  },
  {
    title: "Sube de nivel",
    body: "Rachas, logros, puntos y comunidad. Porque abrir tu oráculo también puede sentirse como desbloquear una misión."
  }
];

const faq = [
  [
    "¿ZODI es gratis?",
    "Sí. Puedes entrar gratis, completar tu perfil y consultar lecturas básicas. La idea es que pruebes si ZODI te habla claro antes de sacar la tarjeta. El universo será misterioso, pero el precio no tiene por qué serlo."
  ],
  [
    "¿Tengo que saber astrología para usarlo?",
    "No. ZODI está pensado para gente normal con preguntas normales y niveles variables de caos. Te explicamos cada lectura con palabras simples: qué significa, cómo te afecta y qué puedes hacer con eso."
  ],
  [
    "¿Por qué me piden fecha, hora y lugar de nacimiento?",
    "Porque esos datos ayudan a crear tu perfil astral. Sin eso solo tendríamos un horóscopo genérico de revista esperando en una sala triste. Con tu información, las lecturas se sienten más tuyas."
  ],
  [
    "¿El onboarding es obligatorio?",
    "Sí. Es la puerta de entrada. Dura poco y evita que el panel te muestre cosas al azar. ZODI necesita conocerte un mínimo antes de empezar a opinar sobre tu vida con tanta seguridad estética."
  ],
  [
    "¿Puedo guardar lecturas?",
    "Sí. Puedes guardar lecturas, marcar favoritas y revisar tu historial. Muy útil para cuando digas \"esto no tiene nada que ver conmigo\" y dos semanas después estés viviendo exactamente eso."
  ],
  [
    "¿Hay comunidad?",
    "Sí. Puedes compartir experiencias, reaccionar, comentar y ver publicaciones por signo. La vibra es confesionario astral con energía de chat nocturno: divertido, anónimo y con cero necesidad de fingir iluminación."
  ],
  [
    "¿Puedo usarlo desde el móvil?",
    "Sí. Está pensado primero para móvil: navegación inferior, botones grandes, paneles claros y una experiencia que se siente como app. Lo abres, consultas, guardas y sigues con tu vida dramáticamente mejor organizada."
  ],
  [
    "¿Las lecturas son destino absoluto?",
    "No. Son una guía simbólica, emocional y práctica. Si una lectura te ayuda a ver algo con más claridad, perfecto. Si te dice que escribas a alguien a las 2 AM, sospecha: quizá eso eras tú, no el cosmos."
  ]
];

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
          <img
            src={src}
            alt="Vista ampliada"
            className="max-h-[88vh] max-w-full rounded-md object-contain shadow-2xl"
          />
          <button
            onClick={onClose}
            className="absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/25"
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
      {/* Lightbox global */}
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-68px)] overflow-hidden px-4 py-10 sm:py-16">
        {/* Video — only on sm+ screens to avoid GPU overload on mobile */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/zodi-art/poster-chaos.png"
          className="absolute inset-0 hidden h-full w-full object-cover opacity-80 sm:block"
          style={{ transform: "translateZ(0)" }}
          aria-hidden="true"
        >
          <source src="/zodi-art/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Mobile: CSS animated background (no video = no GPU fight) */}
        <div className="absolute inset-0 sm:hidden" aria-hidden="true">
          {/* Dark base */}
          <div className="absolute inset-0 bg-[#060608]" />
          {/* Animated orb 1 — acid lime */}
          <div style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(184,255,23,0.22) 0%, transparent 70%)",
            top: "-60px",
            right: "-60px",
            animation: "hero-orb-1 8s ease-in-out infinite",
            willChange: "transform",
          }} />
          {/* Animated orb 2 — violet */}
          <div style={{
            position: "absolute",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(155,77,255,0.28) 0%, transparent 70%)",
            bottom: "10%",
            left: "-40px",
            animation: "hero-orb-2 11s ease-in-out infinite",
            willChange: "transform",
          }} />
          {/* Animated orb 3 — hot pink */}
          <div style={{
            position: "absolute",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,43,214,0.18) 0%, transparent 70%)",
            top: "40%",
            right: "5%",
            animation: "hero-orb-3 9s ease-in-out infinite",
            willChange: "transform",
          }} />
          {/* Subtle grid lines */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(184,255,23,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(184,255,23,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            animation: "hero-grid 20s linear infinite",
            willChange: "background-position",
          }} />
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: i % 2 === 0 ? "3px" : "2px",
              height: i % 2 === 0 ? "3px" : "2px",
              borderRadius: "50%",
              background: i % 3 === 0 ? "#b8ff17" : i % 3 === 1 ? "#9b4dff" : "#ff2bd6",
              left: `${10 + i * 15}%`,
              top: `${20 + (i * 13) % 60}%`,
              boxShadow: i % 3 === 0 ? "0 0 6px #b8ff17" : i % 3 === 1 ? "0 0 6px #9b4dff" : "0 0 6px #ff2bd6",
              animation: `hero-particle-${i % 3} ${5 + i}s ease-in-out infinite`,
              willChange: "transform, opacity",
            }} />
          ))}
        </div>
        {/* Gradient overlay for mobile (keeps text readable over the animation) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(5,5,7,0.10)] via-[rgba(5,5,7,0.40)] to-[rgba(5,5,7,0.92)] sm:hidden" />
        {/* Gradient overlay for desktop (over video) */}
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(5,5,7,.88),rgba(5,5,7,.42),rgba(5,5,7,.78))] sm:block" />

        <div className="relative mx-auto grid min-h-[74vh] max-w-7xl items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h1 className="glitch max-w-4xl text-5xl font-black leading-none sm:text-7xl lg:text-8xl">
              Zodi te lee el futuro y te juzga el presente.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              Horóscopo, tarot, numerología, carta natal y comunidad en un solo lugar oscuro y brillante. Crea tu perfil astral gratis, elige qué quieres consultar y recibe lecturas con personalidad: directas, místicas y con el humor exacto para no convertirte en víctima del universo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register" className="flex items-center gap-2 rounded-md bg-lime-300 px-5 py-4 font-black text-black shadow-[0_0_28px_rgba(184,255,23,.35)]">
                Empezar gratis <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#consultas" className="rounded-md border border-purple-300/40 bg-purple-500/10 px-5 py-4 font-bold text-purple-100">
                Explorar lecturas
              </a>
            </div>
          </div>

          {/* Imagen oráculo — en móvil se muestra compacta, en desktop la versión grande */}
          <motion.div
            initial={{ opacity: 0, rotate: -3, y: 24 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            className="glass-panel neon-border rounded-md p-3 sm:p-5 lg:block"
          >
            <button
              onClick={() => setLightbox("/zodi-art/home/hero-main.png")}
              className="group relative block w-full overflow-hidden rounded-md"
              aria-label="Ver imagen completa"
            >
              <Image
                src="/zodi-art/home/hero-main.png"
                alt="Oráculo cyberpunk de ZODI"
                width={520}
                height={520}
                className="h-auto w-full rounded-md opacity-95 transition duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 transition group-hover:bg-black/30">
                <ZoomIn className="h-10 w-10 text-white opacity-0 drop-shadow-lg transition group-hover:opacity-100" />
              </div>
            </button>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-white/68">
              <span className="rounded-md border border-lime-300/20 p-3">Tarot vivo</span>
              <span className="rounded-md border border-fuchsia-300/20 p-3">Rachas</span>
              <span className="rounded-md border border-cyan-300/20 p-3">Modo móvil</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BANNER ZODI CHARACTER ────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-0">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-0 sm:grid-cols-2">
            {/* Personaje completo */}
            <button
              onClick={() => setLightbox("/zodi-art/zodi-us-full.png")}
              className="group relative block overflow-hidden"
              aria-label="Ver personaje ZODI"
            >
              <Image
                src="/zodi-art/zodi-us-full.png"
                alt="Personaje ZODI completo"
                width={700}
                height={1200}
                className="h-[420px] w-full object-cover object-top transition duration-500 group-hover:scale-105 sm:h-[540px]"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4">
                <div className="sm:hidden flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white/70 backdrop-blur-sm">
                  <ZoomIn className="h-3 w-3" /> Ampliar
                </div>
              </div>
            </button>
            {/* Branding logo */}
            <button
              onClick={() => setLightbox("/zodi-art/zodi-logo-branding.png")}
              className="group relative block overflow-hidden"
              aria-label="Ver branding ZODI"
            >
              <Image
                src="/zodi-art/zodi-logo-branding.png"
                alt="ZODI - Horóscopos. Humor Ácido. Destino con Sarcasmo."
                width={700}
                height={700}
                className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-105 sm:h-[540px]"
              />
              <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4">
                <div className="sm:hidden flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white/70 backdrop-blur-sm">
                  <ZoomIn className="h-3 w-3" /> Ampliar
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── CONSULTAS ────────────────────────────────────────────────── */}
      <Section id="consultas" kicker="Empieza por aquí" title="Elige qué quieres consultar hoy.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {mainConsultas.map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -8 }}
              className="glass-panel group flex min-h-full flex-col overflow-hidden rounded-md"
            >
              {/* Imagen — toca para ampliar */}
              <button
                onClick={() => setLightbox(item.image)}
                className="relative block overflow-hidden"
                aria-label={`Ver ${item.title} en grande`}
              >
                <div className={`relative ${item.fit === "contain" ? "h-80 bg-black/70 p-4" : "h-64"}`}>
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={800}
                    height={900}
                    className={`h-full w-full transition duration-700 group-hover:scale-105 ${item.fit === "contain" ? "object-contain bg-black/40" : "object-cover"}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {/* Ícono de zoom sobre la imagen */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/30">
                    <ZoomIn className="h-9 w-9 text-white opacity-0 drop-shadow-lg transition duration-300 group-hover:opacity-100" />
                  </div>
                  {/* Hint en móvil (siempre visible, pequeño) */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white/70 backdrop-blur-sm sm:hidden">
                    <ZoomIn className="h-3 w-3" /> Ampliar
                  </div>
                </div>
              </button>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-2xl font-black">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-white/68">{item.body}</p>
                <Link href={item.href} className="mt-5 inline-flex w-fit items-center gap-2 rounded-md bg-lime-300 px-3 py-2 text-sm font-black text-black">
                  {item.action} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── QUÉ ES ───────────────────────────────────────────────────── */}
      <Section id="que-es" kicker="Qué es ZODI" title="Un oráculo moderno para consultar sin tener que hablar en modo gurú.">
        <div className="grid gap-4 lg:grid-cols-5">
          {[
            ["Astrología personal", "Lecturas diarias, semanales y mensuales hechas alrededor de tu perfil, no de un texto genérico que podría servirle a tu vecino."],
            ["Tarot directo", "Tiradas rápidas, tirada celta y mensajes claros para cuando necesitas una respuesta y no otra nube de incienso verbal."],
            ["Oráculo conversacional", "Preguntas, escribes lo que te pasa y recibes una lectura con tono humano: suave, directo, brutal o sarcástico."],
            ["Comunidad espiritual", "Publicaciones anónimas, reacciones, comentarios y señales compartidas por signos. Como terapia grupal, pero más neón."],
            ["Progreso y rituales", "Rachas, logros, favoritos y puntos para que volver cada día se sienta útil, divertido y un poco adictivo."]
          ].map(([title, body]) => (
            <motion.div key={title} whileHover={{ y: -6 }} className="glass-panel rounded-md p-5">
              <Sparkles className="mb-5 h-6 w-6 text-lime-300" />
              <h3 className="text-lg font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/66">{body}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── LECTURAS ─────────────────────────────────────────────────── */}
      <Section id="lecturas" kicker="Lecturas" title="Todo lo que puedes consultar, ordenado para no perderte.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {readings.map((module, index) => (
            <motion.article
              key={module.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.02, 0.18) }}
              whileHover={{ y: -6, scale: 1.01 }}
              className="glass-panel group rounded-md p-4"
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-md bg-gradient-to-br ${module.accent} text-black`}>
                <module.icon className="h-5 w-5" />
              </div>
              <h3 className="font-black">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/62">{module.description}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* ── NUMEROLOGÍA SARCÁSTICA ──────────────────────────────────────── */}
      <Section id="numerologia" kicker="Numerología" title="Porque los astros no eran suficientes para juzgarte.">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <p className="text-lg leading-8 text-white/70">
              ¿Qué es la numerología? Es el arte milenario de sumar tu fecha de nacimiento hasta que quede un solo dígito y luego culpar a ese número de por qué no sabes ahorrar o por qué siempre te enamoras de la misma *red flag*.
            </p>
            <p className="mt-4 text-lg leading-8 text-white/70">
              En ZODI calculamos tu camino de vida, tu año personal y la vibración de tu nombre. No, no te va a solucionar la vida ni a pagar el alquiler, pero te dará una excusa matemáticamente precisa para justificar tus peores hábitos. Los números no mienten, pero tú definitivamente sí te mientes a ti mismo.
            </p>
          </div>
          <button
            onClick={() => setLightbox("/zodi-art/numerologia/imagen-general-numerologia.png")}
            className="group relative block w-full overflow-hidden rounded-2xl glass-panel p-2"
            aria-label="Ver numerología en grande"
          >
            <Image
              src="/zodi-art/numerologia/imagen-general-numerologia.png"
              alt="Numerología ZODI"
              width={800}
              height={600}
              className="h-auto w-full object-contain transition duration-500 group-hover:scale-105 bg-black/40 rounded-xl"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition duration-300 group-hover:bg-black/30">
              <ZoomIn className="h-10 w-10 text-white opacity-0 drop-shadow-lg transition group-hover:opacity-100" />
            </div>
          </button>
        </div>
      </Section>

      {/* ── FEATURE CARDS (3 imágenes) ───────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-14">
        {/* Fondo más visible: mayor opacidad en móvil, overlay más suave */}
        <div className="absolute inset-0 bg-[url('/zodi-art/oracle-frame-tall.png')] bg-cover bg-center opacity-40 sm:opacity-25" />
        <div className="absolute inset-0 bg-black/55 sm:bg-black/68" />
        <div className="relative mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {[
            { img: "/zodi-art/home/zodi-cartas.png", title: "La verdad no viene suave", body: "Tarot visual con cartas, energía y respuestas directas. A veces abraza. A veces te mira fijo hasta que entiendes." },
            { img: "/zodi-art/home/zodi-energia.png", title: "Rituales de todos los días", body: "Pequeñas misiones, rachas y recordatorios para ordenar la energía sin convertir tu agenda en un monasterio." },
            { img: "/zodi-art/home/zodi-sarcasmo.png", title: "Humor ácido astrológico", body: "Lecturas con carácter, frases para compartir y esa dosis de sinceridad que duele poquito, pero ilumina bastante." }
          ].map((card) => (
            <motion.article key={card.title} whileHover={{ y: -8 }} className="glass-panel group overflow-hidden rounded-md">
              {/* Imagen clicable */}
              <button
                onClick={() => setLightbox(card.img)}
                className="relative block w-full overflow-hidden"
                aria-label={`Ver ${card.title} en grande`}
              >
                <Image
                  src={card.img}
                  alt={card.title}
                  width={600}
                  height={720}
                  className="h-72 w-full object-contain bg-black/40 transition duration-500 group-hover:scale-105 sm:h-80"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/30">
                  <ZoomIn className="h-9 w-9 text-white opacity-0 drop-shadow-lg transition duration-300 group-hover:opacity-100" />
                </div>
                {/* Hint móvil */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white/70 backdrop-blur-sm sm:hidden">
                  <ZoomIn className="h-3 w-3" /> Ampliar
                </div>
              </button>
              <div className="p-5">
                <h3 className="text-2xl font-black">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/66">{card.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────────── */}
      <Section id="como-funciona" kicker="Cómo funciona" title="Se entiende en seis pasos. Prometido: no hace falta mercurio avanzado.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <motion.article key={step.title} whileHover={{ y: -6 }} className="glass-panel relative overflow-hidden rounded-md p-5">
              <span className="absolute right-4 top-3 text-6xl font-black text-lime-300/10">
                0{index + 1}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-md bg-lime-300 font-black text-black">0{index + 1}</span>
              <h3 className="mt-5 text-xl font-black">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/66">{step.body}</p>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* ── PREVIEW PANEL ────────────────────────────────────────────── */}
      <Section id="preview" kicker="Vista del panel" title="Tu espacio privado muestra primero lo que de verdad vas a usar.">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel overflow-hidden rounded-md p-4">
            <button
              onClick={() => setLightbox("/zodi-art/ritual-wide.png")}
              className="group relative block w-full overflow-hidden rounded-md"
              aria-label="Ver panel en grande"
            >
              <Image
                src="/zodi-art/ritual-wide.png"
                alt="Vista mágica de ZODI"
                width={1100}
                height={700}
                className="w-full rounded-md border border-lime-300/20 object-cover magic-pulse transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/0 transition duration-300 group-hover:bg-black/30">
                <ZoomIn className="h-10 w-10 text-white opacity-0 drop-shadow-lg transition duration-300 group-hover:opacity-100" />
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white/70 backdrop-blur-sm sm:hidden">
                <ZoomIn className="h-3 w-3" /> Ampliar
              </div>
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Lectura del día", "Una mirada rápida para entrar al día con menos ruido mental."],
              ["Tarot rápido", "Pregunta, elige tono y recibe una respuesta directa."],
              ["Carta natal", "Tu base astral sin convertirla en tesis universitaria."],
              ["Progreso espiritual", "Rachas, puntos, logros y pequeñas misiones."],
              ["Compatibilidad", "Química, ritmo y señales rojas con menos autoengaño."],
              ["Comunidad", "Publica, reacciona y mira qué está viviendo tu signo."]
            ].map(([title, body]) => (
              <motion.div key={title} whileHover={{ y: -5 }} className="glass-panel rounded-md p-4">
                <Zap className="mb-4 h-5 w-5 text-lime-300" />
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── COMUNIDAD ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-14">
        {/* Imagen fondo más visible en móvil */}
        <div className="absolute inset-0 bg-[url('/zodi-art/hoodie-phone-wide.png')] bg-cover bg-center opacity-65 sm:opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(5,5,7,0.92)] via-[rgba(5,5,7,0.70)] to-[rgba(5,5,7,0.50)] sm:bg-[linear-gradient(90deg,rgba(5,5,7,.94),rgba(5,5,7,.72))]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/70">Magia social</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Tu futuro, sin filtro. Tu comunidad, sin postureo.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/68">Comparte lecturas, reacciona, sube de rango y mira lo que están viviendo otros signos. Es como entrar a una sala llena de confesiones cósmicas, pero con mejor estética y menos gente diciendo "todo pasa por algo" cada cinco minutos.</p>
        </div>
      </section>

      {/* ── PLANES ───────────────────────────────────────────────────── */}
      <Section id="premium" kicker="Planes" title="Puedes empezar gratis. Si quieres ir más profundo, ahí entra el modo premium.">
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.article key={plan.name} whileHover={{ y: -8 }} className={`glass-panel rounded-md p-5 ${index === 1 ? "border-lime-300/45 shadow-[0_0_32px_rgba(184,255,23,0.16)]" : ""}`}>
              <h3 className="text-2xl font-black">{plan.name}</h3>
              <p className="mt-2 text-white/60">{plan.signal}</p>
              <p className="mt-4 text-4xl font-black graffiti">{plan.price}</p>
              <div className="mt-5 space-y-3">
                {plan.perks.map((perk) => (
                  <p key={perk} className="flex items-center gap-2 text-sm text-white/74"><Check className="h-4 w-4 text-lime-300" /> {perk}</p>
                ))}
              </div>
              <Link href="/auth/register" className="mt-6 inline-flex rounded-md bg-lime-300 px-4 py-3 font-black text-black">
                Elegir plan
              </Link>
            </motion.article>
          ))}
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <Section id="faq" kicker="FAQ" title="Preguntas antes de darle tus datos al cosmos.">
        <div className="grid gap-3 md:grid-cols-2">
          {faq.map(([question, answer]) => (
            <details key={question} className="glass-panel rounded-md p-4">
              <summary className="cursor-pointer font-black text-lime-100">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-white/66">{answer}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* ── CTA MÓVIL ────────────────────────────────────────────────── */}
      <section className="px-4 pb-12">
        <div className="glass-panel mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 rounded-md p-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-lime-200/70"><Download className="mr-2 inline h-4 w-4" /> Llévalo en el móvil</p>
            <h2 className="mt-2 text-3xl font-black">Tu oráculo privado puede vivir en tu pantalla de inicio.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">Sin complicarte: entras, lo guardas como app y tienes tus lecturas a mano cuando la vida haga otra de sus actuaciones innecesarias.</p>
          </div>
          <Link href="/auth/register" className="rounded-md bg-lime-300 px-5 py-4 font-black text-black">Crear cuenta gratis</Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Image src="/zodi-logo-mark.png" alt="Logo de ZODI" width={130} height={60} className="h-auto w-32" />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/62">
              ZODI es un espacio místico, visual y social para consultar señales, guardar lecturas y reírte un poco de tus patrones. Con cariño. Con neón. Con cero ganas de venderte paz falsa.
            </p>
          </div>
          <FooterColumn title="Explorar" links={[["Lecturas", "#lecturas"], ["Cómo funciona", "#como-funciona"], ["Planes", "#premium"], ["Preguntas", "#faq"]]} />
          <FooterColumn title="Cuenta" links={[["Crear cuenta", "/auth/register"], ["Entrar", "/auth/login"], ["Panel", "/dashboard"], ["Onboarding", "/onboarding"]]} />
          <FooterColumn title="ZODI" links={[["Horóscopo", "/auth/register"], ["Tarot", "/auth/register"], ["Numerología", "/auth/register"], ["Comunidad", "/auth/register"]]} />
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/42 sm:flex-row">
          <p>© 2026 ZODI. Tu futuro, sin filtro.</p>
          <p className="max-w-2xl text-center sm:text-right">Las lecturas de ZODI son contenido de entretenimiento y guía simbólica. No constituyen asesoramiento médico, legal, financiero ni psicológico. Para decisiones importantes, consulta a un profesional. El cosmos te lo agradece, y tu terapeuta también.</p>
        </div>
      </footer>
    </>
  );
}

function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/70">{kicker}</p>
        <h2 className="mt-3 mb-7 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-black text-lime-100">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm text-white/60">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className="transition hover:text-lime-200">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
