CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', false)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public;

DROP POLICY IF EXISTS "Owners upload own note files" ON storage.objects;
CREATE POLICY "Owners upload own note files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Owners read own note files" ON storage.objects;
CREATE POLICY "Owners read own note files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Owners delete own note files" ON storage.objects;
CREATE POLICY "Owners delete own note files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins can read note files" ON storage.objects;
CREATE POLICY "Admins can read note files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );