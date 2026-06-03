"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatedShell } from "@/components/AnimatedShell";
import { PublicNav } from "@/components/public/PublicNav";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí puedes loguear el error a un servicio como Sentry o Crashlytics
    console.error("ZODI Global Error:", error);
  }, [error]);

  return (
    <AnimatedShell>
      <PublicNav />
      <div className="relative min-h-[100dvh] flex items-center justify-center p-4">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/zodi-art/oracle-frame-tall.webp"
            alt="Fondo de error"
            fill
            className="object-cover object-center opacity-10"
            sizes="100vw"
          />
        </div>
        <div className="spark-field -z-10" />

        <div className="text-center glass-panel p-8 md:p-12 rounded-2xl max-w-lg mx-auto relative border border-red-500/20 bg-red-500/5">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-3xl font-black mb-3 text-white">Hubo una disrupción cósmica</h1>
          
          <p className="text-white/60 mb-8 leading-relaxed">
            Las energías se han cruzado y algo salió mal. Tranquilo, tu perfil astral está a salvo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 font-bold hover:bg-red-500/30 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar de nuevo
            </button>
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-lime-300 text-black font-black hover:bg-lime-200 transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </AnimatedShell>
  );
}
