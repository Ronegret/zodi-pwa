-- Zodi v2 · Comunidad (posts, comentarios) y amistades.
-- La moderación (cambiar status) es exclusiva del service role.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_status_created_idx
  on public.community_posts (status, created_at desc);
create index if not exists community_posts_author_created_idx
  on public.community_posts (author_id, created_at desc);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

alter table public.community_posts enable row level security;
revoke all on table public.community_posts from anon, authenticated;
-- Lectura pública justificada: los posts publicados son contenido abierto.
grant select on table public.community_posts to anon, authenticated;
grant insert (body), update (body), delete on table public.community_posts to authenticated;

drop policy if exists "posts: publicados visibles" on public.community_posts;
create policy "posts: publicados visibles" on public.community_posts
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists "posts: el autor ve los suyos" on public.community_posts;
create policy "posts: el autor ve los suyos" on public.community_posts
  for select to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists "posts: crear como uno mismo" on public.community_posts;
create policy "posts: crear como uno mismo" on public.community_posts
  for insert to authenticated
  with check ((select auth.uid()) = author_id and status = 'published');

drop policy if exists "posts: editar los propios publicados" on public.community_posts;
create policy "posts: editar los propios publicados" on public.community_posts
  for update to authenticated
  using ((select auth.uid()) = author_id and status = 'published')
  with check ((select auth.uid()) = author_id);

drop policy if exists "posts: borrar los propios" on public.community_posts;
create policy "posts: borrar los propios" on public.community_posts
  for delete to authenticated
  using ((select auth.uid()) = author_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_created_idx on public.comments (post_id, created_at);
create index if not exists comments_author_idx on public.comments (author_id);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;
revoke all on table public.comments from anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert (post_id, body), update (body), delete on table public.comments to authenticated;

drop policy if exists "comments: publicados en posts publicados" on public.comments;
create policy "comments: publicados en posts publicados" on public.comments
  for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "comments: el autor ve los suyos" on public.comments;
create policy "comments: el autor ve los suyos" on public.comments
  for select to authenticated
  using ((select auth.uid()) = author_id);

drop policy if exists "comments: comentar posts publicados" on public.comments;
create policy "comments: comentar posts publicados" on public.comments
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and status = 'published'
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "comments: editar los propios publicados" on public.comments;
create policy "comments: editar los propios publicados" on public.comments
  for update to authenticated
  using ((select auth.uid()) = author_id and status = 'published')
  with check ((select auth.uid()) = author_id);

-- Borra el autor del comentario o el autor del post (moderación básica).
drop policy if exists "comments: borrar propios o en mi post" on public.comments;
create policy "comments: borrar propios o en mi post" on public.comments
  for delete to authenticated
  using (
    (select auth.uid()) = author_id
    or exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

create table if not exists public.friendships (
  requester_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- Una sola relación por pareja, sin importar quién la pidió.
create unique index if not exists friendships_pair_uidx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_status_idx
  on public.friendships (addressee_id, status);

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

alter table public.friendships enable row level security;
revoke all on table public.friendships from anon, authenticated;
grant select, delete on table public.friendships to authenticated;
grant insert (addressee_id), update (status) on table public.friendships to authenticated;

drop policy if exists "friendships: ver las mías" on public.friendships;
create policy "friendships: ver las mías" on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

drop policy if exists "friendships: pedir como uno mismo" on public.friendships;
create policy "friendships: pedir como uno mismo" on public.friendships
  for insert to authenticated
  with check ((select auth.uid()) = requester_id and status = 'pending');

-- Solo el destinatario responde a una solicitud pendiente.
drop policy if exists "friendships: responder el destinatario" on public.friendships;
create policy "friendships: responder el destinatario" on public.friendships
  for update to authenticated
  using ((select auth.uid()) = addressee_id and status = 'pending')
  with check ((select auth.uid()) = addressee_id and status in ('accepted', 'blocked'));

-- Quien pidió no puede borrar un bloqueo para volver a insistir.
drop policy if exists "friendships: borrar las mías" on public.friendships;
create policy "friendships: borrar las mías" on public.friendships
  for delete to authenticated
  using (
    (select auth.uid()) = addressee_id
    or ((select auth.uid()) = requester_id and status <> 'blocked')
  );
