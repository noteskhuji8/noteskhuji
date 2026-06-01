-- Idempotent: drop existing policy first so re-running this migration succeeds.
DROP POLICY IF EXISTS "Admins can read note files" ON storage.objects;

CREATE POLICY "Admins can read note files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
