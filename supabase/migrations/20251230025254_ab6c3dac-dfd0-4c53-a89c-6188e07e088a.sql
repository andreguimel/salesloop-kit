-- Add unique constraint to prevent duplicate phone numbers per company
ALTER TABLE public.company_phones 
ADD CONSTRAINT unique_company_phone UNIQUE (company_id, phone_number);