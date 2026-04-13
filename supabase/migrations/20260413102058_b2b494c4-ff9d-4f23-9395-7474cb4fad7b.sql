CREATE TABLE public.fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  added_by TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.fx_rates FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.fx_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.fx_rates FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.fx_rates FOR DELETE USING (true);