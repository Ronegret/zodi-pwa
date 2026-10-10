import type { z } from 'zod';
import { fieldErrors } from '@/lib/validation/common';

export type ApiErrorCode =
  | 'bad_request'
  | 'validation_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'unsupported_media_type'
  | 'quota_exceeded'
  | 'unavailable'
  | 'internal';

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string> };
}
export interface ApiOkBody<T> {
  data: T;
}

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data } satisfies ApiOkBody<T>, { status, headers: NO_STORE });
}

export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): Response {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  return Response.json(body, { status, headers: NO_STORE });
}

export const unauthorized = () => fail(401, 'unauthorized', 'Necesitas iniciar sesión.');
export const unavailable = () =>
  fail(503, 'unavailable', 'Servicio no disponible. Vuelve en un rato.');
/** Error interno: se registra en el servidor, al cliente no le llegan detalles. */
export function internal(context: string, cause: unknown): Response {
  console.error(`[api] ${context}`, cause);
  return fail(500, 'internal', 'Algo se ha torcido. Inténtalo de nuevo.');
}

/** Lee y valida un cuerpo JSON. Devuelve los datos o la respuesta de error lista. */
export async function readJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: Response }> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json')) {
    return {
      ok: false,
      response: fail(415, 'unsupported_media_type', 'Envía JSON (application/json).'),
    };
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: fail(400, 'bad_request', 'El cuerpo no es JSON válido.') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: fail(
        422,
        'validation_failed',
        'Revisa los datos enviados.',
        fieldErrors(parsed.error),
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
