CREATE OR REPLACE FUNCTION public.set_initial_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot self-assign admin role';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'Role already assigned';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role);
END;
$$;

REVOKE ALL ON FUNCTION public.set_initial_role(app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_initial_role(app_role) TO authenticated;