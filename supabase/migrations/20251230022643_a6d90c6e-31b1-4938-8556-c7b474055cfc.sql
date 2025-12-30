-- Add enrichment fields to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS facebook text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enriched_at timestamp with time zone;