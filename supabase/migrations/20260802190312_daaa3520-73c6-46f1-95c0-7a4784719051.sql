ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS closed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.class_timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  day integer NOT NULL DEFAULT 1,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  faculty text NOT NULL DEFAULT '',
  room text NOT NULL DEFAULT '',
  session text NOT NULL DEFAULT 'Theory',
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_timetable_slots TO authenticated;
GRANT ALL ON public.class_timetable_slots TO service_role;

ALTER TABLE public.class_timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin full access class timetable"
ON public.class_timetable_slots FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "class reads published timetable"
ON public.class_timetable_slots FOR SELECT TO authenticated
USING (published AND public.in_my_class(department, semester, section));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_class_timetable_slots_updated_at ON public.class_timetable_slots;
CREATE TRIGGER update_class_timetable_slots_updated_at
BEFORE UPDATE ON public.class_timetable_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();