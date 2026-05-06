
-- Remove duplicate storage policies on case-documents bucket (keep "Authenticated users can ..." set)
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;

-- Add WITH CHECK to clients update policy
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add WITH CHECK to communication_log update policy
DROP POLICY IF EXISTS "Users can update own communication logs" ON public.communication_log;
CREATE POLICY "Users can update own communication logs"
  ON public.communication_log
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
