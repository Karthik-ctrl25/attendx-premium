CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Real (elevated) implementations live outside the API-exposed schema.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION private.in_my_class(_department text, _semester text, _section text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.department = _department
      AND p.semester = _semester
      AND p.section = _section
  );
$$;

CREATE OR REPLACE FUNCTION private.my_class()
RETURNS TABLE(department text, semester text, section text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.department, p.semester, p.section FROM public.profiles p WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.in_my_class(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.my_class() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.in_my_class(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.my_class() TO authenticated, service_role;

-- Public names stay, but as SECURITY INVOKER pass-throughs so every existing
-- RLS policy and the app's has_role RPC keep working unchanged.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT private.has_role(_user_id, _role);
$$;

CREATE OR REPLACE FUNCTION public.in_my_class(_department text, _semester text, _section text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT private.in_my_class(_department, _semester, _section);
$$;

CREATE OR REPLACE FUNCTION public.my_class()
RETURNS TABLE(department text, semester text, section text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT * FROM private.my_class();
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.in_my_class(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_class() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.in_my_class(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_class() TO authenticated, service_role;