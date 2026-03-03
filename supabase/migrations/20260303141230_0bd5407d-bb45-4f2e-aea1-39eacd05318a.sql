
-- Update handle_new_user to use the role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  -- Get role from user metadata, default to individual_lawyer
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'individual_lawyer'::app_role
  );

  INSERT INTO public.profiles (user_id, full_name, avatar_url, institution, expected_graduation_year)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NEW.raw_user_meta_data->>'institution',
    CASE WHEN NEW.raw_user_meta_data->>'expected_graduation_year' IS NOT NULL 
         THEN (NEW.raw_user_meta_data->>'expected_graduation_year')::integer 
         ELSE NULL END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;
