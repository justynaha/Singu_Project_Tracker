ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS fund_id text,
  ADD COLUMN IF NOT EXISTS cc_code text,
  ADD COLUMN IF NOT EXISTS area_sqm numeric,
  ADD COLUMN IF NOT EXISTS budget_eur numeric;