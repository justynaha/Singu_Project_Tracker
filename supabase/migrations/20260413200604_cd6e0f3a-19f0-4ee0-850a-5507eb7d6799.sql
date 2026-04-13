
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  amount_lc numeric NOT NULL DEFAULT 0,
  attachment_name text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.invoices FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON public.invoices FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.invoices FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete" ON public.invoices FOR DELETE TO public USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('contract-attachments', 'contract-attachments', true);

CREATE POLICY "Allow public read contract attachments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'contract-attachments');
CREATE POLICY "Allow public upload contract attachments" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'contract-attachments');
CREATE POLICY "Allow public delete contract attachments" ON storage.objects FOR DELETE TO public USING (bucket_id = 'contract-attachments');
