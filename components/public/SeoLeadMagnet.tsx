"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function SeoLeadMagnet({ sign }: { sign: string }) {
  return (
    <div className="relative overflow-hidden glass-panel border border-lime-300/30 rounded-2xl p-8 mt-12 mb-8 bg-black/60">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-300/5 to-transparent z-0" />
      <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150 z-0 mix-blend-screen pointer-events-none">
        <Sparkles className="w-32 h-32 text-lime-300" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-300/10 text-lime-300 text-xs font-bold uppercase tracking-wider mb-4 border border-lime-300/20">
          <Sparkles className="w-3 h-3" />
          <span>Contenido Desbloqueado Parcialmente</span>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
          Esto es solo la punta del iceberg para <span className="text-lime-300 capitalize">{sign}</span>.
        </h3>
        
        <p className="text-white/70 mb-8 max-w-xl text-lg leading-relaxed">
          Las lecturas generales son para novatos. Si quieres que los astros te hablen directo a la cara sin filtros ni espiritualidad barata, necesitas tu Carta Natal calculada con precisión milimétrica.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-4 bg-lime-300 hover:bg-lime-200 text-black font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(184,255,23,0.3)]"
          >
            Obtener mi Perfil Astral Gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
