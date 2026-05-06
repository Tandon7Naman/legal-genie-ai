CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'individual_lawyer'::app_role
  );
  -- Never allow self-assignment of admin via signup metadata
  IF _role = 'admin'::app_role THEN
    _role := 'individual_lawyer'::app_role;
  END IF;

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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$function$;

CREATE POLICY "Users can update own conflict checks"
ON public.conflict_checks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conflict checks"
ON public.conflict_checks
FOR DELETE TO authenticated
USING (auth.uid() = user_id);