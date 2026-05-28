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
<div style="background-color: #060608; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0c; border: 2px solid #b8ff17; border-radius: 16px; overflow: hidden; box-shadow: 0 0 20px rgba(184, 255, 23, 0.2);">
    
    <!-- HEADER LOGO -->
    <div style="width: 100%; text-align: center; background-color: #000000; padding: 30px 0; border-bottom: 1px solid rgba(184, 255, 23, 0.2);">
      <img src="https://zodi.aibueno.es/zodi-logo-mark.png" alt="ZODI" style="height: 60px; object-fit: contain;">
    </div>
    
    <!-- BANNER IMAGE -->
    <div style="width: 100%; height: 200px; background-color: #111; overflow: hidden; position: relative;">
      <img src="https://zodi.aibueno.es/zodi-art/ritual-wide.png" alt="Cyberpunk" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
    </div>

    <!-- CONTENT -->
    <div style="padding: 40px 30px; text-align: center;">
      <h2 style="color: #b8ff17; font-size: 24px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 20px;">Tu Veredicto Diario</h2>
      
      <div style="background-color: rgba(184, 255, 23, 0.05); border-left: 4px solid #b8ff17; padding: 25px; margin-bottom: 35px; text-align: left; border-radius: 0 8px 8px 0;">
        <p style="font-size: 18px; line-height: 1.6; color: #eeeeee; margin: 0; font-style: italic;">
          "${horoscopeText}"
        </p>
      </div>

      <!-- BUTTON -->
      <a href="https://zodi.aibueno.es/dashboard" style="display: inline-block; background-color: #b8ff17; color: #000000; text-decoration: none; padding: 16px 32px; font-weight: 900; font-size: 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">Entrar al Oráculo</a>
    </div>

    <!-- FOOTER -->
    <div style="background-color: #000000; padding: 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
      <img src="https://zodi.aibueno.es/zodi-logo-mark.png" alt="ZODI" style="height: 20px; opacity: 0.3; margin-bottom: 10px;">
      <p style="margin: 0; font-size: 11px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">
        ZODI AI © 2026. El universo es caótico, nosotros también.
        <br><br>
        Recibes esto porque invocaste el Caos Diario. Puedes desactivarlo en el portal.
      </p>
    </div>
  </div>
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
