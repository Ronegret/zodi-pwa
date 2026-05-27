import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_123", {
  apiVersion: "2024-04-10" as any,
});

export async function POST(req: Request) {
  try {
    const { uid, email, packId } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "No UID provided" }, { status: 400 });
    }

    // Define the products
    const packs: Record<string, { name: string, price: number, gems: number }> = {
      "crisis": { name: "Pack Crisis (50 Gemas)", price: 199, gems: 50 },
      "mistico": { name: "Pack Místico (200 Gemas)", price: 499, gems: 200 }
    };

    const selectedPack = packs[packId] ?? packs["crisis"];

    // Set up the Stripe session
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
              images: ["https://zodi.aibueno.es/zodi-logo-mark.png"],
            },
            unit_amount: selectedPack.price, // in cents (1.99 EUR)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard?payment=success&gems=${selectedPack.gems}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/premium?payment=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
