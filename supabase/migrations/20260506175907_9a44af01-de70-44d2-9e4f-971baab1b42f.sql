CREATE POLICY "Users can update own case documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'case-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'case-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);