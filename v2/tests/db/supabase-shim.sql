-- Réplica mínima de lo que Supabase trae de serie, para ejecutar las
-- migraciones y probar RLS en PGlite sin proyecto real.
-- Roles: anon y authenticated sujetos a RLS; service_role la salta.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Igual que en Supabase: el sub del JWT llega como ajuste de la petición.
create function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

-- Privilegios por defecto de Supabase: todo concedido y la RLS como única barrera.
-- Las migraciones deben endurecerlo; los tests comprueban que lo hacen.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
