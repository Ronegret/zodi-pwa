import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SIGNS: Record<string, {
  name: string; emoji: string; dates: string; element: string; ruler: string;
  img: string; avatar: string;
  desc: string; traits: string[]; advice: string;
}> = {
  aries: {
    name: "Aries", emoji: "♈", dates: "21 marzo — 19 abril",
    element: "Fuego 🔥", ruler: "Marte",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Aries.webp",
    avatar: "/zodi-art/signos/aries.webp",
    desc: "Aries abre el zodiaco con la fuerza de quien no pide permiso. Líder nato, impulsivo, apasionado. Cuando quiere algo, va a por ello antes de que los demás terminen de pensar.",
    traits: ["Valentía", "Liderazgo", "Impulsividad", "Energía", "Independencia"],
    advice: "Tu energía hoy no admite espera. Muévete antes de que el momento pase.",
  },
  tauro: {
    name: "Tauro", emoji: "♉", dates: "20 abril — 20 mayo",
    element: "Tierra 🌿", ruler: "Venus",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Tauro.webp",
    avatar: "/zodi-art/signos/tauro.webp",
    desc: "Tauro construye en piedra lo que otros construyen en arena. Paciente, sensual y con un radar para la calidad que no falla. No se mueve hasta que está seguro — pero cuando se mueve, no hay quien lo pare.",
    traits: ["Perseverancia", "Sensualidad", "Lealtad", "Terquedad", "Materialismo"],
    advice: "Lo que construyes con calma dura. La paciencia no es rendirse.",
  },
  geminis: {
    name: "Géminis", emoji: "♊", dates: "21 mayo — 20 junio",
    element: "Aire 💨", ruler: "Mercurio",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Geminis.webp",
    avatar: "/zodi-art/signos/geminis.webp",
    desc: "Géminis vive en dos mundos a la vez y se aburre en ambos. La mente más rápida del zodiaco. Comunicador brillante, curioso insaciable, y capaz de mantener cinco conversaciones mientras piensa en algo totalmente distinto.",
    traits: ["Ingenio", "Adaptabilidad", "Curiosidad", "Dualidad", "Elocuencia"],
    advice: "Dos opciones, dos voces. Hoy escoge una y actúa.",
  },
  cancer: {
    name: "Cáncer", emoji: "♋", dates: "21 junio — 22 julio",
    element: "Agua 🌊", ruler: "Luna",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Cancer.webp",
    avatar: "/zodi-art/signos/cancer.webp",
    desc: "Cáncer siente lo que nadie ve. Intuición brutal, memoria emocional perfecta y una capacidad de cuidar a los demás que lo convierte en el pilar silencioso de cualquier grupo. No se fía fácil — pero cuando lo hace, es para siempre.",
    traits: ["Intuición", "Empatía", "Protección", "Sensibilidad", "Memoria"],
    advice: "Tu instinto no miente. Confía en lo que sientes sin explicarlo.",
  },
  leo: {
    name: "Leo", emoji: "♌", dates: "23 julio — 22 agosto",
    element: "Fuego 🔥", ruler: "Sol",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Leo.webp",
    avatar: "/zodi-art/signos/leo.webp",
    desc: "Leo no entra en una habitación — la conquista. Carisma natural, generosidad desbordante y un ego que, bien usado, se convierte en liderazgo inspirador. Nació para brillar y lo sabe perfectamente.",
    traits: ["Carisma", "Generosidad", "Creatividad", "Orgullo", "Liderazgo"],
    advice: "El escenario es tuyo. No llegues tarde a tu propio show.",
  },
  virgo: {
    name: "Virgo", emoji: "♍", dates: "23 agosto — 22 septiembre",
    element: "Tierra 🌿", ruler: "Mercurio",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Virgo.webp",
    avatar: "/zodi-art/signos/virgo.webp",
    desc: "Virgo ve lo que no funciona antes de que nadie más lo note. Analítico, meticuloso y con unos estándares que a veces solo él puede cumplir. Detrás de cada detalle perfecto hay un Virgo que lo pensó tres veces.",
    traits: ["Precisión", "Análisis", "Servicio", "Crítica", "Perfeccionismo"],
    advice: "El detalle que nadie ve es el que tú ya notaste. Actúa.",
  },
  libra: {
    name: "Libra", emoji: "♎", dates: "23 septiembre — 22 octubre",
    element: "Aire 💨", ruler: "Venus",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Libra.webp",
    avatar: "/zodi-art/signos/libra.webp",
    desc: "Libra busca el punto exacto donde todo encaja. Diplomático, estético y con un sentido de la justicia que hace de árbitro en todos los conflictos a su alrededor. La indecisión es el precio de ver todos los lados a la vez.",
    traits: ["Diplomacia", "Estética", "Justicia", "Indecisión", "Encanto"],
    advice: "La indecisión tiene fecha de caducidad. Hoy es el día.",
  },
  escorpio: {
    name: "Escorpio", emoji: "♏", dates: "23 octubre — 21 noviembre",
    element: "Agua 🌊", ruler: "Plutón",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Escorpio.webp",
    avatar: "/zodi-art/signos/escorpio.webp",
    desc: "Escorpio va donde nadie más se atreve. Intensidad pura, poder de transformación y una capacidad de ver a través de las personas que puede resultar incómoda. No perdona fácil — pero tampoco olvida lo que vale la pena guardar.",
    traits: ["Intensidad", "Transformación", "Intuición", "Poder", "Secretismo"],
    advice: "Lo que no has querido ver, hoy lo ves. Prepárate.",
  },
  sagitario: {
    name: "Sagitario", emoji: "♐", dates: "22 noviembre — 21 diciembre",
    element: "Fuego 🔥", ruler: "Júpiter",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Sagitario.webp",
    avatar: "/zodi-art/signos/sagitario.webp",
    desc: "Sagitario apunta lejos y dispara antes de pensar si el arco aguanta. Filósofo, aventurero y brutalmente honesto. Necesita horizonte, movimiento y la libertad de cambiar de opinión mañana si encuentra algo mejor.",
    traits: ["Libertad", "Optimismo", "Filosofía", "Aventura", "Franqueza"],
    advice: "La aventura sin propósito es solo movimiento. Apunta lejos.",
  },
  capricornio: {
    name: "Capricornio", emoji: "♑", dates: "22 diciembre — 19 enero",
    element: "Tierra 🌿", ruler: "Saturno",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Capricornio.webp",
    avatar: "/zodi-art/signos/capricornio.webp",
    desc: "Capricornio escala la montaña que los demás ni se atrevieron a mirar. Ambición estructurada, disciplina de hierro y una paciencia estratégica que confunde con frialdad a quienes no lo conocen. Llega — siempre llega.",
    traits: ["Ambición", "Disciplina", "Responsabilidad", "Paciencia", "Pragmatismo"],
    advice: "Lento y concreto gana. Lo apresurado hoy cuesta el doble.",
  },
  acuario: {
    name: "Acuario", emoji: "♒", dates: "20 enero — 18 febrero",
    element: "Aire 💨", ruler: "Urano",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Acuario.webp",
    avatar: "/zodi-art/signos/acuario.webp",
    desc: "Acuario vive 20 años adelantado al resto. Innovador, rebelde y con una visión de colectivo que lo hace querer cambiar el mundo antes del desayuno. Necesita libertad para pensar — y espacio para ser raro sin que nadie lo juzgue.",
    traits: ["Originalidad", "Visión", "Rebeldía", "Humanitarismo", "Independencia"],
    advice: "Tu visión hoy no es utopía. Es adelanto. Compártela.",
  },
  piscis: {
    name: "Piscis", emoji: "♓", dates: "19 febrero — 20 marzo",
    element: "Agua 🌊", ruler: "Neptuno",
    img: "/zodi-art/nuevas/5-Signos-del-zodiaco-occidental/Piscis.webp",
    avatar: "/zodi-art/signos/piscis.webp",
    desc: "Piscis absorbe el mundo como una esponja y lo devuelve convertido en arte, empatía o magia. El más espiritual del zodiaco, con una creatividad que asusta y una compasión que a veces le cuesta cara.",
    traits: ["Empatía", "Creatividad", "Espiritualidad", "Intuición", "Evasión"],
    advice: "Tu compasión es tu poder. No la confundas con debilidad.",
  },
};

export async function generateStaticParams() {
  return Object.keys(SIGNS).map((signo) => ({ signo }));
}

export async function generateMetadata({ params }: { params: Promise<{ signo: string }> }): Promise<Metadata> {
  const { signo } = await params;
  const sign = SIGNS[signo.toLowerCase()];
  if (!sign) return { title: "Signo no encontrado — ZODI" };
  return {
    title: `Horóscopo ${sign.name} hoy ${sign.emoji} — ZODI`,
    description: `${sign.desc.slice(0, 155)}`,
    openGraph: {
      title: `${sign.emoji} ${sign.name} — Horóscopo con IA`,
      description: `${sign.dates} · ${sign.element} · Regente: ${sign.ruler}. ${sign.desc.slice(0, 120)}`,
      images: [{ url: sign.img, width: 800, height: 1200 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${sign.emoji} ${sign.name} en ZODI`,
      description: sign.desc.slice(0, 120),
      images: [sign.img],
    },
    alternates: {
      canonical: `https://zodi.aibueno.es/horoscopo/${signo}`,
    },
  };
}

export default async function SignoPage({ params }: { params: Promise<{ signo: string }> }) {
  const { signo } = await params;
  const sign = SIGNS[signo.toLowerCase()];
  if (!sign) notFound();

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      {/* Nav mínima */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur border-b border-white/05">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/zodi-logo.png" alt="ZODI" width={72} height={28} className="h-7 w-auto" />
        </Link>
        <Link href="/auth/login"
          className="rounded-full bg-[#b8ff17] px-4 py-1.5 text-xs font-black text-black hover:bg-[#c8ff40] transition">
          Entrar gratis
        </Link>
      </nav>

      {/* Hero con imagen del signo */}
      <section className="relative pt-14 min-h-[55vh] flex items-end overflow-hidden">
        <Image src={sign.img} alt={sign.name} fill className="object-cover object-top opacity-35" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent" />
        <div className="relative z-10 px-5 pb-10 max-w-2xl mx-auto w-full">
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#b8ff17]/80 mb-2">{sign.element} · {sign.dates}</p>
          <h1 className="text-5xl sm:text-6xl font-black mb-2">{sign.emoji} {sign.name}</h1>
          <p className="text-white/60 text-sm">Regente: <span className="text-white font-semibold">{sign.ruler}</span></p>
        </div>
      </section>

      {/* Descripción */}
      <section className="max-w-2xl mx-auto px-5 py-10">
        <p className="text-lg sm:text-xl text-white/85 leading-relaxed">{sign.desc}</p>

        {/* Rasgos */}
        <div className="mt-8 flex flex-wrap gap-2">
          {sign.traits.map((t) => (
            <span key={t} className="rounded-full border border-[#b8ff17]/30 bg-[#b8ff17]/08 px-3 py-1 text-xs font-bold text-[#b8ff17]/90">
              {t}
            </span>
          ))}
        </div>

        {/* Consejo del día */}
        <div className="mt-8 rounded-2xl border border-[#b8ff17]/20 bg-[#b8ff17]/05 p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b8ff17]/60 mb-2">Lo que ZODI te diría hoy</p>
          <p className="text-base font-black text-white leading-snug">"{sign.advice}"</p>
        </div>

        {/* Avatar + otros signos */}
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40 mb-4">Explora otros signos</p>
          <div className="grid grid-cols-6 gap-2">
            {Object.entries(SIGNS).map(([slug, s]) => (
              <Link key={slug} href={`/horoscopo/${slug}`}
                className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition hover:bg-white/05 ${slug === signo ? "ring-1 ring-[#b8ff17]/60" : ""}`}>
                <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10">
                  <Image src={s.avatar} alt={s.name} fill className="object-cover" sizes="40px" />
                </div>
                <span className="text-[9px] text-white/50">{s.emoji}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-5 pb-16 text-center">
        <div className="rounded-3xl border border-white/08 bg-white/03 p-8">
          <p className="text-2xl font-black mb-2">¿Quieres tu lectura personalizada?</p>
          <p className="text-white/55 text-sm mb-6">
            ZODI cruza tu signo solar, lunar, ascendente, zodiaco chino y numerología para darte una lectura que sí va contigo.
          </p>
          <Link href="/auth/register"
            className="inline-block rounded-full bg-[#b8ff17] px-8 py-3 font-black text-black text-base hover:bg-[#c8ff40] transition active:scale-95">
            Crear cuenta gratis
          </Link>
          <p className="mt-3 text-xs text-white/30">Sin tarjeta. Sin spam.</p>
        </div>
      </section>

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": `Horóscopo ${sign.name} — ZODI`,
            "description": sign.desc,
            "image": `https://zodi.aibueno.es${sign.img}`,
            "author": { "@type": "Organization", "name": "ZODI" },
            "publisher": { "@type": "Organization", "name": "ZODI", "logo": "https://zodi.aibueno.es/zodi-logo.png" },
          })
        }}
      />
    </main>
  );
}
