-- Zodi v2 · Cuotas diarias de IA por plan.

create table if not exists public.usage_limits (
  plan public.plan_tier primary key,
  daily_ai_readings integer not null check (daily_ai_readings >= 0),
  updated_at timestamptz not null default now()
);

insert into public.usage_limits (plan, daily_ai_readings)
values ('free', 5), ('premium', 40), ('vip', 150)
on conflict (plan) do nothing;

drop trigger if exists usage_limits_set_updated_at on public.usage_limits;
create trigger usage_limits_set_updated_at
  before update on public.usage_limits
  for each row execute function public.set_updated_at();

-- Lectura pública: los límites se muestran en la página de precios.
alter table public.usage_limits enable row level security;
revoke all on table public.usage_limits from anon, authenticated;
grant select on table public.usage_limits to anon, authenticated;

drop policy if exists "usage_limits: lectura pública" on public.usage_limits;
create policy "usage_limits: lectura pública" on public.usage_limits
  for select to anon, authenticated
  using (true);

-- Un evento por lectura de IA consumida. El usuario solo puede leerlos:
-- si pudiera borrarlos se reiniciaría la cuota.
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reading_kind not null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events (user_id, created_at desc);

alter table public.usage_events enable row level security;
revoke all on table public.usage_events from anon, authenticated;
grant select on table public.usage_events to authenticated;

drop policy if exists "usage_events: leer los propios" on public.usage_events;
create policy "usage_events: leer los propios" on public.usage_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Consume una lectura de la cuota del día (en la zona horaria del usuario).
-- Bloquea la fila del perfil para que dos peticiones simultáneas no superen
-- el límite. Si la IA falla, el servidor borra el evento con service role.
create or replace function public.consume_ai_quota(p_kind public.reading_kind)
returns table (allowed boolean, used integer, daily_limit integer, event_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.plan_tier;
  v_tz text;
  v_limit integer;
  v_used integer;
  v_event bigint;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select p.plan, p.time_zone into v_plan, v_tz
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  select coalesce(max(l.daily_ai_readings), 0) into v_limit
  from public.usage_limits l
  where l.plan = v_plan;

  select count(*)::integer into v_used
  from public.usage_events e
  where e.user_id = v_uid
    and e.created_at >= public.day_start_in(v_tz);

  if v_used >= v_limit then
    return query select false, v_used, v_limit, null::bigint;
    return;
  end if;

  insert into public.usage_events (user_id, kind)
  values (v_uid, p_kind)
  returning id into v_event;

  return query select true, v_used + 1, v_limit, v_event;
end;
$$;

revoke all on function public.consume_ai_quota(public.reading_kind) from public, anon;
grant execute on function public.consume_ai_quota(public.reading_kind) to authenticated;

-- Estado de la cuota sin consumir (para la UI). Usa los permisos del usuario.
create or replace function public.ai_quota_status()
returns table (used integer, daily_limit integer)
language sql
stable
set search_path = ''
as $$
  select
    (select count(*)::integer
       from public.usage_events e
      where e.user_id = p.id
        and e.created_at >= public.day_start_in(p.time_zone)),
    coalesce((select l.daily_ai_readings from public.usage_limits l where l.plan = p.plan), 0)
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke all on function public.ai_quota_status() from public, anon;
grant execute on function public.ai_quota_status() to authenticated;
