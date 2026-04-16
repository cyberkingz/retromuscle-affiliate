-- Drop legacy tables that are no longer referenced by application code.
-- mix_definitions and package_definitions were part of a discarded pricing model.
-- Both tables are empty in production and have no FK dependencies from live tables.

drop table if exists public.mix_definitions cascade;
drop table if exists public.package_definitions cascade;
