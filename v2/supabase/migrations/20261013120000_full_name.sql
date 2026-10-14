-- Zodi v2 · Nombre completo (con apellidos) para el significado del nombre, y
-- descripción larga en los nombres que investiga la IA.

alter table public.profiles add column if not exists full_name text
  check (full_name is null or char_length(btrim(full_name)) between 1 and 80);
grant update (full_name) on table public.profiles to authenticated;

alter table public.name_meanings add column if not exists detail text
  check (detail is null or char_length(detail) <= 500);
