
-- Download history tracking
CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS downloads_note_id_idx ON public.downloads(note_id);
CREATE INDEX IF NOT EXISTS downloads_user_id_idx ON public.downloads(user_id);
CREATE INDEX IF NOT EXISTS downloads_user_downloaded_idx ON public.downloads(user_id, downloaded_at DESC);

GRANT SELECT, INSERT ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own downloads" ON public.downloads;
CREATE POLICY "Users can view their own downloads"
  ON public.downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all downloads" ON public.downloads;
CREATE POLICY "Admins can view all downloads"
  ON public.downloads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Atomic increment of notes.downloads + history insert
CREATE OR REPLACE FUNCTION public.record_note_download(_note_id UUID, _user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.downloads (note_id, user_id) VALUES (_note_id, _user_id);
  UPDATE public.notes
     SET downloads = COALESCE(downloads, 0) + 1
   WHERE id = _note_id
   RETURNING downloads INTO new_count;
  RETURN new_count;
END;
$$;
