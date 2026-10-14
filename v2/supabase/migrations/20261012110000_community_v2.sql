-- Zodi v2 · Comunidad: temas, reacciones, signo del autor, denuncias y feed.
-- Idempotente (se reaplica entera en los tests).

-- ---------- Tema de cada post ----------
alter table public.community_posts add column if not exists topic text not null default 'general';

do $$ begin
  alter table public.community_posts add constraint community_posts_topic_chk
    check (topic in ('general', 'amor', 'trabajo', 'dinero', 'confesion', 'pregunta'));
exception when duplicate_object then null; end $$;

grant insert (body, topic) on table public.community_posts to authenticated;

create index if not exists community_posts_topic_created_idx
  on public.community_posts (topic, created_at desc)
  where status = 'published';

-- ---------- Signo solar en el perfil (tarjeta pública) ----------
-- Lo mantiene un trigger desde la carta propia: nadie lo escribe a mano.
alter table public.profiles add column if not exists sun_sign text
  check (sun_sign is null or char_length(sun_sign) <= 20);

create or replace function public.sync_sun_sign()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_self then
    update public.profiles
    set sun_sign = (
      select left(e ->> 'sign', 20)
      from jsonb_array_elements(new.chart -> 'planets') e
      where e ->> 'id' = 'sun'
      limit 1
    )
    where id = new.user_id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_sun_sign() from public, anon, authenticated;

drop trigger if exists natal_charts_sync_sun_sign on public.natal_charts;
create trigger natal_charts_sync_sun_sign
  after insert on public.natal_charts
  for each row execute function public.sync_sun_sign();

-- Relleno: la carta propia más reciente de cada persona.
update public.profiles p
set sun_sign = s.sign
from (
  select distinct on (c.user_id)
    c.user_id,
    (select left(e ->> 'sign', 20)
     from jsonb_array_elements(c.chart -> 'planets') e
     where e ->> 'id' = 'sun' limit 1) as sign
  from public.natal_charts c
  where c.is_self
  order by c.user_id, c.created_at desc
) s
where s.user_id = p.id and p.sun_sign is distinct from s.sign;

-- ---------- Reacciones ----------
do $$ begin
  create type public.reaction_kind as enum ('fuego', 'magia', 'calavera', 'amor');
exception when duplicate_object then null; end $$;

create table if not exists public.post_reactions (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind public.reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

create index if not exists post_reactions_user_idx on public.post_reactions (user_id);

alter table public.post_reactions enable row level security;
revoke all on table public.post_reactions from anon, authenticated;
grant select, delete on table public.post_reactions to authenticated;
grant insert (post_id, kind) on table public.post_reactions to authenticated;

-- Cada uno ve las suyas; los recuentos públicos salen de community_feed().
drop policy if exists "post_reactions: ver las propias" on public.post_reactions;
create policy "post_reactions: ver las propias" on public.post_reactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "post_reactions: reaccionar a publicados" on public.post_reactions;
create policy "post_reactions: reaccionar a publicados" on public.post_reactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "post_reactions: quitar las propias" on public.post_reactions;
create policy "post_reactions: quitar las propias" on public.post_reactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- Denuncias ----------
-- Solo se insertan; las lee el service role. Con 3 personas distintas
-- denunciando, el contenido se oculta solo hasta que alguien lo revise.
create table if not exists public.content_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 1 and 300),
  created_at timestamptz not null default now(),
  constraint content_reports_one_target check ((post_id is null) <> (comment_id is null))
);

create unique index if not exists content_reports_post_uidx
  on public.content_reports (reporter_id, post_id) where post_id is not null;
create unique index if not exists content_reports_comment_uidx
  on public.content_reports (reporter_id, comment_id) where comment_id is not null;

alter table public.content_reports enable row level security;
revoke all on table public.content_reports from anon, authenticated;
grant insert (post_id, comment_id, reason) on table public.content_reports to authenticated;

drop policy if exists "content_reports: denunciar como uno mismo" on public.content_reports;
create policy "content_reports: denunciar como uno mismo" on public.content_reports
  for insert to authenticated
  with check ((select auth.uid()) = reporter_id);

create or replace function public.hide_reported_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.post_id is not null and (
    select count(distinct r.reporter_id) from public.content_reports r where r.post_id = new.post_id
  ) >= 3 then
    update public.community_posts set status = 'hidden'
    where id = new.post_id and status = 'published';
  end if;
  if new.comment_id is not null and (
    select count(distinct r.reporter_id) from public.content_reports r where r.comment_id = new.comment_id
  ) >= 3 then
    update public.comments set status = 'hidden'
    where id = new.comment_id and status = 'published';
  end if;
  return new;
end;
$$;

revoke all on function public.hide_reported_content() from public, anon, authenticated;

drop trigger if exists content_reports_hide on public.content_reports;
create trigger content_reports_hide
  after insert on public.content_reports
  for each row execute function public.hide_reported_content();

-- ---------- Feed y comentarios con tarjeta de autor ----------
-- Security definer para exponer SOLO los datos públicos del autor (nombre,
-- usuario, avatar, nivel, signo), nunca el resto del perfil.
create or replace function public.community_feed(
  p_topic text default null,
  p_before timestamptz default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  body text,
  topic text,
  created_at timestamptz,
  author_id uuid,
  author_name text,
  author_username text,
  author_avatar text,
  author_level integer,
  author_sign text,
  comment_count integer,
  reactions jsonb,
  my_reactions text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id, p.body, p.topic, p.created_at, p.author_id,
    pr.display_name, pr.username, pr.avatar_url, pr.level, pr.sun_sign,
    (select count(*)::integer from public.comments c
     where c.post_id = p.id and c.status = 'published'),
    coalesce((
      select jsonb_object_agg(x.kind, x.n)
      from (select r.kind, count(*) as n from public.post_reactions r
            where r.post_id = p.id group by r.kind) x
    ), '{}'::jsonb),
    coalesce((
      select array_agg(r.kind::text order by r.kind)
      from public.post_reactions r
      where r.post_id = p.id and r.user_id = (select auth.uid())
    ), '{}')
  from public.community_posts p
  join public.profiles pr on pr.id = p.author_id
  where p.status = 'published'
    and (p_topic is null or p.topic = p_topic)
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke all on function public.community_feed(text, timestamptz, integer) from public, anon;
grant execute on function public.community_feed(text, timestamptz, integer) to authenticated;

create or replace function public.post_comments(p_post uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  author_id uuid,
  author_name text,
  author_username text,
  author_avatar text,
  author_level integer,
  author_sign text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.body, c.created_at, c.author_id,
    pr.display_name, pr.username, pr.avatar_url, pr.level, pr.sun_sign
  from public.comments c
  join public.profiles pr on pr.id = c.author_id
  where c.post_id = p_post
    and c.status = 'published'
    and exists (
      select 1 from public.community_posts p
      where p.id = p_post and p.status = 'published'
    )
  order by c.created_at
  limit 200;
$$;

revoke all on function public.post_comments(uuid) from public, anon;
grant execute on function public.post_comments(uuid) to authenticated;
