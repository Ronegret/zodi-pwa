-- Zodi v2 · Lugares de nacimiento propios (sin proveedor externo).
-- Datos: GeoNames cities500 (CC BY 4.0, uso comercial permitido citando a
-- GeoNames). Cada ciudad trae su zona IANA. Se cargan con
-- scripts/places/import.mjs. Búsqueda por prefijo sin extensiones: los
-- nombres se guardan ya normalizados (minúsculas, sin tildes).

create table if not exists public.places (
  id integer primary key,                 -- geonameid
  name text not null,
  name_norm text not null,
  country_code text not null check (char_length(country_code) = 2),
  admin1 text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  time_zone text not null check (char_length(time_zone) between 1 and 64),
  population integer not null default 0
);

create index if not exists places_name_norm_idx
  on public.places (name_norm text_pattern_ops);

-- Exónimos de ciudades grandes ("londres" → London, "nueva york" → New York).
create table if not exists public.place_aliases (
  place_id integer not null references public.places (id) on delete cascade,
  alias_norm text not null,
  primary key (place_id, alias_norm)
);

create index if not exists place_aliases_norm_idx
  on public.place_aliases (alias_norm text_pattern_ops);

-- Datos públicos (sin información personal): lectura para todos, escritura
-- solo service role (el script de carga).
alter table public.places enable row level security;
alter table public.place_aliases enable row level security;
revoke all on table public.places, public.place_aliases from anon, authenticated;
grant select on table public.places, public.place_aliases to anon, authenticated;

drop policy if exists "places: lectura pública" on public.places;
create policy "places: lectura pública" on public.places
  for select to anon, authenticated using (true);

drop policy if exists "place_aliases: lectura pública" on public.place_aliases;
create policy "place_aliases: lectura pública" on public.place_aliases
  for select to anon, authenticated using (true);

-- Normalización igual que en TypeScript (lib/geo/normalize.ts) para los
-- acentos más comunes; el cliente ya envía la consulta normalizada.
create or replace function public.normalize_place_query(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select translate(
    lower(btrim(coalesce(p, ''))),
    'áàâäãåāéèêëēíìîïīóòôöõøōúùûüūñçýÿ',
    'aaaaaaaeeeeeiiiiioooooooouuuuuncyy'
  );
$$;

-- Autocompletado: coincidencia por prefijo en nombre o alias; primero la
-- coincidencia exacta y después la más poblada.
create or replace function public.search_places(p_query text, p_limit integer default 8)
returns table (
  id integer,
  name text,
  country_code text,
  admin1 text,
  latitude double precision,
  longitude double precision,
  time_zone text,
  population integer
)
language sql
stable
set search_path = ''
as $$
  with q as (
    select public.normalize_place_query(left(p_query, 80)) as term
  ),
  pattern as (
    -- Escapa los comodines de LIKE que escriba el usuario.
    select term,
      replace(replace(replace(term, '\', '\\'), '%', '\%'), '_', '\_') || '%' as prefix
    from q
    where char_length(term) >= 2
  ),
  hits as (
    select p.id, (p.name_norm = pt.term) as exact
    from public.places p, pattern pt
    where p.name_norm like pt.prefix
    union all
    select a.place_id, (a.alias_norm = pt.term)
    from public.place_aliases a, pattern pt
    where a.alias_norm like pt.prefix
  ),
  best as (
    select h.id, bool_or(h.exact) as exact from hits h group by h.id
  )
  select p.id, p.name, p.country_code, p.admin1, p.latitude, p.longitude, p.time_zone, p.population
  from best b
  join public.places p on p.id = b.id
  order by b.exact desc, p.population desc, p.name
  limit least(greatest(coalesce(p_limit, 8), 1), 20);
$$;

grant execute on function public.search_places(text, integer) to anon, authenticated;
grant execute on function public.normalize_place_query(text) to anon, authenticated;
