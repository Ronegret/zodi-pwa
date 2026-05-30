import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirebaseAuth } from "@/lib/firebase/admin";
import { z } from "zod";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10" as any,
  });
}

const CheckoutSchema = z.object({
  uid: z.string().min(5),
  email: z.string().email(),
  packId: z.string().min(1)
});

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
    } catch (e) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = CheckoutSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const { uid, email, packId } = parsed.data;

    // Verificar que el usuario que paga es el mismo del token
    if (decodedToken.uid !== uid) {
      return NextResponse.json({ error: "UID mismatch" }, { status: 403 });
    }

    // Define the products
    const packs: Record<string, { name: string, price: number, gems: number }> = {
      "crisis": { name: "Pack Crisis (50 Gemas)", price: 199, gems: 50 },
      "mistico": { name: "Pack Místico (200 Gemas)", price: 499, gems: 200 }
    };

    const selectedPack = packs[packId] ?? packs["crisis"];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const productImages = siteUrl.startsWith("https://") ? [`${siteUrl}/zodi-logo.png`] : undefined;

    // Set up the Stripe session
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe no está configurado" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "bizum"],
      customer_email: email,
      metadata: {
        uid,
        packId,
        gems: selectedPack.gems.toString()
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: selectedPack.name,
              description: `Añade ${selectedPack.gems} Gemas a tu cuenta ZODI para consultar el oráculo libremente.`,
              images: productImages,
            },
            unit_amount: selectedPack.price, // in cents (1.99 EUR)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/dashboard?payment=success&gems=${selectedPack.gems}`,
      cancel_url: `${siteUrl}/dashboard/premium?payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
