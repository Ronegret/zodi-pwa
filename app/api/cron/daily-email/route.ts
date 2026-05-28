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
<body style="margin: 0; padding: 0; background-color: #060608; font-family: Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#060608" style="background-color: #060608;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0a0a0c; border: 1px solid #333333; border-radius: 12px; overflow: hidden;">
          <tr>
            <td align="center" style="background-color: #000000; padding: 30px 20px; border-bottom: 2px solid #9b4dff;">
              <img src="https://zodi.aibueno.es/zodi-logo-mark.png" alt="ZODI" width="160" style="display: block; margin: 0 auto;">
              <p style="color: #b8ff17; font-size: 13px; font-weight: bold; letter-spacing: 4px; margin: 15px 0 0 0; text-transform: uppercase;">La Verdad Sin Filtros</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #000000;">
              <img src="https://zodi.aibueno.es/zodi-art/zodi-character-full.png" alt="ZODI" width="600" style="display: block; width: 100%; max-width: 600px; opacity: 0.9;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 30px; background-color: #050505;">
              <h2 style="color: #9b4dff; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 25px 0; font-weight: 800;">TUS ASTROS HOY</h2>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="border-left: 4px solid #b8ff17; background-color: #12121a; padding: 25px; border-radius: 0 8px 8px 0;">
                    <p style="color: #ffffff; font-size: 18px; line-height: 1.7; margin: 0; font-weight: 400;">
                      "${horoscopeText}"
                    </p>
                  </td>
                </tr>
              </table>
              <br><br>
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" bgcolor="#b8ff17" style="border-radius: 30px;">
                    <a href="https://zodi.aibueno.es/dashboard" target="_blank" style="font-size: 16px; font-weight: 800; color: #000000; text-decoration: none; padding: 18px 36px; display: inline-block; text-transform: uppercase; letter-spacing: 2px;">
                      IR AL DASHBOARD
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 30px; background-color: #0e0e14; border-top: 1px solid #222222;">
              <h3 style="color: #b8ff17; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 30px 0; font-weight: 800;">DESBLOQUEA TODO EL PODER DE ZODI</h3>
              <p style="color: #dddddd; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                ZODI no es solo un horóscopo. Es una inteligencia artificial esotérica capaz de leer tu destino con precisión quirúrgica y una actitud implacable. En nuestra plataforma web puedes acceder a:
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: left;">
                <tr>
                  <td width="50" valign="top" style="padding-bottom: 25px;">
                    <img src="https://zodi.aibueno.es/zodi-art/sections/tarot-acido.png" width="40" style="display:block; border-radius: 8px;">
                  </td>
                  <td valign="top" style="padding-bottom: 25px; padding-left: 15px;">
                    <h4 style="color: #9b4dff; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase;">Tarot Ácido</h4>
                    <p style="color: #bbbbbb; font-size: 14px; margin: 0; line-height: 1.5;">Tiradas de 1 a 3 cartas y Cruz Celta. ZODI interpreta el tarot sin piedad y sin filtros. Las cartas te dirán lo que necesitas oír, no lo que quieres.</p>
                  </td>
                </tr>
                <tr>
                  <td width="50" valign="top" style="padding-bottom: 25px;">
                    <img src="https://zodi.aibueno.es/zodi-art/sections/compatibilidad.png" width="40" style="display:block; border-radius: 8px;">
                  </td>
                  <td valign="top" style="padding-bottom: 25px; padding-left: 15px;">
                    <h4 style="color: #b8ff17; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase;">Compatibilidad Tóxica</h4>
                    <p style="color: #bbbbbb; font-size: 14px; margin: 0; line-height: 1.5;">¿Tu crush te va a arruinar la vida? Analizamos la energía entre ambos signos para darte un veredicto definitivo sobre tu relación.</p>
                  </td>
                </tr>
                <tr>
                  <td width="50" valign="top" style="padding-bottom: 25px;">
                    <img src="https://zodi.aibueno.es/zodi-art/sections/carta-natal.png" width="40" style="display:block; border-radius: 8px;">
                  </td>
                  <td valign="top" style="padding-bottom: 25px; padding-left: 15px;">
                    <h4 style="color: #9b4dff; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase;">Análisis Astral Profundo</h4>
                    <p style="color: #bbbbbb; font-size: 14px; margin: 0; line-height: 1.5;">Lectura de manos, numerología, y desgloses de Carta Natal Express. Descubre por qué eres como eres.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 20px; background-color: #050505; border-top: 2px solid #b8ff17;">
              <img src="https://zodi.aibueno.es/zodi-logo.png" alt="ZODI" width="100" style="display: block; margin: 0 auto; opacity: 0.6;">
              <p style="color: #666666; font-size: 12px; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px; line-height: 1.5;">
                zodi.aibueno.es - La nueva era de la astrología<br><br>
                ESTÁS RECIBIENDO ESTO PORQUE ACTIVASTE EL ORÁCULO DIARIO.<br>
                SI NO SOPORTAS LA VERDAD, PUEDES DESUSCRIBIRTE EN LA WEB.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
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
