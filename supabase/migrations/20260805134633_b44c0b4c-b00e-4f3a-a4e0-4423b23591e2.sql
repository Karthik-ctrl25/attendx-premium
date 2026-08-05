-- 1. Normalisation helper: trim, collapse inner whitespace, strip zero-width chars
CREATE OR REPLACE FUNCTION public.norm_text(_v text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT btrim(regexp_replace(regexp_replace(coalesce(_v,''), '[\u200B-\u200D\uFEFF\u00A0]', ' ', 'g'), '\s+', ' ', 'g'));
$$;

-- 2. Backfill existing rows
UPDATE public.profiles SET
  department = public.norm_text(department),
  semester   = public.norm_text(semester),
  section    = upper(public.norm_text(section)),
  usn        = upper(replace(public.norm_text(usn), ' ', ''));

UPDATE public.class_timetable_slots SET
  department = public.norm_text(department),
  semester   = public.norm_text(semester),
  section    = upper(public.norm_text(section));

-- 3. Keep them normalised going forward
CREATE OR REPLACE FUNCTION public.normalize_profile_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.department := public.norm_text(NEW.department);
  NEW.semester   := public.norm_text(NEW.semester);
  NEW.section    := upper(public.norm_text(NEW.section));
  NEW.usn        := upper(replace(public.norm_text(NEW.usn), ' ', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_profiles_scope ON public.profiles;
CREATE TRIGGER normalize_profiles_scope
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_scope();

CREATE OR REPLACE FUNCTION public.normalize_class_scope()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.department := public.norm_text(NEW.department);
  NEW.semester   := public.norm_text(NEW.semester);
  NEW.section    := upper(public.norm_text(NEW.section));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_class_timetable_scope ON public.class_timetable_slots;
CREATE TRIGGER normalize_class_timetable_scope
BEFORE INSERT OR UPDATE ON public.class_timetable_slots
FOR EACH ROW EXECUTE FUNCTION public.normalize_class_scope();

-- 4. One student per USN
CREATE UNIQUE INDEX IF NOT EXISTS profiles_usn_unique
  ON public.profiles (usn) WHERE usn <> '';

-- 5. Availability check that does not leak other profiles
CREATE OR REPLACE FUNCTION private.usn_available(_usn text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.usn = upper(replace(public.norm_text(_usn), ' ', ''))
      AND p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;
REVOKE ALL ON FUNCTION private.usn_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.usn_available(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.usn_available(_usn text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT private.usn_available(_usn);
$$;
REVOKE ALL ON FUNCTION public.usn_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usn_available(text) TO authenticated, service_role;