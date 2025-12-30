-- Add CNPJ and address columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS cep text;

-- Create index for CNPJ for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);