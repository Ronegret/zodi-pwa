import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase/admin";
import { sendZodiEmail } from "@/lib/email";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const adminDb = await getFirebaseAdmin();
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
    }

    const snapshot = await adminDb.collection("users").where("emailSubscribed", "==", true).get();
    if (snapshot.empty) {
      return NextResponse.json({ message: "No subscribed users found" });
    }

    const emailsSent: string[] = [];
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    for (const doc of snapshot.docs) {
      const user = doc.data();
      if (!user.email) continue;

      const sign = user.profile?.sunSign || "Desconocido";
      const name = user.displayName || "Mortal";

      let horoscopeText = "Las estrellas están confusas hoy, pero tú sigues siendo un caos.";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Genera un horóscopo súper corto (2 oraciones máximo) y muy directo para ${name}, que es de signo ${sign}. Tono: sarcástico, místico, ácido. No uses introducciones.`
        });
        if (response.text) {
          horoscopeText = response.text;
        }
      } catch (e) {}

      const htmlTemplate = `
        <div style="font-family: 'Courier New', Courier, monospace; background-color: #000; color: #fff; padding: 30px; border-radius: 10px; text-align: center; max-width: 600px; margin: 0 auto; border: 1px solid #c0ff00;">
          <h1 style="color: #c0ff00; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">ZODI <span style="font-size: 14px; color: #888;">Oráculo Diario</span></h1>
          <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
          <p style="font-size: 16px; line-height: 1.5; color: #eee; margin-bottom: 30px;">
            ${horoscopeText}
          </p>
          <a href="https://zodi.aibueno.es/dashboard" style="display: inline-block; background-color: #c0ff00; color: #000; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 5px; text-transform: uppercase;">Abrir el Portal</a>
          <p style="margin-top: 40px; font-size: 10px; color: #555;">
            Estás recibiendo esto porque pediste el caos diario. Si no lo soportas, puedes desactivarlo en tu perfil de ZODI.
          </p>
        </div>
      `;

      await sendZodiEmail({
        to: user.email,
        subject: `🔮 ZODI: Tu veredicto de hoy (${sign})`,
        html: htmlTemplate,
      });

      emailsSent.push(user.email);
    }

    return NextResponse.json({ success: true, sentTo: emailsSent });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to run daily email cron" }, { status: 500 });
  }
}
