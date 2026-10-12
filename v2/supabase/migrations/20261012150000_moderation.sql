-- Zodi v2 · Moderación de la comunidad. Las denuncias ya ocultan solas el
-- contenido con 3 denuncias; aquí una persona moderadora lo revisa:
-- restaurar, eliminar o descartar las denuncias. Ser moderador solo lo
-- asigna el service role (scripts/db/make-moderator.mjs).

alter table public.profiles add column if not exists is_moderator boolean not null default false;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_moderator from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_moderator() from public, anon;
grant execute on function public.is_moderator() to authenticated;

-- Cola: contenido con denuncias (lo oculto primero, después lo más denunciado).
create or replace function public.moderation_queue()
returns table (
  kind text,
  id uuid,
  body text,
  status public.content_status,
  author_name text,
  created_at timestamptz,
  reports integer,
  reasons text[],
  last_report_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select q.kind, q.id, q.body, q.status, q.author_name, q.created_at,
         q.reports, q.reasons, q.last_report_at
  from (
    select 'post'::text as kind, cp.id, cp.body, cp.status,
           coalesce(nullif(pr.display_name, ''), 'Anónimo') as author_name, cp.created_at,
           count(distinct r.reporter_id)::integer as reports,
           array_agg(distinct r.reason) as reasons,
           max(r.created_at) as last_report_at
    from public.content_reports r
    join public.community_posts cp on cp.id = r.post_id
    left join public.profiles pr on pr.id = cp.author_id
    where cp.status <> 'removed'
    group by cp.id, cp.body, cp.status, pr.display_name, cp.created_at
    union all
    select 'comment'::text, c.id, c.body, c.status,
           coalesce(nullif(pr.display_name, ''), 'Anónimo'), c.created_at,
           count(distinct r.reporter_id)::integer,
           array_agg(distinct r.reason),
           max(r.created_at)
    from public.content_reports r
    join public.comments c on c.id = r.comment_id
    left join public.profiles pr on pr.id = c.author_id
    where c.status <> 'removed'
    group by c.id, c.body, c.status, pr.display_name, c.created_at
  ) q
  order by (q.status = 'hidden') desc, q.reports desc, q.last_report_at desc
  limit 100;
end;
$$;

revoke all on function public.moderation_queue() from public, anon;
grant execute on function public.moderation_queue() to authenticated;

-- restaurar: vuelve a publicarse y se borran sus denuncias.
-- eliminar: se retira para siempre (status removed).
-- descartar: se borran las denuncias y se deja como está.
create or replace function public.moderate(p_kind text, p_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_kind not in ('post', 'comment') or p_action not in ('restaurar', 'eliminar', 'descartar') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;

  if p_action = 'eliminar' then
    if p_kind = 'post' then
      update public.community_posts set status = 'removed' where id = p_id;
    else
      update public.comments set status = 'removed' where id = p_id;
    end if;
  elsif p_action = 'restaurar' then
    if p_kind = 'post' then
      update public.community_posts set status = 'published' where id = p_id;
    else
      update public.comments set status = 'published' where id = p_id;
    end if;
  end if;

  if p_action in ('restaurar', 'descartar') then
    if p_kind = 'post' then
      delete from public.content_reports where post_id = p_id;
    else
      delete from public.content_reports where comment_id = p_id;
    end if;
  end if;
  if not found and p_action = 'eliminar' then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.moderate(text, uuid, text) from public, anon;
grant execute on function public.moderate(text, uuid, text) to authenticated;
