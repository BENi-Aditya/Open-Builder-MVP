-- ============ BUILD LOG MEDIA ============
CREATE TABLE IF NOT EXISTS public.build_log_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_log_id uuid NOT NULL REFERENCES public.build_logs(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS build_log_media_log_idx ON public.build_log_media(build_log_id, position);

ALTER TABLE public.build_log_media ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "build_log_media_select_all" ON public.build_log_media FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_media_insert_owner" ON public.build_log_media FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.build_logs bl WHERE bl.id = build_log_id AND bl.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_media_delete_owner" ON public.build_log_media FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.build_logs bl WHERE bl.id = build_log_id AND bl.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Migrate existing image_url data to build_log_media table
INSERT INTO public.build_log_media (build_log_id, url, position)
SELECT id, image_url, 0
FROM public.build_logs
WHERE image_url IS NOT NULL AND image_url != ''
ON CONFLICT DO NOTHING;

-- Note: We'll keep the image_url column for backward compatibility
-- but new uploads should use build_log_media table
