
-- 1. Announcements: only CR (in class) or admin may create
DROP POLICY IF EXISTS "class creates announcements" ON public.announcements;
CREATE POLICY "cr or admin creates announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 2. Events: only CR (in class) or admin may create
DROP POLICY IF EXISTS "class creates events" ON public.events;
CREATE POLICY "cr or admin creates events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 3. Events: updates limited to the author (in class) or admin
DROP POLICY IF EXISTS "author or class cr updates events" ON public.events;
CREATE POLICY "author or admin updates events"
ON public.events FOR UPDATE TO authenticated
USING (
  (author_id = auth.uid() AND public.in_my_class(department, semester, section))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (author_id = auth.uid() AND public.in_my_class(department, semester, section))
  OR public.has_role(auth.uid(), 'admin')
);

-- 4. Profiles: email / USN / photo visible only to the owner and admins
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
