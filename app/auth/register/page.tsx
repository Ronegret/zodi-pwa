import { AnimatedShell } from "@/components/AnimatedShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { PublicNav } from "@/components/public/PublicNav";

export default function RegisterPage() {
  return (
    <AnimatedShell>
      <PublicNav />
      <section className="relative grid min-h-[calc(100vh-68px)] place-items-center overflow-hidden px-4 py-10">
        <div className="absolute inset-0 -z-10 bg-[url('/zodi-art/zodi-us.png')] bg-cover bg-center opacity-35" />
        <div className="spark-field -z-10" />
        <AuthForm mode="register" />
      </section>
    </AnimatedShell>
  );
}
