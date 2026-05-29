import { AnimatedShell } from "@/components/AnimatedShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { PublicNav } from "@/components/public/PublicNav";
import { AuthRedirect } from "@/components/public/AuthRedirect";

export default function LoginPage() {
  return (
    <AnimatedShell>
      <AuthRedirect />
      <PublicNav />
      <section className="relative grid min-h-[calc(100vh-68px)] place-items-center overflow-hidden px-3 py-4 sm:px-4 sm:py-10">
        <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/tarot-reader.png')] bg-cover bg-center opacity-35" />
        <div className="spark-field -z-10" />
        <AuthForm mode="login" />
      </section>
    </AnimatedShell>
  );
}
