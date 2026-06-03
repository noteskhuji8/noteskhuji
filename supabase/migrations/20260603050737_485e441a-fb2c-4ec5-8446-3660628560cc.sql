-- Ensure the 'approved' column exists on public.notes before any policy references it.
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Re-create the policy idempotently so fresh pipelines don't fail on the prior migration.
DROP POLICY IF EXISTS "Approved notes are public" ON public.notes;
CREATE POLICY "Approved notes are public"
  ON public.notes
  FOR SELECT
  TO anon, authenticated
  USING (approved = true OR status = 'approved');
