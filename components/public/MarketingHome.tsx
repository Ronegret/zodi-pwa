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
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-diario.png",
    action: "Ver horóscopos",
    href: "/auth/register",
    fit: "contain"
  },
  {
    title: "Tarot y tiradas",
    body: "Haz una pregunta, elige el tono y deja que ZODI traduzca el caos: situación, bloqueo, consejo y esa verdad incómoda que probablemente ya sabías.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Tarot-acido.png",
    action: "Consultar tarot",
    href: "/auth/register",
    fit: "contain"
  },
  {
    title: "Horóscopo chino",
    body: "Mira tu animal, elemento, ciclos y compatibilidades con una lectura visual amplia. Ideal para entender ritmos largos y no llamar \"destino\" a una mala costumbre.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Horoscopo-chino.png",
    action: "Descubrir mi ciclo",
    href: "/auth/register",
    fit: "contain"
  },
  {
    title: "Numerología",
    body: "Calcula camino de vida, vibración del nombre y fechas clave. Los números no te van a salvar la vida, pero sí pueden delatar patrones con una precisión molesta.",
    image: "/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.png",
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
      <section className="relative min-h-[calc(100vh-64px)] overflow-hidden px-4 py-8 sm:py-16">

        {/* Fondo estático imagen — sin video */}
        <div className="absolute inset-0 h-full w-full bg-[url('/zodi-art/poster-chaos.png')] bg-cover bg-center opacity-35" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(5,5,7,0.55)] via-[rgba(5,5,7,0.45)] to-[rgba(5,5,7,0.98)] lg:bg-[linear-gradient(110deg,rgba(5,5,7,.88)_45%,rgba(5,5,7,0.15)_100%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col justify-center gap-6 lg:grid lg:min-h-[80vh] lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-10">
          <div className="flex flex-col">
            <p className="stagger-1 mb-4 inline-block self-start rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-lime-300 sm:text-xs">
              ✦ Oráculo Astral ZODI ✦
            </p>
            <h1
              className="glitch-text stagger-2 max-w-4xl text-[2.4rem] font-black leading-[1.06] sm:text-5xl lg:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Zodi te lee el futuro y te juzga el presente.
            </h1>
            <p className="stagger-2 mt-4 max-w-2xl text-base leading-7 text-white/70 sm:mt-6 sm:text-lg sm:leading-8">
              Horóscopo, tarot, numerología, carta natal y comunidad en un solo lugar oscuro y brillante. Crea tu perfil astral gratis y recibe lecturas con personalidad.
            </p>
            <div className="stagger-3 mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Link
                href="/auth/register"
                className="hero-cta-pulse flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3.5 text-sm font-black text-black sm:px-6 sm:py-4 sm:text-base"
              >
                Empezar gratis <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <a
                href="#consultas"
                className="rounded-xl border border-purple-300/40 bg-purple-500/10 px-5 py-3.5 text-sm font-bold text-purple-100 transition hover:bg-purple-500/20 sm:px-6 sm:py-4 sm:text-base"
              >
                Explorar lecturas
              </a>
            </div>

            {/* Feature pills — solo mobile */}
            <div className="mt-6 flex flex-wrap gap-2 lg:hidden">
              <span className="rounded-full border border-lime-300/20 bg-lime-300/05 px-3 py-1 text-[11px] font-medium text-lime-200/70">✦ Tarot vivo</span>
              <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/05 px-3 py-1 text-[11px] font-medium text-fuchsia-200/70">✦ Rachas</span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-500/05 px-3 py-1 text-[11px] font-medium text-cyan-200/70">✦ Modo móvil</span>
            </div>
          </div>

          {/* Imagen oráculo — solo desktop lg+ */}
          <motion.div
            initial={{ opacity: 0, rotate: -3, y: 24 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            className="hidden lg:block glass-panel neon-border rounded-xl p-4"
          >
            <button
              onClick={() => setLightbox("/zodi-art/nuevas/2-Portada--Home/Hero-principal-portada.png")}
              className="group relative block w-full overflow-hidden rounded-lg"
              aria-label="Ver imagen completa"
            >
              <Image
                src="/zodi-art/nuevas/2-Portada--Home/Hero-principal-portada.png"
                alt="Oráculo cyberpunk de ZODI"
                width={520}
                height={520}
                className="h-auto w-full rounded-lg opacity-95 transition duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 transition group-hover:bg-black/30">
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
              onClick={() => setLightbox("/zodi-art/nuevas/1-Identidad-principal-de-marca/ZODI-Full-Detail.png")}
              className="group relative block overflow-hidden"
              aria-label="Ver personaje ZODI"
            >
              <Image
                src="/zodi-art/nuevas/1-Identidad-principal-de-marca/ZODI-Full-Detail.png"
                alt="Personaje ZODI completo"
                width={700}
                height={1200}
                className="h-64 w-full object-contain transition duration-500 group-hover:scale-105 sm:h-[480px] lg:h-[620px]"
                style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))" }}
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-3">
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
                className="h-64 w-full object-contain transition duration-500 group-hover:scale-105 sm:h-[480px] lg:h-[620px]"
                style={{ background: "radial-gradient(ellipse at center, rgba(184,255,23,0.06) 0%, transparent 70%)" }}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ── CONSULTAS ────────────────────────────────────────────────── */}
      <Section id="consultas" kicker="Empieza por aquí" title="Elige qué quieres consultar hoy.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {mainConsultas.map((item, index) => (
            <FadeUp key={item.title} delay={index * 0.1}>
              <motion.div whileHover={{ y: -6 }} className="glass-panel group flex h-full flex-col overflow-hidden rounded-lg">
                <button
                  type="button"
                  aria-label={`Ampliar ${item.title}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden border-b border-white/10"
                  onClick={() => setLightbox(item.image)}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/30">
                      <ZoomIn className="h-9 w-9 text-white opacity-0 drop-shadow-lg transition duration-300 group-hover:opacity-100" />
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
            </FadeUp>
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
          ].map(([title, body], index) => (
            <FadeUp key={title} delay={index * 0.1}>
              <motion.div whileHover={{ y: -6 }} className="glass-panel rounded-md p-5 h-full">
                <Sparkles className="mb-5 h-6 w-6 text-lime-300" />
                <h3 className="text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/66">{body}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── LECTURAS ─────────────────────────────────────────────────── */}
      <Section id="lecturas" kicker="Lecturas" title="Todo lo que puedes consultar, ordenado para no perderte.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {readings.map((module, index) => (
            <FadeUp key={module.title} delay={Math.min(index * 0.05, 0.4)}>
              <motion.article
                whileHover={{ y: -6, scale: 1.01 }}
                className="glass-panel group rounded-md p-4 h-full"
              >
                <div className={`mb-4 grid h-12 w-12 place-items-center rounded-md bg-gradient-to-br ${module.accent} text-black`}>
                  <module.icon className="h-5 w-5" />
                </div>
                <h3 className="font-black">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/62">{module.description}</p>
              </motion.article>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── TAROT ZODI ────────────────────────────────────────────────── */}
      <Section id="tarot" kicker="Tarot ZODI" title="Respuestas que pican, pero que necesitas escuchar.">
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-6">
          {[
            "La-Red-Flag.png",
            "El-Karma.png",
            "La-Verdad.png",
            "El-Destino.png",
            "El-Ego.png",
            "La-Mala-Idea.png",
            "La-Venganza-Cosmica.png"
          ].map((card, idx) => (
            <FadeUp key={card} delay={idx * 0.1}>
              <button
                type="button"
                aria-label={`Ampliar carta ${card.replace(".png", "").replaceAll("-", " ")}`}
                onClick={() => setLightbox(`/zodi-art/nuevas/8-Tarot-ZODI/${card}`)}
                className="group relative block w-48 shrink-0 snap-center overflow-hidden rounded-xl glass-panel p-1.5 transition hover:border-lime-300/40"
              >
                <Image
                  src={`/zodi-art/nuevas/8-Tarot-ZODI/${card}`}
                  alt={`Carta Tarot ZODI ${card}`}
                  width={300}
                  height={500}
                  className="h-auto w-full object-contain transition duration-500 group-hover:scale-105"
                />
              </button>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── ZODIACO ZODI (AVATARES) ────────────────────────────────────────── */}
      <Section id="signos" kicker="Tus Avatares" title="Elige tu identidad astral en el metaverso.">
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-6">
          {[
            "Avatar_Aries.png",
            "Avatar_Tauro.png",
            "Avatar_Geminis.png",
            "Avatar_Cancer.png",
            "Avatar_Leo.png",
            "Avatar_Virgo.png",
            "Avatar_Libra.png",
            "Avatar_Escorpio.png",
            "Avatar_Sagitario.png",
            "Avatar_Capricornio.png",
            "Avatar_Acuario.png",
            "Avatar_Piscis.png"
          ].map((avatar, idx) => (
            <FadeUp key={avatar} delay={idx * 0.05}>
              <button
                type="button"
                aria-label={`Ampliar avatar ${avatar.replace(".png", "").replaceAll("_", " ")}`}
                onClick={() => setLightbox(`/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${avatar}`)}
                className="group relative block w-32 sm:w-40 shrink-0 snap-center overflow-hidden rounded-full glass-panel p-2 transition hover:border-lime-300/40 hover:scale-105"
              >
                <div className="relative aspect-square w-full rounded-full overflow-hidden">
                  <Image
                    src={`/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/${avatar}`}
                    alt={`Avatar ${avatar}`}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
              </button>
            </FadeUp>
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
          </div>
          <button
            type="button"
            aria-label="Ampliar numerologia ZODI"
            onClick={() => setLightbox("/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.png")}
            className="group relative block w-full overflow-hidden rounded-2xl glass-panel p-2"
          >
            <Image
              src="/zodi-art/nuevas/3-Secciones-principales-de-la-web/Numerologia.png"
              alt="Numerología ZODI"
              width={800}
              height={600}
              className="h-auto w-full object-contain transition duration-500 group-hover:scale-105 bg-black/40 rounded-xl"
            />
          </button>
        </div>
      </Section>

      {/* ── FEATURE CARDS (3 imágenes) ───────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-14">
        <div className="absolute inset-0 bg-[url('/zodi-art/oracle-frame-tall.png')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {[
            { img: "/zodi-art/nuevas/2-Portada--Home/ZODI-con-cartas-flotando.png", title: "La verdad no viene suave", body: "Tarot visual con cartas, energía y respuestas directas. A veces abraza. A veces te mira fijo hasta que entiendes." },
            { img: "/zodi-art/nuevas/2-Portada--Home/ZODI-con-energia-en-la-mano.png", title: "Rituales de todos los días", body: "Pequeñas misiones, rachas y recordatorios para ordenar la energía sin convertir tu agenda en un monasterio." },
            { img: "/zodi-art/nuevas/2-Portada--Home/ZODI-riendose-con-sarcasmo.png", title: "Humor ácido astrológico", body: "Lecturas con carácter, frases para compartir y esa dosis de sinceridad que duele poquito, pero ilumina bastante." }
          ].map((card, index) => (
            <FadeUp key={card.title} delay={index * 0.1}>
              <motion.article whileHover={{ y: -8 }} className="glass-panel group overflow-hidden rounded-md h-full">
                <button
                  type="button"
                  aria-label={`Ampliar ${card.title}`}
                  onClick={() => setLightbox(card.img)}
                  className="relative block w-full overflow-hidden"
                >
                  <Image
                    src={card.img}
                    alt={card.title}
                    width={600}
                    height={720}
                    className="h-72 w-full object-contain bg-black/40 transition duration-500 group-hover:scale-105 sm:h-80"
                  />
                </button>
                <div className="p-5">
                  <h3 className="text-2xl font-black">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/66">{card.body}</p>
                </div>
              </motion.article>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────────── */}
      <Section id="como-funciona" kicker="Cómo funciona" title="Se entiende en seis pasos. Prometido: no hace falta mercurio avanzado.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => (
            <FadeUp key={step.title} delay={index * 0.1}>
              <motion.article whileHover={{ y: -6 }} className="glass-panel relative overflow-hidden rounded-md h-full">
                <div className="absolute -right-8 -top-8 text-[120px] font-black leading-none text-white/02 transition-transform duration-500 group-hover:scale-110">
                  0{index + 1}
                </div>
                <div className="relative p-6">
                  <h3 className="text-xl font-black text-lime-300">
                    <span className="text-white/40">0{index + 1}.</span> {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/68">{step.body}</p>
                </div>
              </motion.article>
            </FadeUp>
          ))}
        </div>
      </Section>

      {/* ── PREVIEW PANEL ────────────────────────────────────────────── */}
      <Section id="preview" kicker="Vista del panel" title="Tu espacio privado muestra primero lo que de verdad vas a usar.">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel overflow-hidden rounded-md p-4">
            <button
              type="button"
              aria-label="Ampliar vista del panel ZODI"
              onClick={() => setLightbox("/zodi-art/nuevas/2-Portada--Home/Banner-horizontal-desktop.png")}
              className="relative block w-full overflow-hidden rounded-md"
            >
              <Image
                src="/zodi-art/nuevas/2-Portada--Home/Banner-horizontal-desktop.png"
                alt="Vista mágica de ZODI"
                width={1100}
                height={700}
                className="w-full rounded-md border border-lime-300/20 object-cover magic-pulse transition duration-500 group-hover:scale-105"
              />
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
        <div className="absolute inset-0 bg-[url('/zodi-art/hoodie-phone-wide.png')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,7,.94),rgba(5,5,7,.72))]" />
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
            <Link href="/" className="inline-block origin-left">
              <Image src="/zodi-logo.png" alt="Logo de ZODI" width={420} height={280} className="h-auto w-56 max-w-full drop-shadow-[0_0_15px_rgba(184,255,23,0.3)] mix-blend-screen" />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-6 text-white/62">
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

// ── Reusable scroll-triggered fade-up wrapper ──────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Section wrapper with animated title ────────────────────────────────────
function Section({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-200/70">
          {kicker}
        </p>
        <h2 className="mt-3 mb-7 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
          {title}
        </h2>
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
