import { AnimatedShell } from "@/components/AnimatedShell";
import { NeonSwitchLogin } from "@/components/auth/NeonSwitchLogin";
import { PublicNav } from "@/components/public/PublicNav";
import { Suspense } from "react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <AnimatedShell>
      <PublicNav />

      {/* Fondo */}
      <div className="fixed inset-0 -z-20">
        <Image
          src="/zodi-art/tarot-reader.webp"
          alt="Fondo ZODI"
          fill
          className="object-cover object-center opacity-20"
          priority
          sizes="100vw"
          quality={60}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.88)_100%)]" />
      </div>

      <main className="relative flex min-h-[100dvh] flex-col items-center justify-start px-4 pt-24 pb-12">
        <Suspense fallback={
          <div className="flex items-center justify-center py-24 text-white/40 text-sm">
            Cargando...
          </div>
        }>
          <NeonSwitchLogin mode="login" />
        </Suspense>
      </main>
    </AnimatedShell>
  );
}
