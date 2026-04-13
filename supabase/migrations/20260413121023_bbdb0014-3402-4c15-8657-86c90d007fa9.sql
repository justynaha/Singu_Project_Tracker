
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_number text NOT NULL,
  contract_date date,
  amount_lc numeric,
  amount_eur numeric,
  status text NOT NULL DEFAULT 'Draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.contracts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.contracts FOR DELETE USING (true);

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
