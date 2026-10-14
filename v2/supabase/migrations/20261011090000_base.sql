-- Zodi v2 · Tipos y utilidades comunes.
-- Idempotente: se puede volver a ejecutar sin errores.

do $$ begin
  create type public.plan_tier as enum ('free', 'premium', 'vip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_language as enum ('es', 'en', 'ca');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reading_tone as enum ('suave', 'directo', 'brutal', 'sarcastico');
exception when duplicate_object then null; end $$;

-- Los 19 tipos de lectura de la app antigua (types/zodi.ts → ReadingKind).
do $$ begin
  create type public.reading_kind as enum (
    'daily-horoscope', 'weekly-horoscope', 'monthly-horoscope', 'natal-chart',
    'tarot', 'celtic-tarot', 'compatibility', 'dream', 'transits', 'numerology',
    'name-reading', 'palm-reading', 'biorhythm', 'chinese-horoscope',
    'mayan-horoscope', 'runes', 'crystals', 'roast', 'assistant'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.content_status as enum ('published', 'hidden', 'removed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.friendship_status as enum ('pending', 'accepted', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'unpaid', 'paused'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gem_reason as enum ('purchase', 'reading', 'reward', 'referral', 'refund', 'adjustment');
exception when duplicate_object then null; end $$;

-- Mantiene updated_at al día en cualquier tabla que lo tenga.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Inicio del día natural en una zona IANA; si la zona no es válida, UTC.
create or replace function public.day_start_in(p_time_zone text)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
begin
  return date_trunc('day', now() at time zone coalesce(p_time_zone, 'UTC')) at time zone coalesce(p_time_zone, 'UTC');
exception when invalid_parameter_value then
  return date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
end;
$$;
