CREATE POLICY "Admins can read note files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND public.has_role(auth.uid(), 'admin')
  );