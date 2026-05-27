import { Crown } from "lucide-react";
import { plans } from "@/lib/data";

export function PremiumPlans() {
  return (
    <section className="mt-5">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.32em] text-yellow-200/70">Planes</p>
        <h2 className="text-2xl font-black">Más lecturas cuando quieras profundizar</h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="glass-panel rounded-md p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/55">{plan.signal}</p>
                <h3 className="mt-1 text-2xl font-black">{plan.name}</h3>
              </div>
              <Crown className="h-6 w-6 text-yellow-200" />
            </div>
            <p className="mt-4 text-4xl font-black graffiti">{plan.price}</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {plan.perks.map((perk) => (
                <li key={perk} className="rounded-md border border-white/10 bg-black/20 p-3">{perk}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
