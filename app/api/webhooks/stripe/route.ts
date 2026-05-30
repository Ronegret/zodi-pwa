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

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const uid = session.metadata?.uid;
      const gemsStr = session.metadata?.gems;
      
      if (uid && gemsStr) {
        const gems = parseInt(gemsStr, 10);
        
        try {
          const adminDb = await getFirebaseAdmin();
          if (adminDb) {
            const gamificationRef = adminDb.collection("gamification").doc(uid);
            await adminDb.runTransaction(async (t: any) => {
              const doc = await t.get(gamificationRef);
              const currentGems = doc.exists ? (doc.data().gems ?? 0) : 0;
              t.set(gamificationRef, { 
                gems: currentGems + gems,
                lastUpdated: FieldValue.serverTimestamp() 
              }, { merge: true });
            });
            console.log(`Successfully added ${gems} gems to user ${uid}`);
          } else {
            console.warn("Firebase Admin not configured. Cannot give gems.");
          }
        } catch (e) {
          console.error("Error fulfilling order:", e);
        }
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
