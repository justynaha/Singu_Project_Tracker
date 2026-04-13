CREATE TABLE public.monthly_breakdown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  label text NOT NULL DEFAULT '',
  apr numeric DEFAULT 0, may numeric DEFAULT 0, jun numeric DEFAULT 0,
  jul numeric DEFAULT 0, aug numeric DEFAULT 0, sep numeric DEFAULT 0,
  oct numeric DEFAULT 0, nov numeric DEFAULT 0, dec numeric DEFAULT 0,
  jan numeric DEFAULT 0, feb numeric DEFAULT 0, mar numeric DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_breakdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.monthly_breakdown FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON public.monthly_breakdown FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.monthly_breakdown FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete" ON public.monthly_breakdown FOR DELETE TO public USING (true);

CREATE TRIGGER update_monthly_breakdown_updated_at
BEFORE UPDATE ON public.monthly_breakdown
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();