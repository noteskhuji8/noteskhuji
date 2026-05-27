
-- 1. Extend notes table
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS semester TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Backfill existing rows: previously-approved rows stay visible
UPDATE public.notes SET status = 'approved' WHERE approved = true AND status = 'pending';

-- Update RLS: public can only see approved notes (replaces the prior approved=true policy)
DROP POLICY IF EXISTS "Approved notes are public" ON public.notes;
CREATE POLICY "Approved notes are public"
  ON public.notes FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- 2. Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, note_id)
);

GRANT SELECT, INSERT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases"
  ON public.purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own purchases"
  ON public.purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Private storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: files are stored under `${user_id}/${uuid}.pdf`
CREATE POLICY "Owners upload own note files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners read own note files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners delete own note files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
