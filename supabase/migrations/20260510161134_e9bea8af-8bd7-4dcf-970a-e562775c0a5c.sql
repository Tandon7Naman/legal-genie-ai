CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role_text text;
  _role app_role;
BEGIN
  _role_text := NEW.raw_user_meta_data->>'role';

  INSERT INTO public.profiles (user_id, full_name, avatar_url, institution, expected_graduation_year, firm_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NEW.raw_user_meta_data->>'institution',
    CASE WHEN NEW.raw_user_meta_data->>'expected_graduation_year' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'expected_graduation_year')::integer
         ELSE NULL END,
    NEW.raw_user_meta_data->>'firm_name'
  );

  -- Only assign a role when one is explicitly provided (e.g. email signup form).
  -- OAuth signups (e.g. Google) will be prompted to pick a role on first login.
  IF _role_text IS NOT NULL AND _role_text <> '' THEN
    BEGIN
      _role := _role_text::app_role;
    EXCEPTION WHEN others THEN
      _role := 'individual_lawyer'::app_role;
    END;
    -- Never allow self-assignment of admin via signup metadata
    IF _role = 'admin'::app_role THEN
      _role := 'individual_lawyer'::app_role;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role);
  END IF;

  RETURN NEW;
END;
$function$;