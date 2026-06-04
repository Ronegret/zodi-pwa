import { AnimatedShell } from "@/components/AnimatedShell";
import { NeonSwitchLogin } from "@/components/auth/NeonSwitchLogin";
import { PublicNav } from "@/components/public/PublicNav";
import Image from "next/image";

export default function LoginPage() {
  return (
    <AnimatedShell>
      <PublicNav />
      <section className="relative flex min-h-[100dvh] flex-col items-center px-3 py-8 sm:px-4 sm:py-12 pt-20">
        {/* Fondo de sala oscura */}
        <div className="absolute inset-0 -z-20">
          <Image
            src="/zodi-art/tarot-reader.webp"
            alt="Fondo Tarot ZODI"
            fill
            className="object-cover object-center opacity-20"
            priority
            sizes="100vw"
            quality={60}
          />
          {/* Vignette extra para dar sensación de oscuridad */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)]" />
        </div>
        <div className="spark-field -z-10" />
        <div className="my-auto w-full max-w-xl">
          <NeonSwitchLogin mode="login" />
        </div>
      </section>
    </AnimatedShell>
  );
}
