-- Create table for CRM stage history
CREATE TABLE public.crm_stage_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    from_stage_id UUID REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
    to_stage_id UUID REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
    from_stage_name TEXT,
    to_stage_name TEXT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_stage_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own stage history" 
ON public.crm_stage_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stage history" 
ON public.crm_stage_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_crm_stage_history_company_id ON public.crm_stage_history(company_id);
CREATE INDEX idx_crm_stage_history_changed_at ON public.crm_stage_history(changed_at DESC);