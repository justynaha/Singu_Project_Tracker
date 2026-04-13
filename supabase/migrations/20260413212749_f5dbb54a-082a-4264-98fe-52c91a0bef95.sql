CREATE TABLE public.timeline_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timeline_item_id UUID NOT NULL REFERENCES public.timeline_items(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'User',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visibility TEXT NOT NULL DEFAULT 'private'
);

ALTER TABLE public.timeline_item_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.timeline_item_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.timeline_item_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.timeline_item_comments FOR DELETE USING (true);
CREATE POLICY "Allow public update" ON public.timeline_item_comments FOR UPDATE USING (true);

CREATE INDEX idx_tic_item_id ON public.timeline_item_comments(timeline_item_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

CREATE POLICY "Allow public upload project-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Allow public read project-files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Allow public delete project-files" ON storage.objects FOR DELETE USING (bucket_id = 'project-files');