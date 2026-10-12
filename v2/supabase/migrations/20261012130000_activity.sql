-- Zodi v2 · Fase 8C: actividad diaria (racha, puntos y nivel), logros reales
-- y lecturas favoritas. Puntos, nivel, racha y gemas siguen siendo columnas
-- que el usuario no puede escribir: solo cambian con record_activity().

alter table public.profiles add column if not exists last_active_on date;
alter table public.profiles add column if not exists best_streak integer not null default 0
  check (best_streak >= 0);

alter table public.readings add column if not exists favorite boolean not null default false;
create index if not exists readings_user_favorite_idx
  on public.readings (user_id, created_at desc) where favorite;

-- Logros desbloqueados. El catálogo (título, texto) vive en la app
-- (src/lib/progress/achievements.ts); aquí solo el id y cuándo.
create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement text not null check (achievement ~ '^[a-z0-9-]{2,40}$'),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement)
);

alter table public.user_achievements enable row level security;
revoke all on table public.user_achievements from anon, authenticated;
grant select on table public.user_achievements to authenticated;

drop policy if exists "user_achievements: leer los propios" on public.user_achievements;
create policy "user_achievements: leer los propios" on public.user_achievements
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Nivel según XP: umbral(n) = 50·n·(n−1) (igual que src/lib/daily/progress.ts).
create or replace function public.level_for_xp(p_xp integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(1, floor((1 + sqrt(1 + greatest(p_xp, 0) / 12.5)) / 2)::integer);
$$;

-- Registra algo que ha hecho la persona: suma racha (una vez al día, en su
-- zona horaria), XP y nivel, desbloquea logros y da gemas por logros y por
-- cada semana de racha. Devuelve el estado y los logros nuevos.
create or replace function public.record_activity(p_action text)
returns table (
  xp integer,
  level integer,
  streak integer,
  best_streak integer,
  gems integer,
  unlocked text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_tz text;
  v_today date;
  v_last date;
  v_streak integer;
  v_best integer;
  v_xp integer;
  v_level integer;
  v_new_day boolean;
  v_candidates text[];
  v_unlocked text[];
  c record;
  a text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_action not in ('visit', 'reading', 'post', 'comment', 'favorite') then
    raise exception 'invalid_action' using errcode = '22023';
  end if;

  select p.time_zone, p.last_active_on, p.streak, p.best_streak, p.xp
    into v_tz, v_last, v_streak, v_best, v_xp
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  begin
    v_today := (now() at time zone coalesce(v_tz, 'UTC'))::date;
  exception when invalid_parameter_value then
    v_today := (now() at time zone 'UTC')::date;
  end;

  v_new_day := v_last is null or v_last < v_today;
  if v_new_day then
    v_streak := case when v_last = v_today - 1 then v_streak + 1 else 1 end;
    v_best := greatest(v_best, v_streak);
    v_xp := v_xp + 5;
  end if;
  v_xp := v_xp + case p_action
    when 'reading' then 10
    when 'post' then 8
    when 'comment' then 3
    when 'favorite' then 2
    else 0
  end;
  v_level := public.level_for_xp(v_xp);

  update public.profiles p
  set last_active_on = v_today,
      streak = v_streak,
      best_streak = v_best,
      xp = v_xp,
      level = v_level
  where p.id = v_uid;

  -- Cada 7 días seguidos, 10 gemas (una vez por día de racha).
  if v_new_day and v_streak % 7 = 0 then
    perform public.apply_gem_transaction(v_uid, 10, 'reward', 'racha:' || v_today::text);
  end if;

  select
    count(*) filter (where r.kind <> 'assistant') as total,
    count(distinct r.kind) filter (where r.kind <> 'assistant') as kinds,
    count(*) filter (where r.kind in ('tarot', 'celtic-tarot')) as tarot,
    count(*) filter (where r.kind = 'celtic-tarot') as celta,
    count(*) filter (where r.kind = 'runes') as runes,
    count(*) filter (where r.kind = 'natal-chart') as natal,
    count(*) filter (where r.kind = 'compatibility') as compat,
    count(*) filter (where r.kind = 'dream') as dream,
    count(*) filter (where r.kind in ('numerology', 'name-reading')) as numbers,
    count(*) filter (where r.kind = 'roast') as roast,
    count(*) filter (where r.kind = 'assistant') as oracle,
    count(*) filter (where r.favorite) as favs
  into c
  from public.readings r
  where r.user_id = v_uid;

  v_candidates := array_remove(array[
    case when c.total >= 1 then 'primera-senal' end,
    case when c.total >= 10 then 'coleccionista' end,
    case when c.kinds >= 8 then 'explorador' end,
    case when c.tarot >= 1 then 'primer-tarot' end,
    case when c.celta >= 1 then 'cruz-celta' end,
    case when c.runes >= 1 then 'las-runas-hablan' end,
    case when c.natal >= 1 then 'mapa-descubierto' end,
    case when c.compat >= 1 then 'quimica-detectada' end,
    case when c.dream >= 1 then 'sonador' end,
    case when c.numbers >= 1 then 'los-numeros-no-mienten' end,
    case when c.roast >= 1 then 'aguanto-el-roast' end,
    case when c.oracle >= 1 then 'consulta-al-oraculo' end,
    case when c.favs >= 1 then 'favorita' end,
    case when v_streak >= 3 then 'racha-3' end,
    case when v_streak >= 7 then 'racha-7' end,
    case when v_streak >= 30 then 'racha-30' end,
    case when v_level >= 5 then 'nivel-5' end,
    case when v_level >= 10 then 'nivel-10' end,
    case when exists (
      select 1 from public.community_posts cp where cp.author_id = v_uid
    ) then 'voz-de-la-comunidad' end
  ], null);

  with ins as (
    insert into public.user_achievements as ua (user_id, achievement)
    select v_uid, x from unnest(v_candidates) as x
    on conflict do nothing
    returning ua.achievement
  )
  select coalesce(array_agg(ins.achievement), '{}') into v_unlocked from ins;

  -- 5 gemas por logro (idempotente por referencia).
  foreach a in array v_unlocked loop
    perform public.apply_gem_transaction(v_uid, 5, 'reward', 'logro:' || a);
  end loop;

  return query
  select v_xp, v_level, v_streak, v_best, p.gems, v_unlocked
  from public.profiles p
  where p.id = v_uid;
end;
$$;

revoke all on function public.record_activity(text) from public, anon;
grant execute on function public.record_activity(text) to authenticated;

-- Marca o desmarca una lectura propia como favorita. Devuelve el estado nuevo.
create or replace function public.toggle_favorite(p_reading uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_favorite boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.readings r
  set favorite = not r.favorite
  where r.id = p_reading and r.user_id = v_uid
  returning r.favorite into v_favorite;

  if not found then
    raise exception 'reading_not_found' using errcode = 'P0002';
  end if;
  return v_favorite;
end;
$$;

revoke all on function public.toggle_favorite(uuid) from public, anon;
grant execute on function public.toggle_favorite(uuid) to authenticated;
