-- Zodi v2 · Tu gente: favoritos (salen primero) y "hijo/a" como relación
-- propia (se rellena desde Ajustes → Sobre ti).

alter table public.people add column if not exists favorite boolean not null default false;

alter table public.people drop constraint if exists people_relation_check;
alter table public.people
  add constraint people_relation_check
  check (relation in ('pareja', 'hijo', 'familia', 'amistad', 'trabajo', 'otra'));

grant insert (favorite) on public.people to authenticated;
grant update (favorite) on public.people to authenticated;

create index if not exists people_user_favorite_idx
  on public.people (user_id, favorite desc, created_at);
