
-- 1) Storage: drop public-role policies on case-documents (keep authenticated-only versions if exist; else recreate)
DROP POLICY IF EXISTS "Users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own case documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload own case documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view own case documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can delete own case documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2) profiles: prevent user_id reassignment and free_access self-modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND free_access = (SELECT p.free_access FROM public.profiles p WHERE p.user_id = auth.uid())
);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) Multiple tables: add WITH CHECK to UPDATE policies
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['billable_hours','calendar_events','case_notes','cases','contracts','documents','hearings','invoices','saved_drafts','tasks','user_dashboard_layouts','user_preferences'];
  policy_names text[] := ARRAY[
    'Users can update own billable hours',
    'Users can update own events',
    'Users can update own case notes',
    'Users can update own cases',
    'Users can update own contracts',
    'Users can update own documents',
    'Users can update own hearings',
    'Users can update own invoices',
    'Users can update own drafts',
    'Users can update own tasks',
    'Users can update own layout',
    'Users can update own preferences'
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(tables,1) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_names[i], tables[i]);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      policy_names[i], tables[i]
    );
  END LOOP;
END $$;

-- 4) user_roles: explicitly prevent self-insert/update/delete by users
-- The existing "Admins can manage all roles" (ALL) policy already restricts to admins via has_role(),
-- but add explicit restrictive policy to be safe.
CREATE POLICY "Block non-admin role inserts"
ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block non-admin role updates"
ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block non-admin role deletes"
ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
