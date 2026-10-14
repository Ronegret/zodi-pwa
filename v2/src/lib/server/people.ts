import type { Relation } from '@/lib/people/relations';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';
import type { PersonInput } from '@/lib/validation/people';

export interface Person {
  id: string;
  name: string;
  relation: Relation;
  birthDate: string;
  /** HH:MM o null. */
  birthTime: string | null;
  /** Favorita: sale primero (también en el panel). */
  favorite: boolean;
}

const COLUMNS = 'id, name, relation, birth_date, birth_time, favorite';
type Row = {
  id: string;
  name: string;
  relation: string;
  birth_date: string;
  birth_time: string | null;
  favorite: boolean;
};

const toPerson = (r: Row): Person => ({
  id: r.id,
  name: r.name,
  relation: r.relation as Relation,
  birthDate: r.birth_date,
  birthTime: r.birth_time ? r.birth_time.slice(0, 5) : null,
  favorite: Boolean(r.favorite),
});

export async function listPeople(supabase: ZodiSupabaseClient): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select(COLUMNS)
    .order('favorite', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(toPerson);
}

export async function getPerson(supabase: ZodiSupabaseClient, id: string): Promise<Person | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from('people').select(COLUMNS).eq('id', id).limit(1);
  if (error) throw error;
  return data?.[0] ? toPerson(data[0]) : null;
}

export type AddResult = { ok: true; id: string } | { ok: false; reason: 'limit' | 'error' };

export async function addPerson(
  supabase: ZodiSupabaseClient,
  input: PersonInput,
): Promise<AddResult> {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: input.name,
      relation: input.relation,
      birth_date: input.birth_date,
      birth_time: input.birth_time ?? null,
    })
    .select('id')
    .single();
  if (error)
    return { ok: false, reason: error.message.includes('people_limit') ? 'limit' : 'error' };
  return { ok: true, id: data.id };
}

export async function deletePerson(supabase: ZodiSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) throw error;
}

export async function setFavorite(supabase: ZodiSupabaseClient, id: string, favorite: boolean) {
  const { error } = await supabase.from('people').update({ favorite }).eq('id', id);
  if (error) throw error;
}

/**
 * Desde Ajustes → Sobre ti: la pareja y los hijos pasan a Tu gente (para ver
 * su signo y la afinidad). Si ya están (mismo nombre o la única pareja), se
 * actualiza su fecha; si no, se añaden.
 */
export async function syncFamily(
  supabase: ZodiSupabaseClient,
  family: {
    partner: { name: string; birth_date: string } | null;
    kids: { name: string; birth_date: string }[];
  },
): Promise<void> {
  const people = await listPeople(supabase);
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const upsert = async (relation: Relation, name: string, birth_date: string, match?: Person) => {
    if (match) {
      await supabase.from('people').update({ name, birth_date }).eq('id', match.id);
    } else {
      await supabase.from('people').insert({ name, relation, birth_date });
    }
  };
  if (family.partner) {
    const partners = people.filter((p) => p.relation === 'pareja');
    const match =
      partners.find((p) => same(p.name, family.partner!.name)) ??
      (partners.length === 1 ? partners[0] : undefined);
    await upsert('pareja', family.partner.name, family.partner.birth_date, match);
  }
  for (const kid of family.kids) {
    const match = people.find((p) => p.relation === 'hijo' && same(p.name, kid.name));
    await upsert('hijo', kid.name, kid.birth_date, match);
  }
}
