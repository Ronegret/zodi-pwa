import type { APIRoute } from 'astro';
import { aiAvailable } from '@/lib/ai/client';
import { ok } from '@/lib/api/http';

/**
 * Comprobación de vida para monitores. Pública: solo dice si cada pieza está
 * configurada (sí/no), nunca valores ni claves.
 */
export const GET: APIRoute = () => ok({ status: 'ok', ia: aiAvailable() });
