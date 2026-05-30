"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, Calendar, Check, ImagePlus, MapPin,
  Sparkles, UserRound, Gem, Flame, X
} from "lucide-react";
import { generateAstralProfile } from "@/lib/astral";
import { completeLocalOnboarding, getLocalSession, signOutZodi } from "@/lib/session";
import type { OnboardingData } from "@/types/zodi";

// ── Avatares ───────────────────────────────────────────────────────────────────
const zodiacAvatars: [string, string][] = [
  ["Aries",       "/zodi-art/avatars/aries.png"],
  ["Tauro",       "/zodi-art/avatars/tauro.png"],
  ["Géminis",     "/zodi-art/avatars/geminis.png"],
  ["Cáncer",      "/zodi-art/avatars/cancer.png"],
  ["Leo",         "/zodi-art/avatars/leo.png"],
  ["Virgo",       "/zodi-art/avatars/virgo.png"],
  ["Libra",       "/zodi-art/avatars/libra.png"],
  ["Escorpio",    "/zodi-art/avatars/escorpio.png"],
  ["Sagitario",   "/zodi-art/avatars/sagitario.png"],
  ["Capricornio", "/zodi-art/avatars/capricornio.png"],
  ["Acuario",     "/zodi-art/avatars/acuario.png"],
  ["Piscis",      "/zodi-art/avatars/piscis.png"]
];

const zodiAvatars: [string, string][] = [
  ["ZODI 1", "/zodi-art/perfil/perfil-1.png"],
  ["ZODI 2", "/zodi-art/perfil/perfil-2.png"],
  ["ZODI 3", "/zodi-art/perfil/perfil-3.png"],
  ["ZODI 4", "/zodi-art/perfil/perfil-4.png"],
  ["ZODI 5", "/zodi-art/perfil/perfil-5.png"],
  ["ZODI 6", "/zodi-art/perfil/perfil-6.png"],
  ["ZODI 7", "/zodi-art/perfil/perfil-7.png"],
  ["ZODI 8", "/zodi-art/perfil/perfil8.png"],
  ["ZODI 9", "/zodi-art/perfil/perfil-9.png"],
  ["ZODI 10", "/zodi-art/perfil/perfil-10.png"],
  ["ZODI 11", "/zodi-art/perfil/perfil-11.png"],
  ["ZODI 12", "/zodi-art/perfil/perfil-12.png"],
  ["ZODI Mini", "/zodi-art/perfil/perfil-13.png"]
];

const chineseAvatars: [string, string][] = [
  ["Rata", "/zodi-art/chino/C_rata.png"],
  ["Buey", "/zodi-art/chino/C_buey.png"],
  ["Tigre", "/zodi-art/chino/C_tigre.png"],
  ["Conejo", "/zodi-art/chino/C_conejo.png"],
  ["Dragón", "/zodi-art/chino/C_dragon.png"],
  ["Serpiente", "/zodi-art/chino/C_serpiente.png"],
  ["Caballo", "/zodi-art/chino/C_caballo.png"],
  ["Cabra", "/zodi-art/chino/C_cabra.png"],
  ["Mono", "/zodi-art/chino/C_mono.png"],
  ["Gallo", "/zodi-art/chino/C_gallo.png"],
  ["Perro", "/zodi-art/chino/C_perro.png"],
  ["Cerdo", "/zodi-art/chino/C_cerdo.png"]
];

const topics = ["amor", "dinero", "trabajo", "espiritualidad", "futuro", "energía"] as const;
const tones  = ["suave", "directo", "brutal", "sarcastico"] as const;

// ── Ciudades y países frecuentes ───────────────────────────────────────────────
const CITIES = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Ciudad de México", "Buenos Aires", "Bogotá", "Lima", "Santiago", "Nueva York", "Los Ángeles", "Londres", "París"];
const COUNTRIES = ["España", "México", "Argentina", "Colombia", "Chile", "Perú", "Venezuela", "Ecuador", "Bolivia", "Uruguay", "Estados Unidos", "Alemania", "Francia", "Italia", "Reino Unido"];

// ── Frases de ZODI mientras calcula el perfil ─────────────────────────────────
const CALC_PHRASES = [
  "Consultando las constelaciones... sin prisa pero sin pausa.",
  "Tu mapa astral está emergiendo de la oscuridad cósmica.",
  "Los planetas están procesando. Mercurio también lo intenta.",
  "Calculando lo que las estrellas saben de ti desde que naciste.",
  "Tu carta astral tiene capas. ZODI las está leyendo sin llorar.",
];

const TOTAL_STEPS = 5;

const initialData: OnboardingData = {
  displayName: "",
  username: "",
  avatar: "/zodi-art/perfil/perfil-1.png",
  genderIdentity: "",
  birthDate: "",
  birthTime: "",
  birthCity: "",
  birthCountry: "",
  currentCity: "",
  currentCountry: "",
  readingTone: "sarcastico",
  favoriteTopics: ["amor", "futuro"],
  notificationPreferences: ["horoscopo diario", "alertas lunares"]
};

function validateStep(step: number, data: OnboardingData): string | null {
  if (step === 0) {
    if (!data.displayName.trim()) return "¿Cómo te llamo? Necesito un nombre.";
  }
  if (step === 1) {
    if (!data.birthDate) return "Sin fecha de nacimiento no puedo calcular nada, te lo juro.";
    if (!data.birthCity.trim()) return "Dime dónde naciste. El cosmos también lo necesita.";
    if (!data.birthCountry.trim()) return "El país de nacimiento también cuenta para tu perfil astral.";
  }
  return null;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 })
};

// ── Componente principal ───────────────────────────────────────────────────────
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData]           = useState<OnboardingData>(initialData);
  const [finishing, setFinishing] = useState(false);
  const [calculating, setCalc]    = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const profile = useMemo(() => generateAstralProfile(data), [data]);

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  function toggleTopic(value: string) {
    setData((d) => ({
      ...d,
      favoriteTopics: d.favoriteTopics.includes(value)
        ? d.favoriteTopics.filter((t) => t !== value)
        : [...d.favoriteTopics, value]
    }));
  }

  function goNext() {
    const err = validateStep(step, data);
    if (err) { setError(err); return; }
    setError(null);

    // Animación de cálculo astral al pasar del paso 1 → 2
    if (step === 1) {
      setCalc(true);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setPhraseIdx((p) => (p + 1) % CALC_PHRASES.length);
        if (i >= 3) {
          clearInterval(interval);
          setCalc(false);
          setDirection(1);
          setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
        }
      }, 900);
      return;
    }

    setDirection(1);
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }

  function goBack() {
    setError(null);
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    setFinishing(true);
    completeLocalOnboarding(data, profile);

    const session = getLocalSession();
    if (session.uid) {
      try {
        const { saveOnboardingProfile } = await import("@/lib/firebase/profile");
        await saveOnboardingProfile(session.uid, data, profile);
      } catch { /* Firebase no configurado — localStorage es el fallback */ }
    }

    // ── GROWTH HACKING: Recompensas de bienvenida y referidos ──
    try {
      const gamification = await import("@/lib/gamification");
      const currentGems = gamification.getGems().total;
      
      // Bono de bienvenida
      if (currentGems < 300) {
        gamification.addGems(300 - currentGems); 
      }
      
      // Bonus por referido
      const refCode = localStorage.getItem("zodi_ref_code");
      if (refCode && session.uid && refCode !== session.uid) {
        // Notificar al backend para premiar al embajador (el que invitó)
        let token = "";
        try {
          const { getFirebaseAuth } = await import("@/lib/firebase/client");
          const auth = getFirebaseAuth();
          if (auth?.currentUser) token = await auth.currentUser.getIdToken();
        } catch (e) {}

        if (token) {
          const response = await fetch("/api/user/referral", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ referrerId: refCode, newUserId: session.uid })
          });

          if (response.ok) {
            gamification.addGems(200);
            localStorage.removeItem("zodi_ref_code");
          }
        }
      }
    } catch (e) { 
      console.warn("No se pudieron cargar las recompensas locales", e); 
    }

    router.push("/dashboard");
  }

  function uploadAvatar(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("avatar", reader.result);
    };
    reader.readAsDataURL(file);
  }

  // ── Render pantalla de cálculo astral ────────────────────────────────────────
  if (calculating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-ink px-4">
        {/* Fondo de estrellas */}
        <div className="spark-field -z-10" />

        {/* Logo girando como vinilo */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-dashed border-lime-300/20"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="h-28 w-28 overflow-hidden rounded-full border-2 border-lime-300/50 shadow-[0_0_32px_rgba(184,255,23,0.35)]"
          >
            <Image src="/zodi-art/brand/isotipo.png" alt="ZODI calculando" width={112} height={112} className="h-full w-full object-contain p-2 mix-blend-screen" />
          </motion.div>
          {/* Centro */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(184,255,23,0.90)]" />
          </div>
        </div>

        {/* Dots pulsantes */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
              className="h-2 w-2 rounded-full bg-lime-300"
            />
          ))}
        </div>

        {/* Frase ácida */}
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="max-w-sm text-center text-base leading-relaxed text-white/65 font-medium"
          >
            {CALC_PHRASES[phraseIdx]}
          </motion.p>
        </AnimatePresence>

        <p className="text-[11px] uppercase tracking-widest text-lime-300/50">Calculando tu carta astral</p>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────────
  return (
    <section className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
      {/* Fondo */}
      <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/oracle-frame-tall.png')] bg-cover bg-center opacity-15" />
      <div className="spark-field -z-10" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative h-14 w-40 sm:h-16 sm:w-52">
          <Image src="/zodi-logo.png" alt="ZODI" fill sizes="(min-width: 640px) 208px, 160px" className="object-contain object-left mix-blend-screen" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
            {[...Array(TOTAL_STEPS)].map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "w-6 bg-lime-300" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <button
            onClick={async () => {
              await signOutZodi();
              router.push("/");
            }}
            title="Cancelar y volver al inicio"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="glass-panel flex-1 overflow-hidden rounded-2xl border border-white/08">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full p-6 sm:p-8"
          >
            {/* ── PASO 0: Identidad ── */}
            {step === 0 && (
              <div>
                <p className="zodi-kicker">Paso 1 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  ¿Cómo quieres<br />que te llame?
                </h1>
                <p className="mt-3 text-sm text-white/55">Elige un nombre, un alias, un apodo. Lo que uses en la calle.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Nombre visible *"
                      value={data.displayName}
                      onChange={(v) => update("displayName", v)}
                      placeholder="Neon Bruja, La Scorpio, tu nombre real..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input label="Usuario (@)" value={data.username} onChange={(v) => update("username", v)} placeholder="@zodiserpiente" />
                  </div>
                </div>

                {/* Avatar */}
                <div className="mt-6">
                  <p className="mb-3 text-sm font-bold text-white/70">Elige tu imagen de perfil</p>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl border-2 border-lime-300/50">
                      {data.avatar.startsWith("data:") ? (
                        <img src={data.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Image src={data.avatar} alt="Avatar" fill className="object-cover" />
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/05 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10">
                      <ImagePlus className="h-4 w-4" />
                      Subir foto
                      <input className="hidden" type="file" accept="image/*" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
                    </label>
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">Por signo</p>
                  <div className="mb-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                    {zodiacAvatars.map(([label, src]) => (
                      <button key={src} type="button" title={label} onClick={() => update("avatar", src)}
                        className={`relative aspect-square overflow-hidden rounded-lg border transition ${data.avatar === src ? "border-lime-300 shadow-[0_0_16px_rgba(184,255,23,0.30)]" : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"}`}>
                        <Image src={src} alt={label} fill sizes="48px" className="object-cover" />
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">Estilo ZODI</p>
                  <div className="mb-4 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                    {zodiAvatars.map(([label, src]) => (
                      <button key={src} type="button" title={label} onClick={() => update("avatar", src)}
                        className={`relative aspect-square overflow-hidden rounded-lg border transition ${data.avatar === src ? "border-lime-300 shadow-[0_0_16px_rgba(184,255,23,0.30)]" : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"}`}>
                        <Image src={src} alt={label} fill sizes="48px" className="object-cover" />
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">Zodiaco Chino</p>
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
                    {chineseAvatars.map(([label, src]) => (
                      <button key={src} type="button" title={label} onClick={() => update("avatar", src)}
                        className={`relative aspect-square overflow-hidden rounded-lg border transition ${data.avatar === src ? "border-lime-300 shadow-[0_0_16px_rgba(184,255,23,0.30)]" : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"}`}>
                        <Image src={src} alt={label} fill sizes="48px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── PASO 1: Nacimiento (mínimo necesario) ── */}
            {step === 1 && (
              <div>
                <p className="zodi-kicker">Paso 2 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  ¿Cuándo y dónde<br />llegaste a este mundo?
                </h1>
                <p className="mt-3 text-sm text-white/55">
                  Con esto calculo tu signo solar, lunar, ascendente y carta natal. La hora exacta mejora el ascendente.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-3">
                    <Input label="Fecha de nacimiento *" value={data.birthDate} onChange={(v) => update("birthDate", v)} type="date" />
                    <div>
                      <Input label="Hora (opcional — mejora el ascendente)" value={data.birthTime} onChange={(v) => update("birthTime", v)} type="time" />
                      <p className="mt-1 text-[11px] text-white/35">Sin hora exacta, calculo igual pero el ascendente será aproximado.</p>
                    </div>
                  </div>
                  <CityInput label="Ciudad de nacimiento *" value={data.birthCity} onChange={(v) => update("birthCity", v)} list={CITIES} />
                  <CountryInput label="País de nacimiento *" value={data.birthCountry} onChange={(v) => update("birthCountry", v)} />
                  <CityInput label="Ciudad actual (opcional)" value={data.currentCity} onChange={(v) => update("currentCity", v)} list={CITIES} />
                  <CountryInput label="País actual (opcional)" value={data.currentCountry} onChange={(v) => update("currentCountry", v)} />
                </div>
              </div>
            )}

            {/* ── PASO 2: Cálculos (resultado astral) ── */}
            {step === 2 && (
              <div>
                <p className="zodi-kicker">Paso 3 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  Tu firma astral
                </h1>
                <p className="mt-3 text-sm text-white/55">
                  Esto es lo que el cosmos sabe de ti. Puede que te incomode un poco. Es normal.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    ["☀️ Signo solar",    profile.sunSign],
                    ["🌙 Signo lunar",    profile.moonSign],
                    ["⬆️ Ascendente",     profile.ascendant],
                    ["🔢 Camino de vida", profile.lifePathNumber.toString()],
                    ["🐉 Chino",         profile.chineseZodiac],
                    ["🌿 Maya",           profile.mayanSign],
                    ["⚡ Biorritmo",      profile.biorhythmBaseline],
                    ["🗺️ Carta base",    profile.natalChartBase],
                  ] as [string, string][]).map(([label, value]) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 }}
                      className="rounded-xl border border-white/08 bg-white/03 p-3"
                    >
                      <p className="text-xs text-white/40">{label}</p>
                      <p className="mt-1 text-base font-black text-lime-100">{value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-500/08 p-4">
                  <p className="text-sm font-bold text-violet-200">Resumen de tu perfil</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{profile.summary}</p>
                </div>
              </div>
            )}

            {/* ── PASO 3: Preferencias ── */}
            {step === 3 && (
              <div>
                <p className="zodi-kicker">Paso 4 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  ¿Cómo quieres<br />que te hable?
                </h1>
                <p className="mt-3 text-sm text-white/55">
                  ZODI adapta el tono a ti. Y los temas que más te interesan para personalizar tus lecturas.
                </p>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-bold text-white/70">Tono de lectura</p>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                    {tones.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => update("readingTone", tone)}
                        className={`rounded-xl py-3 px-5 text-sm font-bold capitalize transition ${
                          data.readingTone === tone
                            ? "bg-lime-300 text-black shadow-[0_0_16px_rgba(184,255,23,0.30)]"
                            : "border border-white/12 text-white/65 hover:border-lime-300/30 hover:text-white"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <p className="mb-3 text-sm font-bold text-white/70">Temas que más te interesan</p>
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                            data.favoriteTopics.includes(topic)
                              ? "bg-violet-500/80 text-white shadow-[0_0_12px_rgba(155,77,255,0.30)]"
                              : "border border-white/12 text-white/60 hover:border-violet-400/40"
                          }`}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PASO 4: Resumen final ── */}
            {step === 4 && (
              <div>
                <p className="zodi-kicker">Paso 5 de {TOTAL_STEPS}</p>
                <h1 className="mt-2 text-3xl font-black leading-tight">
                  Tu portal está<br />listo, {data.displayName.split(" ")[0] || "viajero"}.
                </h1>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {/* Avatar + nombre */}
                  <div className="flex items-center gap-3 rounded-xl border border-lime-300/20 bg-lime-300/06 p-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-lime-300/40 shrink-0">
                      {data.avatar.startsWith("data:") ? (
                        <img src={data.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Image src={data.avatar} alt="Avatar" fill className="object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-lime-200/60">Identidad</p>
                      <p className="font-black text-lime-100">{data.displayName}</p>
                      {data.username && <p className="text-xs text-lime-200/50">@{data.username}</p>}
                    </div>
                  </div>

                  {/* Signo */}
                  <div className="rounded-xl border border-violet-400/20 bg-violet-500/08 p-4">
                    <p className="text-xs text-violet-200/60">Tu signo solar</p>
                    <p className="mt-1 text-2xl font-black text-lime-100 glitch">{profile.sunSign}</p>
                    <p className="text-xs text-white/50">Luna {profile.moonSign} · Asc. {profile.ascendant}</p>
                  </div>

                  {/* Gemas de bienvenida */}
                  <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/06 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/15">
                      <Gem className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yellow-200">Regalo de bienvenida</p>
                      <p className="text-xs text-white/55">Recibirás <strong className="text-yellow-300">50 gemas</strong> al entrar por primera vez. Úsalas para desbloquear lecturas especiales.</p>
                    </div>
                  </div>

                  {/* Racha */}
                  <div className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-orange-400/20 bg-orange-400/06 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-400/15">
                      <Flame className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-200">Empieza tu racha hoy</p>
                      <p className="text-xs text-white/55">Cada día que uses ZODI suma a tu racha. 7 días seguidos = 10 gemas extra.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-orange-400/25 bg-orange-400/10 px-4 py-3 text-sm text-orange-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegación */}
      <div className="mt-4 flex items-center justify-between gap-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}>
        <button
          disabled={step === 0}
          onClick={goBack}
          className="rounded-xl border border-white/12 px-5 py-3.5 font-bold text-white/60 transition hover:border-white/25 disabled:opacity-30"
        >
          Atrás
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            onClick={goNext}
            className="flex items-center gap-2 rounded-xl bg-lime-300 px-6 py-3.5 font-black text-black transition hover:bg-lime-200 active:scale-95"
          >
            Continuar
            <span className="text-xs opacity-60">{step + 1}/{TOTAL_STEPS}</span>
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={finishing}
            className="flex items-center gap-2 rounded-xl bg-lime-300 px-6 py-3.5 font-black text-black transition hover:bg-lime-200 active:scale-95 disabled:opacity-60"
          >
            {finishing ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Abriendo portal...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Entrar a ZODI
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function Input({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block cursor-text rounded-xl border border-white/08 bg-black/35 p-3.5 transition focus-within:border-lime-300/40">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
      <input
        className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CityInput({ label, value, onChange, list }: {
  label: string; value: string; onChange: (v: string) => void; list: string[];
}) {
  const id = `zodi-list-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label className="block cursor-text rounded-xl border border-white/08 bg-black/35 p-3.5 transition focus-within:border-lime-300/40">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">
        <MapPin className="h-3 w-3" /> {label}
      </span>
      <input
        list={id}
        className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
        value={value}
        placeholder="Empieza a escribir..."
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={id}>
        {list.map((item) => <option key={item} value={item} />)}
      </datalist>
    </label>
  );
}

function CountryInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <label className="block cursor-text rounded-xl border border-white/08 bg-black/35 p-3.5 transition focus-within:border-lime-300/40">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">{label}</span>
      <input
        list="zodi-countries"
        className="w-full bg-transparent text-white outline-none placeholder:text-white/25"
        value={value}
        placeholder="Selecciona o escribe..."
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id="zodi-countries">
        {COUNTRIES.map((c) => <option key={c} value={c} />)}
      </datalist>
    </label>
  );
}
