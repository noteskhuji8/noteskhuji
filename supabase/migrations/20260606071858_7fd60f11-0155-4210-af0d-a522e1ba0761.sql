
-- 1) Default new notes to unapproved/pending
ALTER TABLE public.notes ALTER COLUMN approved SET DEFAULT false;
ALTER TABLE public.notes ALTER COLUMN status SET DEFAULT 'pending';

-- 2) Require user_id on new rows and tighten insert policy
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

-- 3) Prevent owners from changing approved/premium/price on their own notes
DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND approved = (SELECT n.approved FROM public.notes n WHERE n.id = notes.id)
    AND status   = (SELECT n.status   FROM public.notes n WHERE n.id = notes.id)
    AND premium  = (SELECT n.premium  FROM public.notes n WHERE n.id = notes.id)
    AND price    = (SELECT n.price    FROM public.notes n WHERE n.id = notes.id)
  );

-- 4) Defense in depth: trigger that blocks non-admins from touching privileged fields
CREATE OR REPLACE FUNCTION public.notes_guard_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean := false;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  END IF;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.approved := false;
    NEW.status   := 'pending';
    NEW.premium  := false;
    NEW.price    := 0;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.approved := OLD.approved;
    NEW.status   := OLD.status;
    NEW.premium  := OLD.premium;
    NEW.price    := OLD.price;
    NEW.user_id  := OLD.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notes_guard_privileged_fields ON public.notes;
CREATE TRIGGER notes_guard_privileged_fields
  BEFORE INSERT OR UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notes_guard_privileged_fields();
