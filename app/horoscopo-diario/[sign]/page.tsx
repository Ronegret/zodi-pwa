import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedShell } from "@/components/AnimatedShell";
import { PublicNav } from "@/components/public/PublicNav";
import { SeoLeadMagnet } from "@/components/public/SeoLeadMagnet";

const validSigns = [
  "aries", "tauro", "geminis", "cancer", 
  "leo", "virgo", "libra", "escorpio", 
  "sagitario", "capricornio", "acuario", "piscis"
];

// Datos ficticios que luego puedes conectar a una DB real o a Gemini si prefieres generarlos al build
const getSignData = (sign: string) => {
  return {
    name: sign.charAt(0).toUpperCase() + sign.slice(1),
    date: new Date().toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    reading: `Los astros hoy no están para complacerte, ${sign.charAt(0).toUpperCase() + sign.slice(1)}. Tienes una alineación planetaria que exige acción, no excusas. Si has estado postergando esa decisión importante porque "no sentías la vibra", la realidad te va a golpear en la cara. Usa esa energía densa a tu favor o quítate del camino.`,
    luckyNumber: Math.floor(Math.random() * 99) + 1,
    color: "Rojo Carmesí"
  };
};

export async function generateStaticParams() {
  return validSigns.map((sign) => ({
    sign,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ sign: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const sign = resolvedParams.sign.toLowerCase();
  
  if (!validSigns.includes(sign)) return {};
  
  const signName = sign.charAt(0).toUpperCase() + sign.slice(1);

  return {
    title: `Horóscopo Diario ${signName} | ZODI - Predicción Realista`,
    description: `Lee tu horóscopo diario para ${signName}. Sin filtros, sin postureo espiritual. Descubre lo que los astros realmente tienen preparado para ti hoy.`,
    keywords: [`horóscopo ${sign}`, `horóscopo diario ${sign}`, `${sign} hoy`, `predicción ${sign}`, `astrología realista`],
    openGraph: {
      title: `Horóscopo Diario ${signName} - ZODI`,
      description: `Lectura brutal y honesta para ${signName}. Si no aguantas la verdad, no entres.`,
      url: `https://zodi.aibueno.es/horoscopo-diario/${sign}`
    }
  };
}

export default async function DailyHoroscopePage({ params }: { params: Promise<{ sign: string }> }) {
  const resolvedParams = await params;
  const sign = resolvedParams.sign.toLowerCase();

  if (!validSigns.includes(sign)) {
    notFound();
  }

  const data = getSignData(sign);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `Horóscopo Diario: ${data.name}`,
    "datePublished": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "ZODI"
    },
    "description": data.reading,
  };

  return (
    <AnimatedShell>
      <PublicNav />
      <div className="min-h-screen px-4 pt-24 pb-20 max-w-4xl mx-auto">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="mb-8">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-white/80">
            Horóscopo Diario Oficial
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white capitalize mb-4 glitch relative">
            {data.name}
          </h1>
          <p className="text-xl text-white/50">{data.date}</p>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-9xl pointer-events-none capitalize">
            {data.name}
          </div>
          
          <h2 className="text-2xl font-bold text-lime-300 mb-6 relative z-10">
            Lectura Astral (Sin Filtros)
          </h2>
          
          <p className="text-xl md:text-2xl leading-relaxed text-white/90 relative z-10 font-medium">
            "{data.reading}"
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="block text-xs uppercase text-white/50 font-bold mb-1">Número de la Suerte</span>
              <span className="text-3xl font-black text-white">{data.luckyNumber}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <span className="block text-xs uppercase text-white/50 font-bold mb-1">Color Energético</span>
              <span className="text-xl font-bold text-white">{data.color}</span>
            </div>
          </div>
        </div>

        <SeoLeadMagnet sign={data.name} />
      </div>
    </AnimatedShell>
  );
}
