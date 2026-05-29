import Link from 'next/link';
import { AnimatedShell } from '@/components/AnimatedShell';
import { PublicNav } from '@/components/public/PublicNav';
import { Sparkles, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <AnimatedShell>
      <PublicNav />
      <div className="relative min-h-[calc(100vh-68px)] flex items-center justify-center p-4">
        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/oracle-frame-tall.png')] bg-cover bg-center opacity-10" />
        <div className="spark-field -z-10" />

        <div className="text-center glass-panel p-8 md:p-12 rounded-2xl max-w-lg mx-auto relative overflow-hidden border border-white/10">
          {/* Glitch effect on 404 */}
          <div className="relative inline-block mb-6">
            <h1 className="text-7xl md:text-9xl font-black text-lime-300 drop-shadow-[0_0_30px_rgba(184,255,23,0.4)] glitch relative z-10">404</h1>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Te perdiste en el hiperespacio cósmico</h2>
          
          <p className="text-white/60 mb-8 leading-relaxed">
            Las cartas no muestran nada en esta línea temporal. La página que buscas fue consumida por un agujero negro o nunca existió.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-lime-300 text-black font-black hover:bg-lime-200 transition flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Volver a la Tierra
            </Link>
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Ir al Oráculo
            </Link>
          </div>
        </div>
      </div>
    </AnimatedShell>
  );
}
