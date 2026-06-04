import { AnimatedShell } from "@/components/AnimatedShell";
import { NeonSwitchLogin } from "@/components/auth/NeonSwitchLogin";
import { PublicNav } from "@/components/public/PublicNav";
import { Suspense } from "react";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <AnimatedShell>
      <PublicNav />
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-3 pt-20 pb-6 sm:pt-24 sm:pb-8">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/zodi-art/zodi-us.webp"
            alt="ZODI Registro"
            fill
            className="object-cover object-center opacity-20"
            priority
            sizes="100vw"
            quality={60}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />
        </div>
        <div className="w-full max-w-[380px]">
          <Suspense fallback={
            <div className="flex items-center justify-center py-24 text-white/40 text-sm">
              Cargando...
            </div>
          }>
            <NeonSwitchLogin mode="register" />
          </Suspense>
        </div>
      </section>
    </AnimatedShell>
  );
}
