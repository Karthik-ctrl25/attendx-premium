-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('student', 'cr', 'admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  usn text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  photo text,
  department text NOT NULL DEFAULT '',
  semester text NOT NULL DEFAULT '',
  section text NOT NULL DEFAULT '',
  university text NOT NULL DEFAULT 'CMR University',
  theme text NOT NULL DEFAULT 'light',
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_time text NOT NULL DEFAULT '19:00',
  last_verified_at timestamptz,
  setup_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.roles WHERE user_id = _user_id AND role = _role);
$$;

-- Class scope of the signed-in student (security definer avoids RLS recursion).
CREATE OR REPLACE FUNCTION public.my_class()
RETURNS TABLE (department text, semester text, section text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.department, p.semester, p.section FROM public.profiles p WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.in_my_class(_department text, _semester text, _section text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.department = _department
      AND p.semester = _semester
      AND p.section = _section
  );
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.in_my_class(department, semester, section));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

CREATE POLICY "read own roles" ON public.roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- PRIVATE STUDENT DATA --------------------------------------------------
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL DEFAULT '',
  faculty text NOT NULL DEFAULT '',
  present integer NOT NULL DEFAULT 0,
  absent integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subjects" ON public.subjects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.attendance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id text NOT NULL,
  subject_code text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  marked_on date NOT NULL DEFAULT current_date,
  ts timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, local_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_history TO authenticated;
GRANT ALL ON public.attendance_history TO service_role;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attendance history" ON public.attendance_history FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.attendance_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id text NOT NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  fingerprint text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (user_id, local_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_imports TO authenticated;
GRANT ALL ON public.attendance_imports TO service_role;
ALTER TABLE public.attendance_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own imports" ON public.attendance_imports FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id text NOT NULL,
  day integer NOT NULL DEFAULT 0,
  start_time text NOT NULL DEFAULT '',
  end_time text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  faculty text NOT NULL DEFAULT '',
  room text NOT NULL DEFAULT '',
  session text NOT NULL DEFAULT '',
  UNIQUE (user_id, local_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_slots TO authenticated;
GRANT ALL ON public.timetable_slots TO service_role;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own timetable" ON public.timetable_slots FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CLASS SPACE -----------------------------------------------------------
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class reads announcements" ON public.announcements FOR SELECT TO authenticated
  USING (public.in_my_class(department, semester, section));
CREATE POLICY "class creates announcements" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.in_my_class(department, semester, section));
CREATE POLICY "author or cr updates announcements" ON public.announcements FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "author or cr deletes announcements" ON public.announcements FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  question text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class reads polls" ON public.polls FOR SELECT TO authenticated
  USING (public.in_my_class(department, semester, section));
CREATE POLICY "class creates polls" ON public.polls FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.in_my_class(department, semester, section));
CREATE POLICY "author or cr updates polls" ON public.polls FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "author or cr deletes polls" ON public.polls FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  choice text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class reads votes" ON public.poll_votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.in_my_class(p.department, p.semester, p.section)));
CREATE POLICY "vote once" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.in_my_class(p.department, p.semester, p.section)));
CREATE POLICY "own vote update" ON public.poll_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own vote delete" ON public.poll_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  title text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'event',
  date date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class reads events" ON public.events FOR SELECT TO authenticated
  USING (public.in_my_class(department, semester, section));
CREATE POLICY "class creates events" ON public.events FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.in_my_class(department, semester, section));
CREATE POLICY "author or cr updates events" ON public.events FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "author or cr deletes events" ON public.events FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'cr') OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.cr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text NOT NULL,
  semester text NOT NULL,
  section text NOT NULL,
  name text NOT NULL DEFAULT '',
  usn text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cr_requests TO authenticated;
GRANT ALL ON public.cr_requests TO service_role;
ALTER TABLE public.cr_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or class cr requests read" ON public.cr_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (public.has_role(auth.uid(), 'admin') AND public.in_my_class(department, semester, section)));
CREATE POLICY "apply for cr" ON public.cr_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin reviews cr" ON public.cr_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own cr request delete" ON public.cr_requests FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ROLE WRITES (admin only) ---------------------------------------------
CREATE POLICY "admin manages roles" ON public.roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- New users get a profile row and the student role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, student_name, email, photo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
