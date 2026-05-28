
alter table public.notes replica identity full;
alter publication supabase_realtime add table public.notes;
