/**
 * Lectura del stream NDJSON en el navegador. Cada línea es un evento; el
 * último trozo puede llegar partido entre dos lecturas del body.
 */
import type { StreamEvent } from '@/lib/server/readings';

export async function readEvents(
  response: Response,
  onEvent: (e: StreamEvent) => void,
): Promise<void> {
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onEvent(JSON.parse(line) as StreamEvent);
    }
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as StreamEvent);
}

/** Mensaje de error de la API (JSON) o uno genérico con estilo. */
export async function errorMessage(
  response: Response,
): Promise<{ message: string; fields?: Record<string, string> }> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; fields?: Record<string, string> };
    };
    if (body.error?.message)
      return {
        message: body.error.message,
        ...(body.error.fields ? { fields: body.error.fields } : {}),
      };
  } catch {
    // Respuesta sin JSON: mensaje genérico.
  }
  return { message: 'Algo se ha torcido en el más allá. Inténtalo otra vez.' };
}
