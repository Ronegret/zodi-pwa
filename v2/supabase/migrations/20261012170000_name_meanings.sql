-- Zodi v2 · Registro de nombres y apellidos. La app trae ~1.800 de serie; los
-- que faltan los investiga la IA la primera vez que alguien los escribe y se
-- guardan aquí para todos. Leer: cualquiera con sesión. Escribir: solo el
-- servidor (service role). Tope de 30 consultas nuevas al día por persona.

create table if not exists public.name_meanings (
  kind text not null check (kind in ('nombre', 'apellido')),
  key text not null check (key ~ '^[a-z]{2,30}$'),
  word text not null check (char_length(word) between 2 and 40),
  origin text not null check (char_length(origin) between 2 and 80),
  meaning text not null check (char_length(meaning) between 2 and 200),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  primary key (kind, key)
);

alter table public.name_meanings enable row level security;
revoke all on public.name_meanings from anon, authenticated;
grant select on public.name_meanings to authenticated;

drop policy if exists "name_meanings: leer con sesión" on public.name_meanings;
create policy "name_meanings: leer con sesión" on public.name_meanings
  for select to authenticated
  using (true);

create table if not exists public.name_lookups (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists name_lookups_user_created_idx
  on public.name_lookups (user_id, created_at desc);

alter table public.name_lookups enable row level security;
revoke all on public.name_lookups from anon, authenticated;

-- ¿Puede esta persona pedir otro nombre nuevo hoy? Si sí, lo apunta.
create or replace function public.claim_name_lookup()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if (select auth.uid()) is null then
    return false;
  end if;
  select count(*) into used
  from public.name_lookups l
  where l.user_id = (select auth.uid()) and l.created_at > now() - interval '1 day';
  if used >= 30 then
    return false;
  end if;
  insert into public.name_lookups (user_id) values ((select auth.uid()));
  return true;
end;
$$;

revoke all on function public.claim_name_lookup() from public, anon;
grant execute on function public.claim_name_lookup() to authenticated;
