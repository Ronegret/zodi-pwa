import type { APIRoute } from 'astro';
import { unauthorized } from '@/lib/api/http';

/**
 * Descarga de tus datos (derecho de acceso y portabilidad, RGPD art. 15 y 20):
 * un JSON con tu perfil, tus cartas, tus lecturas, tu gente, tus logros y lo
 * que has publicado. Solo lo propio: la RLS de la base de datos lo garantiza.
 */
export const GET: APIRoute = async ({ locals }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return unauthorized();

  const [profile, charts, readings, people, achievements, posts, comments] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).limit(1),
    supabase.from('natal_charts').select('*').order('created_at'),
    supabase.from('readings').select('*').order('created_at'),
    supabase.from('people').select('*').order('created_at'),
    supabase.from('user_achievements').select('*'),
    supabase.from('community_posts').select('*').eq('author_id', user.id),
    supabase.from('comments').select('*').eq('author_id', user.id),
  ]);

  const body = {
    generado: new Date().toISOString(),
    aviso:
      'Estos son tus datos personales en ZODI (zodi.aibueno.es). Guárdalos con cuidado: contienen tu fecha de nacimiento.',
    cuenta: { id: user.id, correo: user.email ?? null, creada: user.created_at },
    perfil: profile.data?.[0] ?? null,
    cartas: charts.data ?? [],
    lecturas: readings.data ?? [],
    tu_gente: people.data ?? [],
    logros: achievements.data ?? [],
    publicaciones: posts.data ?? [],
    comentarios: comments.data ?? [],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="zodi-mis-datos-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
