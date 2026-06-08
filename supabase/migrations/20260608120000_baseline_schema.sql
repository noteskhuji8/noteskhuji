CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  university text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text NOT NULL,
  subject_slug text NOT NULL,
  university text NOT NULL,
  author text NOT NULL,
  pages integer NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  price integer NOT NULL DEFAULT 0,
  premium boolean NOT NULL DEFAULT false,
  cover text NOT NULL DEFAULT 'from-blue-500 via-indigo-500 to-violet-600',
  preview text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  description text NOT NULL DEFAULT '',
  semester text NOT NULL DEFAULT '',
  file_path text,
  status text NOT NULL DEFAULT 'pending',
  CONSTRAINT notes_status_check CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected']))
);

GRANT SELECT ON public.notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchases_user_id_note_id_key UNIQUE (user_id, note_id)
);

GRANT SELECT, INSERT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.payout_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  note_ids uuid[] NOT NULL DEFAULT '{}',
  paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

GRANT SELECT, INSERT ON public.payout_history TO authenticated;
GRANT ALL ON public.payout_history TO service_role;
ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

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
      AND role::text = _role::text
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, university)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'university'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notes_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    is_admin := public.has_role(auth.uid(), 'admin'::public.app_role);
  END IF;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.approved := false;
    NEW.status := 'pending';
    NEW.premium := false;
    NEW.price := 0;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.approved := OLD.approved;
    NEW.status := OLD.status;
    NEW.premium := OLD.premium;
    NEW.price := OLD.price;
    NEW.user_id := OLD.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS notes_guard_privileged_fields ON public.notes;
CREATE TRIGGER notes_guard_privileged_fields
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notes_guard_privileged_fields();

DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Approved notes are public" ON public.notes;
CREATE POLICY "Approved notes are public"
  ON public.notes
  FOR SELECT
  TO anon, authenticated
  USING ((approved = true) OR (status = 'approved'));

DROP POLICY IF EXISTS "Users can view own notes" ON public.notes;
CREATE POLICY "Users can view own notes"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notes" ON public.notes;
CREATE POLICY "Users can insert own notes"
  ON public.notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND auth.uid() = user_id
    AND approved = false
    AND status = 'pending'
    AND premium = false
    AND price = 0
  );

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND approved = (SELECT n.approved FROM public.notes AS n WHERE n.id = public.notes.id)
    AND status = (SELECT n.status FROM public.notes AS n WHERE n.id = public.notes.id)
    AND premium = (SELECT n.premium FROM public.notes AS n WHERE n.id = public.notes.id)
    AND price = (SELECT n.price FROM public.notes AS n WHERE n.id = public.notes.id)
  );

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes"
  ON public.notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notes" ON public.notes;
CREATE POLICY "Admins can view all notes"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update any note" ON public.notes;
CREATE POLICY "Admins can update any note"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own purchases" ON public.purchases;
CREATE POLICY "Users view own purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own purchases" ON public.purchases;
CREATE POLICY "Users create own purchases"
  ON public.purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
  ON public.purchases
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Authors can view own payouts" ON public.payout_history;
CREATE POLICY "Authors can view own payouts"
  ON public.payout_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can view payouts" ON public.payout_history;
CREATE POLICY "Admins can view payouts"
  ON public.payout_history
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert payouts" ON public.payout_history;
CREATE POLICY "Admins can insert payouts"
  ON public.payout_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    AND auth.uid() = paid_by
  );

DROP POLICY IF EXISTS "Owners upload own note files" ON storage.objects;
CREATE POLICY "Owners upload own note files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Owners read own note files" ON storage.objects;
CREATE POLICY "Owners read own note files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Owners delete own note files" ON storage.objects;
CREATE POLICY "Owners delete own note files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins can read note files" ON storage.objects;
CREATE POLICY "Admins can read note files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
