import type { APIRoute } from 'astro';
import { ok } from '@/lib/api/http';

/** Comprobación de vida para monitores. Pública: no revela configuración. */
export const GET: APIRoute = () => ok({ status: 'ok' });
