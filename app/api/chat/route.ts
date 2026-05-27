import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, userProfile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

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
