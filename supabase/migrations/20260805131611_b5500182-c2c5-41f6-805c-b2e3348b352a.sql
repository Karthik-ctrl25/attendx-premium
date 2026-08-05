ALTER TABLE public.class_timetable_slots REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'class_timetable_slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.class_timetable_slots;
  END IF;
END $$;