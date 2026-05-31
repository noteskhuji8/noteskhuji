-- payout_history: records of manual payouts to note authors
CREATE TABLE public.payout_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  note_ids uuid[] NOT NULL DEFAULT '{}',
  paid_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_history TO authenticated;
GRANT ALL ON public.payout_history TO service_role;

ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payouts"
ON public.payout_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payouts"
ON public.payout_history FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = paid_by);

CREATE POLICY "Authors can view own payouts"
ON public.payout_history FOR SELECT
TO authenticated
USING (auth.uid() = author_id);

-- Allow admins to read purchases for analytics
CREATE POLICY "Admins can view all purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles for author lookup
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_payout_history_author ON public.payout_history(author_id);
CREATE INDEX idx_payout_history_paid_at ON public.payout_history(paid_at DESC);