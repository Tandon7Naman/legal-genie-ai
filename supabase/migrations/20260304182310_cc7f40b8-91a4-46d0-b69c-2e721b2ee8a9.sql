
-- Update handle_new_user to also store firm_name
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

-- Create storage policies for case-documents bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
