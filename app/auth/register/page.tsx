import { AnimatedShell } from "@/components/AnimatedShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { PublicNav } from "@/components/public/PublicNav";
import { AuthRedirect } from "@/components/public/AuthRedirect";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <AnimatedShell>
      <PublicNav />
      <section className="relative flex min-h-[calc(100vh-68px)] flex-col items-center px-3 py-8 sm:px-4 sm:py-12">
        <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/zodi-us.png')] bg-cover bg-center opacity-35" />
        <div className="spark-field -z-10" />
        <div className="my-auto w-full max-w-xl">
          <Suspense fallback={<div className="h-96 flex items-center text-white/50">Cargando...</div>}>
            <AuthForm mode="register" />
          </Suspense>
        </div>
      </section>
    </AnimatedShell>
  );
}
