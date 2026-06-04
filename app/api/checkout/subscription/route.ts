import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirebaseAuth } from "@/lib/firebase/admin";
import { z } from "zod";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any });
}

const SubscriptionSchema = z.object({
  uid: z.string().min(5),
  email: z.string().email(),
  planId: z.enum(["pro_monthly", "pro_annual", "pioneer"]),
});

// IDs de precio — configurar en .env.local con los price IDs reales de Stripe
const PLAN_PRICES: Record<string, { priceId: string | null; name: string; trialDays?: number }> = {
  pro_monthly: {
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    name: "ZODI Pro Mensual",
    trialDays: 7,
  },
  pro_annual: {
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? null,
    name: "ZODI Pro Anual",
    trialDays: 7,
  },
  pioneer: {
    priceId: process.env.STRIPE_PRICE_PIONEER ?? null,
    name: "Pase Pionero",
  },
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getFirebaseAuth();
    if (!auth) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = SubscriptionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { uid, email, planId } = parsed.data;
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "UID mismatch" }, { status: 403 });
    }

    const plan = PLAN_PRICES[planId];
    if (!plan.priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${planId}. Add STRIPE_PRICE_${planId.toUpperCase()} to .env.local` },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no está configurado" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const isPioneer = planId === "pioneer";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "bizum"],
      customer_email: email,
      metadata: { uid, planId },
      line_items: [{ price: plan.priceId, quantity: 1 }],
      mode: isPioneer ? "payment" : "subscription",
      ...(isPioneer
        ? {}
        : {
            subscription_data: {
              trial_period_days: plan.trialDays,
              metadata: { uid, planId },
            },
          }),
      success_url: `${siteUrl}/dashboard?payment=success&plan=${planId}`,
      cancel_url: `${siteUrl}/dashboard/premium?payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("[ZODI] Subscription checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
