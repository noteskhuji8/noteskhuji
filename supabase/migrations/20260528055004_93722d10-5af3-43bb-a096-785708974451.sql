alter table public.notes replica identity full;

DO $$ BEGIN
  alter publication supabase_realtime add table public.notes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
