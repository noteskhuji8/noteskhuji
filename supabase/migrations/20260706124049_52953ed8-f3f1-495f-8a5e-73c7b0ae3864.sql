
-- 1) subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read_all" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects_admin_write" ON public.subjects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) universities
CREATE TABLE IF NOT EXISTS public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  logo TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.universities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.universities TO authenticated;
GRANT ALL ON public.universities TO service_role;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "universities_read_all" ON public.universities FOR SELECT USING (true);
CREATE POLICY "universities_admin_write" ON public.universities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) site_content (key/value JSON store for homepage & static blocks)
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content_read_all" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site_content_admin_write" ON public.site_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) notes: add ordering + featured flag (admin-controlled)
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS notes_featured_sort_idx
  ON public.notes (featured DESC, sort_order ASC, created_at DESC);

-- 5) shared updated_at trigger fn
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subjects_set_updated_at ON public.subjects;
CREATE TRIGGER subjects_set_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS universities_set_updated_at ON public.universities;
CREATE TRIGGER universities_set_updated_at BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS site_content_set_updated_at ON public.site_content;
CREATE TRIGGER site_content_set_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) seed initial rows so admin can immediately reorder/edit
INSERT INTO public.subjects (name, slug, description, icon, sort_order) VALUES
  ('Computer Science', 'computer-science', 'DSA, OS, DBMS and more', 'Code2', 10),
  ('Electrical Engineering', 'electrical-engineering', 'Circuits, DLD, Signals', 'Cpu', 20),
  ('Mathematics', 'mathematics', 'Calculus, Algebra, Statistics', 'Sigma', 30),
  ('Physics', 'physics', 'Mechanics, Waves, Modern Physics', 'Atom', 40),
  ('Chemistry', 'chemistry', 'Organic, Inorganic, Physical', 'FlaskConical', 50),
  ('Business', 'business', 'Accounting, Marketing, Management', 'Briefcase', 60),
  ('Economics', 'economics', 'Micro, Macro, Development', 'TrendingUp', 70),
  ('Literature', 'literature', 'Bangla & English literature', 'BookOpen', 80)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.universities (name, short, slug, city, sort_order) VALUES
  ('Bangladesh University of Engineering and Technology', 'BUET', 'buet', 'Dhaka', 10),
  ('University of Dhaka', 'DU', 'du', 'Dhaka', 20),
  ('North South University', 'NSU', 'nsu', 'Dhaka', 30),
  ('BRAC University', 'BRACU', 'bracu', 'Dhaka', 40),
  ('Chittagong University of Engineering and Technology', 'CUET', 'cuet', 'Chattogram', 50),
  ('Rajshahi University of Engineering and Technology', 'RUET', 'ruet', 'Rajshahi', 60),
  ('Independent University Bangladesh', 'IUB', 'iub', 'Dhaka', 70),
  ('American International University-Bangladesh', 'AIUB', 'aiub', 'Dhaka', 80)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_content (key, value) VALUES
  ('hero', '{"badge":"50,000+ students · 12,000+ notes","title_lead":"Find the perfect notes,","title_accent":"written by toppers.","subtitle":"NotesKhuji is Bangladesh''s home for premium university notes. Search by subject, preview before you buy, and learn from the best students in the country.","cta_primary":"Search","popular_tags":["DSA","Calculus","Organic Chemistry","DLD","Microeconomics"]}'::jsonb),
  ('cta_banner', '{"title":"Turn your notes into income","subtitle":"Upload once. Earn every time a student downloads.","button":"Start uploading"}'::jsonb),
  ('about', '{"headline":"Built by students, for students.","body":"NotesKhuji connects Bangladesh''s top note-takers with learners nationwide."}'::jsonb)
ON CONFLICT (key) DO NOTHING;
