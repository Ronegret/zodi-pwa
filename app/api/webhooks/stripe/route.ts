import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10" as any,
  });
}

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Missing Stripe Webhook Secret" }, { status: 500 });
      }
      console.warn("Stripe webhook secret not configured, skipping signature verification.");
      event = JSON.parse(payload);
    } else {
      const stripe = getStripe();
      if (!stripe) {
        return NextResponse.json({ error: "Missing Stripe Secret Key" }, { status: 500 });
      }
      event = stripe.webhooks.constructEvent(payload, sig!, process.env.STRIPE_WEBHOOK_SECRET);
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  const adminDb = await getFirebaseAdmin();

  // Handle the event
  switch (event.type) {

    // ── Compra completada (gemas one-time O pago inicial de suscripción pioneer) ──
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      const gemsStr = session.metadata?.gems;
      const planId = session.metadata?.planId;

      if (!uid) break;

      try {
        if (adminDb) {
          // Caso A: compra de gemas
          if (gemsStr) {
            const gems = parseInt(gemsStr, 10);
            const gamificationRef = adminDb.collection("gamification").doc(uid);
            await adminDb.runTransaction(async (t: any) => {
              const doc = await t.get(gamificationRef);
              const currentGems = doc.exists ? (doc.data().gems ?? 0) : 0;
              t.set(gamificationRef, {
                gems: currentGems + gems,
                lastUpdated: FieldValue.serverTimestamp(),
              }, { merge: true });
            });
            console.log(`[ZODI] +${gems} gems → ${uid}`);
          }

          // Caso B: pase pionero (pago único — activa plan vip)
          if (planId === "pioneer") {
            await adminDb.collection("users").doc(uid).set({
              plan: "vip",
              subscribedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`[ZODI] Pioneer plan activated → ${uid}`);
          }
        }
      } catch (e) {
        console.error("[ZODI] Error fulfilling checkout:", e);
      }
      break;
    }

    // ── Suscripción activada o renovada ──────────────────────────────────────
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.uid;
      const planId = sub.metadata?.planId;
      if (!uid || !adminDb) break;

      const isActive = sub.status === "active" || sub.status === "trialing";
      const plan = isActive ? "premium" : "free";

      try {
        await adminDb.collection("users").doc(uid).set({
          plan,
          stripeSubscriptionId: sub.id,
          stripeSubscriptionStatus: sub.status,
          subscribedAt: isActive ? FieldValue.serverTimestamp() : null,
          planId: planId ?? null,
        }, { merge: true });
        console.log(`[ZODI] Subscription ${sub.status} → ${uid} → plan:${plan}`);
      } catch (e) {
        console.error("[ZODI] Error updating subscription:", e);
      }
      break;
    }

    // ── Suscripción cancelada o expirada ─────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.uid;
      if (!uid || !adminDb) break;

      try {
        await adminDb.collection("users").doc(uid).set({
          plan: "free",
          stripeSubscriptionId: null,
          stripeSubscriptionStatus: "canceled",
        }, { merge: true });
        console.log(`[ZODI] Subscription canceled → ${uid}`);
      } catch (e) {
        console.error("[ZODI] Error on subscription cancel:", e);
      }
      break;
    }

    default:
      console.log(`[ZODI] Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
