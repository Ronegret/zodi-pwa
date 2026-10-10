-- Zodi v2 · Cartas natales y lecturas.

-- Cartas calculadas con src/lib/astro-engine. Inmutables: recalcular = fila nueva.
create table if not exists public.natal_charts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  label text not null default 'Yo' check (char_length(label) between 1 and 40),
  is_self boolean not null default true,
  input jsonb not null check (pg_column_size(input) <= 4096),
  chart jsonb not null check (pg_column_size(chart) <= 65536),
  engine_version text not null check (char_length(engine_version) <= 20),
  created_at timestamptz not null default now()
);

create index if not exists natal_charts_user_created_idx
  on public.natal_charts (user_id, created_at desc);

alter table public.natal_charts enable row level security;
revoke all on table public.natal_charts from anon, authenticated;
grant select, delete on table public.natal_charts to authenticated;
grant insert (user_id, label, is_self, input, chart, engine_version)
  on table public.natal_charts to authenticated;

drop policy if exists "natal_charts: leer las propias" on public.natal_charts;
create policy "natal_charts: leer las propias" on public.natal_charts
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "natal_charts: crear las propias" on public.natal_charts;
create policy "natal_charts: crear las propias" on public.natal_charts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "natal_charts: borrar las propias" on public.natal_charts;
create policy "natal_charts: borrar las propias" on public.natal_charts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Lecturas de IA. Solo el servidor (service role) las escribe, después de
-- consumir cuota, para que modelo y tokens no se puedan falsear.
create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reading_kind not null,
  input jsonb not null default '{}'::jsonb check (pg_column_size(input) <= 8192),
  content text not null check (char_length(content) <= 20000),
  model text not null check (char_length(model) <= 80),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  created_at timestamptz not null default now()
);

create index if not exists readings_user_created_idx
  on public.readings (user_id, created_at desc);
create index if not exists readings_user_kind_created_idx
  on public.readings (user_id, kind, created_at desc);

alter table public.readings enable row level security;
revoke all on table public.readings from anon, authenticated;
grant select, delete on table public.readings to authenticated;

drop policy if exists "readings: leer las propias" on public.readings;
create policy "readings: leer las propias" on public.readings
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "readings: borrar las propias" on public.readings;
create policy "readings: borrar las propias" on public.readings
  for delete to authenticated
  using ((select auth.uid()) = user_id);
