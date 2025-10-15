-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-files', 'note-files', false);

-- Storage policies for note-files bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'note-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'note-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'note-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add file_path column to notes table
ALTER TABLE public.notes
ADD COLUMN file_path text,
ADD COLUMN topics jsonb;