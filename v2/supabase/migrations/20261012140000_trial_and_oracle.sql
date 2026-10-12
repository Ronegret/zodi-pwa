-- Zodi v2 · Lanzamiento: 30 días con todo gratis para cada cuenta y cuota
-- propia del oráculo (conversar no gasta lecturas).

-- Fin del periodo gratis. Las cuentas que ya existían empiezan hoy.
alter table public.profiles add column if not exists trial_ends_at timestamptz;
update public.profiles set trial_ends_at = now() + interval '30 days' where trial_ends_at is null;
alter table public.profiles alter column trial_ends_at set default (now() + interval '30 days');

-- Mensajes al oráculo por día y plan.
alter table public.usage_limits
  add column if not exists daily_oracle_messages integer not null default 15
  check (daily_oracle_messages >= 0);
update public.usage_limits set daily_oracle_messages = case plan
  when 'free' then 15
  when 'premium' then 60
  when 'vip' then 200
end;

-- Plan con el que se cuenta hoy: durante el periodo gratis, como premium.
create or replace function public.effective_plan(p_plan public.plan_tier, p_trial_ends_at timestamptz)
returns public.plan_tier
language sql
stable
set search_path = ''
as $$
  select case
    when p_plan = 'free' and p_trial_ends_at is not null and p_trial_ends_at > now()
      then 'premium'::public.plan_tier
    else p_plan
  end;
$$;

-- Consume una lectura (o un mensaje al oráculo) de la cuota del día. Las
-- lecturas y el oráculo llevan cuentas separadas.
create or replace function public.consume_ai_quota(p_kind public.reading_kind)
returns table (allowed boolean, used integer, daily_limit integer, event_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.plan_tier;
  v_trial timestamptz;
  v_tz text;
  v_limit integer;
  v_used integer;
  v_event bigint;
  v_oracle boolean := p_kind = 'assistant';
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select p.plan, p.trial_ends_at, p.time_zone into v_plan, v_trial, v_tz
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;
  v_plan := public.effective_plan(v_plan, v_trial);

  select coalesce(max(case when v_oracle then l.daily_oracle_messages else l.daily_ai_readings end), 0)
    into v_limit
  from public.usage_limits l
  where l.plan = v_plan;

  select count(*)::integer into v_used
  from public.usage_events e
  where e.user_id = v_uid
    and e.created_at >= public.day_start_in(v_tz)
    and (e.kind = 'assistant') = v_oracle;

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

-- Estado de la cuota de lecturas (sin el oráculo), con el plan de hoy.
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
        and e.kind <> 'assistant'
        and e.created_at >= public.day_start_in(p.time_zone)),
    coalesce((select l.daily_ai_readings from public.usage_limits l
              where l.plan = public.effective_plan(p.plan, p.trial_ends_at)), 0)
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke all on function public.ai_quota_status() from public, anon;
grant execute on function public.ai_quota_status() to authenticated;

-- Estado de la cuota del oráculo.
create or replace function public.oracle_quota_status()
returns table (used integer, daily_limit integer)
language sql
stable
set search_path = ''
as $$
  select
    (select count(*)::integer
       from public.usage_events e
      where e.user_id = p.id
        and e.kind = 'assistant'
        and e.created_at >= public.day_start_in(p.time_zone)),
    coalesce((select l.daily_oracle_messages from public.usage_limits l
              where l.plan = public.effective_plan(p.plan, p.trial_ends_at)), 0)
  from public.profiles p
  where p.id = (select auth.uid());
$$;

revoke all on function public.oracle_quota_status() from public, anon;
grant execute on function public.oracle_quota_status() to authenticated;
