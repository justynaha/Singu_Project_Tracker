ALTER TABLE public.timeline_items 
  ADD COLUMN comments text,
  ADD COLUMN responsible text,
  ADD COLUMN start_date date;