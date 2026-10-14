-- Zodi v2 · Tu gente: familia, pareja, amistades y trabajo con su fecha de
-- nacimiento, para ver la afinidad y cómo está el día entre vosotros. No son
-- cuentas: son fichas privadas de quien las crea (nadie más las ve).

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  relation text not null check (relation in ('pareja', 'familia', 'amistad', 'trabajo', 'otra')),
  birth_date date not null check (birth_date >= date '1900-01-01'),
  birth_time time,
  created_at timestamptz not null default now()
);

create index if not exists people_user_created_idx on public.people (user_id, created_at);

alter table public.people enable row level security;

revoke all on public.people from anon, authenticated;
grant select, delete on public.people to authenticated;
grant insert (user_id, name, relation, birth_date, birth_time) on public.people to authenticated;
grant update (name, relation, birth_date, birth_time) on public.people to authenticated;

drop policy if exists "people: leer las propias" on public.people;
create policy "people: leer las propias" on public.people
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "people: crear las propias" on public.people;
create policy "people: crear las propias" on public.people
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "people: editar las propias" on public.people;
create policy "people: editar las propias" on public.people
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "people: borrar las propias" on public.people;
create policy "people: borrar las propias" on public.people
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Tope por persona usuaria: 50 fichas.
create or replace function public.people_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.people p where p.user_id = new.user_id) >= 50 then
    raise exception 'people_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.people_limit() from public, anon, authenticated;

drop trigger if exists people_limit on public.people;
create trigger people_limit
  before insert on public.people
  for each row execute function public.people_limit();
