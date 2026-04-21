CREATE TABLE public.site_budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id text NOT NULL UNIQUE,
  budget_lc numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PLN',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.site_budgets FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.site_budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.site_budgets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.site_budgets FOR DELETE USING (true);

CREATE TRIGGER update_site_budgets_updated_at
BEFORE UPDATE ON public.site_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();