-- CR actions must be scoped to the CR's own class; admins keep full access.
DROP POLICY IF EXISTS "author or cr updates announcements" ON public.announcements;
DROP POLICY IF EXISTS "author or cr deletes announcements" ON public.announcements;
CREATE POLICY "author or class cr updates announcements" ON public.announcements
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "author or class cr deletes announcements" ON public.announcements
  FOR DELETE TO authenticated
  USING (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "author or cr updates polls" ON public.polls;
DROP POLICY IF EXISTS "author or cr deletes polls" ON public.polls;
CREATE POLICY "author or class cr updates polls" ON public.polls
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "author or class cr deletes polls" ON public.polls
  FOR DELETE TO authenticated
  USING (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "author or cr updates events" ON public.events;
DROP POLICY IF EXISTS "author or cr deletes events" ON public.events;
CREATE POLICY "author or class cr updates events" ON public.events
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "author or class cr deletes events" ON public.events
  FOR DELETE TO authenticated
  USING (author_id = auth.uid()
    OR (public.has_role(auth.uid(), 'cr') AND public.in_my_class(department, semester, section))
    OR public.has_role(auth.uid(), 'admin'));

-- Admin full access.
CREATE POLICY "admin full access profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access subjects" ON public.subjects
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access attendance history" ON public.attendance_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access attendance imports" ON public.attendance_imports
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access timetable" ON public.timetable_slots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access polls" ON public.polls
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access poll votes" ON public.poll_votes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin full access cr requests" ON public.cr_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));