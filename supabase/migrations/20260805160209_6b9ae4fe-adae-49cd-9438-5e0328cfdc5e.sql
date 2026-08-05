-- 1) class_timetable_slots: explicit admin-only writes, class-scoped published reads
DROP POLICY IF EXISTS "admin full access class timetable" ON public.class_timetable_slots;
DROP POLICY IF EXISTS "class reads published timetable" ON public.class_timetable_slots;

CREATE POLICY "class timetable admin select"
ON public.class_timetable_slots FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "class timetable class reads published"
ON public.class_timetable_slots FOR SELECT TO authenticated
USING (published AND public.in_my_class(department, semester, section));

CREATE POLICY "class timetable admin insert"
ON public.class_timetable_slots FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "class timetable admin update"
ON public.class_timetable_slots FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "class timetable admin delete"
ON public.class_timetable_slots FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) events: explicit delete rules (admin all, others own only)
DROP POLICY IF EXISTS "author or class cr deletes events" ON public.events;

CREATE POLICY "events admin deletes any"
ON public.events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "events author deletes own"
ON public.events FOR DELETE TO authenticated
USING (author_id = auth.uid() AND public.in_my_class(department, semester, section));
