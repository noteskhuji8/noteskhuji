-- 1. Create the missing has_role helper function first
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, requested_role text)
RETURNS boolean 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
      AND user_roles.role = $2
  );
END;
$$;

-- 2. Handle profiles table safely (Fixes relation profiles already exists error)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  university text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create payout_history safely
CREATE TABLE IF NOT EXISTS public.payout_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  note_ids uuid[] NOT NULL DEFAULT '{}',
  paid_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- 4. Setup permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_history TO authenticated;
GRANT ALL ON public.payout_history TO service_role;

-- 5. Enable RLS
ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

-- 6. Safe Payout Policies (Drops them first to overwrite clean if they exist)
DROP POLICY IF EXISTS "Admins can view payouts" ON public.payout_history;
CREATE POLICY "Admins can view payouts"
ON public.payout_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert payouts" ON public.payout_history;
CREATE POLICY "Admins can insert payouts"
ON public.payout_history FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = paid_by);

DROP POLICY IF EXISTS "Authors can view own payouts" ON public.payout_history;
CREATE POLICY "Authors can view own payouts"
ON public.payout_history FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- 7. Safe Foreign Table Policies
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Safe Index Creation
CREATE INDEX IF NOT EXISTS idx_payout_history_author ON public.payout_history(author_id);
CREATE INDEX IF NOT EXISTS idx_payout_history_paid_at ON public.payout_history(paid_at DESC);
