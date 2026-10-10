-- Zodi v2 · Perfiles de usuario (1:1 con auth.users).
-- plan, gems, xp, level, streak y referidos solo los cambia el service role:
-- el rol authenticated tiene UPDATE únicamente sobre las columnas editables.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  username text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  avatar_url text check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500)),
  -- Nacimiento. birth_time nulo = hora desconocida (sin casas ni ascendente fiables).
  birth_date date check (birth_date >= date '1900-01-01'),
  birth_time time,
  birth_place text check (char_length(birth_place) <= 120),
  birth_lat double precision check (birth_lat between -90 and 90),
  birth_lon double precision check (birth_lon between -180 and 180),
  time_zone text check (char_length(time_zone) between 1 and 64),
  -- Preferencias.
  language public.app_language not null default 'es',
  reading_tone public.reading_tone not null default 'directo',
  favorite_topics text[] not null default '{}' check (cardinality(favorite_topics) <= 12),
  notification_prefs text[] not null default '{}' check (cardinality(notification_prefs) <= 8),
  -- Contexto vital para personalizar lecturas.
  relationship_status text check (
    relationship_status in ('single', 'relationship', 'married', 'complicated', 'divorced')
  ),
  partner_name text check (char_length(partner_name) <= 60),
  has_kids boolean,
  kids_count smallint check (kids_count between 0 and 20),
  personal_bio text check (char_length(personal_bio) <= 500),
  -- Gamificación y plan (solo service role).
  plan public.plan_tier not null default 'free',
  gems integer not null default 0 check (gems >= 0),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  streak integer not null default 0 check (streak >= 0),
  last_active_on date,
  referral_code text not null unique
    default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  referred_by uuid references public.profiles (id) on delete set null,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_birth_coords_pair check ((birth_lat is null) = (birth_lon is null))
);

create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse. Los metadatos los controla el usuario en el
-- registro, así que se recortan y se valida que el avatar sea https.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_referrer uuid;
begin
  if v_meta ? 'referral_code' then
    select p.id into v_referrer
    from public.profiles p
    where p.referral_code = left(v_meta ->> 'referral_code', 10);
  end if;

  insert into public.profiles (id, display_name, avatar_url, referred_by)
  values (
    new.id,
    left(coalesce(
      nullif(trim(v_meta ->> 'full_name'), ''),
      nullif(trim(v_meta ->> 'name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 60),
    case
      when v_meta ->> 'avatar_url' ~ '^https://' and char_length(v_meta ->> 'avatar_url') <= 500
        then v_meta ->> 'avatar_url'
    end,
    v_referrer
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permisos: nadie anónimo; el usuario lee su fila y edita solo columnas no sensibles.
alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (
  display_name, username, avatar_url,
  birth_date, birth_time, birth_place, birth_lat, birth_lon, time_zone,
  language, reading_tone, favorite_topics, notification_prefs,
  relationship_status, partner_name, has_kids, kids_count, personal_bio,
  onboarding_completed_at
) on table public.profiles to authenticated;

drop policy if exists "profiles: leer el propio" on public.profiles;
create policy "profiles: leer el propio" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles: editar el propio" on public.profiles;
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Tarjeta pública (nombre, usuario, avatar, nivel) para comunidad y amigos,
-- sin exponer fecha de nacimiento ni el resto del perfil.
create or replace function public.profile_cards(p_ids uuid[])
returns table (id uuid, username text, display_name text, avatar_url text, level integer)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.level
  from public.profiles p
  where p.id = any (p_ids[1:100]);
$$;

revoke all on function public.profile_cards(uuid[]) from public, anon;
grant execute on function public.profile_cards(uuid[]) to authenticated;
