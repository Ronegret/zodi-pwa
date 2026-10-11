-- Zodi v2 · Distingue "no sé la hora" (false) de "aún no contestado" (null).
-- Sin hora conocida no se muestran casas ni Ascendente.

alter table public.profiles add column if not exists birth_time_known boolean;

grant update (birth_time_known) on table public.profiles to authenticated;
