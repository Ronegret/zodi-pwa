-- Zodi v2 · Preparación para Stripe: suscripciones, gemas e idempotencia de webhooks.
-- Todas las escrituras van por service role (webhook verificado por firma).

create table if not exists public.subscriptions (
  id text primary key check (id ~ '^sub_'),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text not null check (stripe_customer_id ~ '^cus_'),
  plan public.plan_tier not null,
  status public.subscription_status not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;

drop policy if exists "subscriptions: leer las propias" on public.subscriptions;
create policy "subscriptions: leer las propias" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Libro de gemas. reference (id de evento Stripe, de lectura…) hace idempotente
-- cada movimiento: el mismo motivo + referencia no se aplica dos veces.
create table if not exists public.gem_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason public.gem_reason not null,
  reference text check (char_length(reference) <= 255),
  balance_after integer not null check (balance_after >= 0),
  created_at timestamptz not null default now(),
  constraint gem_transactions_reason_reference_key unique (reason, reference)
);

create index if not exists gem_transactions_user_created_idx
  on public.gem_transactions (user_id, created_at desc);

alter table public.gem_transactions enable row level security;
revoke all on table public.gem_transactions from anon, authenticated;
grant select on table public.gem_transactions to authenticated;

drop policy if exists "gem_transactions: leer las propias" on public.gem_transactions;
create policy "gem_transactions: leer las propias" on public.gem_transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Eventos de Stripe ya procesados (idempotencia de webhooks). Sin políticas:
-- invisible para anon y authenticated.
create table if not exists public.stripe_events (
  id text primary key check (id ~ '^evt_'),
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
revoke all on table public.stripe_events from anon, authenticated;

-- Aplica un movimiento de gemas de forma atómica y devuelve el saldo final.
-- Si (reason, reference) ya existe no hace nada. Saldo negativo → check_violation.
create or replace function public.apply_gem_transaction(
  p_user uuid,
  p_delta integer,
  p_reason public.gem_reason,
  p_reference text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_reference is not null and exists (
    select 1 from public.gem_transactions t
    where t.reason = p_reason and t.reference = p_reference
  ) then
    select p.gems into v_balance from public.profiles p where p.id = p_user;
    return v_balance;
  end if;

  update public.profiles
  set gems = gems + p_delta
  where id = p_user
  returning gems into v_balance;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  insert into public.gem_transactions (user_id, delta, reason, reference, balance_after)
  values (p_user, p_delta, p_reason, p_reference, v_balance);

  return v_balance;
end;
$$;

revoke all on function public.apply_gem_transaction(uuid, integer, public.gem_reason, text)
  from public, anon, authenticated;
grant execute on function public.apply_gem_transaction(uuid, integer, public.gem_reason, text)
  to service_role;
