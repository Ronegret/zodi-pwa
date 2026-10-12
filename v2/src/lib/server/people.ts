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
}

const COLUMNS = 'id, name, relation, birth_date, birth_time';
type Row = {
  id: string;
  name: string;
  relation: string;
  birth_date: string;
  birth_time: string | null;
};

const toPerson = (r: Row): Person => ({
  id: r.id,
  name: r.name,
  relation: r.relation as Relation,
  birthDate: r.birth_date,
  birthTime: r.birth_time ? r.birth_time.slice(0, 5) : null,
});

export async function listPeople(supabase: ZodiSupabaseClient): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select(COLUMNS)
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
