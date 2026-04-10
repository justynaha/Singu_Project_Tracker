
CREATE TABLE public.project_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_template_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  parent_id UUID REFERENCES public.project_types(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.project_types FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.project_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.project_types FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.project_types FOR DELETE USING (true);
