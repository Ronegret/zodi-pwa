/**
 * Investigar un nombre o apellido que ZODI no trae de serie: primero la
 * caché compartida (name_meanings); si no está, la IA (con tope diario por
 * persona) y se guarda para todos.
 */
import { aiAvailable, generate } from '@/lib/ai/client';
import { knownEntry, norm } from '@/lib/names/meaning';
import { parseEntry } from '@/lib/names/parse';
import type { NameEntry } from '@/lib/names/dictionary';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';

export type Kind = 'nombre' | 'apellido';
export type LookupResult =
  | { status: 'ok'; entry: NameEntry; source: 'zodi' | 'ia' }
  | { status: 'unknown' | 'limit' | 'unavailable' };

const SYSTEM = `Eres experto en onomástica hispana (etimología de nombres y apellidos). Escribes en español neutro, claro y breve.
Devuelves SOLO un objeto JSON válido, sin texto alrededor: {"o": "origen (máx. 60 caracteres)", "m": "significado (máx. 140, sin punto final)", "n": "curiosidad opcional (máx. 140)"}
Reglas: exactitud ante todo; si la etimología no es segura, di «de origen discutido: …». "n" solo si es un dato conocido y comprobable; si no, omítelo. Para apellidos indica el tipo (patronímico, toponímico, de oficio, apodo…) y la lengua; en mapuches, quechuas, aimaras o mayas explica las partes. Si la palabra no es un nombre ni un apellido real, devuelve {"o": "desconocido", "m": "desconocido"}.`;

export async function lookupName(
  supabase: ZodiSupabaseClient,
  kind: Kind,
  word: string,
): Promise<LookupResult> {
  const key = norm(word);
  if (!/^[a-z]{2,30}$/.test(key)) return { status: 'unknown' };
  const known = knownEntry(kind, key);
  if (known) return { status: 'ok', entry: known, source: 'zodi' };

  const { data: cached } = await supabase
    .from('name_meanings')
    .select('origin, meaning, note')
    .eq('kind', kind)
    .eq('key', key)
    .limit(1);
  const row = cached?.[0];
  if (row) {
    const entry: NameEntry = row.note
      ? { origin: row.origin, meaning: row.meaning, note: row.note }
      : { origin: row.origin, meaning: row.meaning };
    return { status: 'ok', entry, source: 'ia' };
  }

  const admin = createSupabaseAdminClient();
  if (!aiAvailable() || !admin) return { status: 'unavailable' };
  const { data: allowed } = await supabase.rpc('claim_name_lookup');
  if (!allowed) return { status: 'limit' };

  let text = '';
  try {
    await generate(
      [SYSTEM],
      [
        {
          role: 'user',
          content: `${kind === 'nombre' ? 'Nombre de pila' : 'Apellido'}: ${word.trim().slice(0, 30)}`,
        },
      ],
      300,
      (t) => {
        text += t;
      },
      undefined,
      { tier: 'deep' },
    );
  } catch (error) {
    console.error('[nombre] generación fallida', error);
    return { status: 'unavailable' };
  }
  const entry = parseEntry(text);
  if (!entry) return { status: 'unknown' };
  const display = word.trim().slice(0, 40);
  await admin.from('name_meanings').upsert({
    kind,
    key,
    word: display.charAt(0).toUpperCase() + display.slice(1),
    origin: entry.origin,
    meaning: entry.meaning,
    note: entry.note ?? null,
  });
  return { status: 'ok', entry, source: 'ia' };
}
