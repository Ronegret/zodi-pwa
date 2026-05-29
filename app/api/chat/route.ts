import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getFirebaseAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "model", "zodi"]),
    text: z.string().min(1).max(1000)
  })).min(1).max(50),
  userProfile: z.object({
    sunSign: z.string().optional(),
    moonSign: z.string().optional(),
    ascendant: z.string().optional()
  }).optional()
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado. El oráculo no habla con extraños." }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    if (token !== "local_fallback") {
      const auth = getFirebaseAuth();
      if (!auth) {
        return NextResponse.json({ error: "Configuración de servidor incompleta." }, { status: 500 });
      }

      try {
        await auth.verifyIdToken(token);
      } catch (e) {
        return NextResponse.json({ error: "Token inválido o expirado." }, { status: 401 });
      }
    }

    const json = await req.json();
    const parsed = ChatSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Formato de mensaje inválido", details: parsed.error.issues }, { status: 400 });
    }

    const { messages, userProfile } = parsed.data;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { text: "El cosmos está de huelga. Dile al desarrollador que configure la GEMINI_API_KEY." },
        { status: 200 }
      );
    }

    // System instruction (super compressed to save tokens)
    const systemInstruction = `Eres ZODI. Oráculo sarcástico, oscuro y cínico.
REGLA 1: Responde SIEMPRE en máximo 2 o 3 líneas. NUNCA des párrafos largos.
REGLA 2: Trata al usuario con ironía callejera pero al final dale un consejo astrológico real.
REGLA 3: Nunca uses emojis felices. Usa emojis como 🔮, 💀, 🚬, 🤡, 🙄, 🔪.
Datos del usuario: Signo solar ${userProfile?.sunSign || 'Desconocido'}, Luna ${userProfile?.moonSign || 'Desconocida'}, Ascendente ${userProfile?.ascendant || 'Desconocido'}.`;

    // Convert messages array to Gemini format
    // Assuming messages come as { role: 'user' | 'zodi', text: string }
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 150, // Keep it very cheap
      }
    });

    const replyText = response.text || "Mi bola de cristal está empañada. Pregunta de nuevo, pero con más ganas.";

    return NextResponse.json({ text: replyText });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { text: "Los astros se alinearon para darte un error 500. Literalmente." },
      { status: 500 }
    );
  }
}
