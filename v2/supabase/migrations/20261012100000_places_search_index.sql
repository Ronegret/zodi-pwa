-- Zodi v2 · search_places usando el índice.
-- Con `like <patrón calculado>` el planificador no puede usar el índice
-- text_pattern_ops (el patrón no es constante) y recorría las 236k filas
-- (~45 ms incluso sin resultados). Con un rango explícito ~>=~ / ~<~ el
-- índice sí se usa. Además el rango compara literal: los comodines que
-- escriba el usuario (% _) ya no significan nada.

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
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_term text := public.normalize_place_query(left(p_query, 80));
  v_upper text;
  v_limit integer := least(greatest(coalesce(p_limit, 8), 1), 20);
begin
  if char_length(v_term) < 2 then
    return;
  end if;
  -- Todo lo que empieza por v_term queda en [v_term, v_term || U+10FFFF).
  v_upper := v_term || chr(1114111);

  return query
  with hits as (
    select p.id as place_id, (p.name_norm = v_term) as exact
    from public.places p
    where p.name_norm ~>=~ v_term and p.name_norm ~<~ v_upper
    union all
    select a.place_id, (a.alias_norm = v_term)
    from public.place_aliases a
    where a.alias_norm ~>=~ v_term and a.alias_norm ~<~ v_upper
  ),
  best as (
    select h.place_id, bool_or(h.exact) as exact from hits h group by h.place_id
  )
  select p.id, p.name, p.country_code, p.admin1, p.latitude, p.longitude, p.time_zone, p.population
  from best b
  join public.places p on p.id = b.place_id
  order by b.exact desc, p.population desc, p.name
  limit v_limit;
end;
$$;

grant execute on function public.search_places(text, integer) to anon, authenticated;
