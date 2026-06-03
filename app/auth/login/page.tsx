import { AnimatedShell } from "@/components/AnimatedShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { PublicNav } from "@/components/public/PublicNav";
import { Suspense } from "react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <AnimatedShell>
      <PublicNav />
      <section className="relative flex min-h-[100dvh] flex-col items-center px-3 py-8 sm:px-4 sm:py-12 pt-20">
        <div className="absolute inset-0 -z-20">
          <Image
            src="/zodi-art/tarot-reader.webp"
            alt="Fondo Tarot ZODI"
            fill
            className="object-cover object-center opacity-35"
            priority
            sizes="100vw"
            quality={60}
          />
        </div>
        <div className="spark-field -z-10" />
        <div className="my-auto w-full max-w-xl">
          <Suspense fallback={<div className="h-96 flex items-center text-white/50">Cargando...</div>}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </section>
    </AnimatedShell>
  );
}
