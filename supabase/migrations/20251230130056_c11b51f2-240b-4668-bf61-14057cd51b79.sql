-- Create CRM pipeline stages table
CREATE TABLE public.crm_pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies for pipeline stages
CREATE POLICY "Users can view own pipeline stages"
ON public.crm_pipeline_stages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipeline stages"
ON public.crm_pipeline_stages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline stages"
ON public.crm_pipeline_stages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipeline stages"
ON public.crm_pipeline_stages FOR DELETE
USING (auth.uid() = user_id);

-- Add CRM fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS crm_stage_id UUID REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deal_value NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS crm_notes TEXT;

-- Create CRM activities/notes table
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note', -- note, call, email, meeting, task
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for activities
CREATE POLICY "Users can view own activities"
ON public.crm_activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
ON public.crm_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
ON public.crm_activities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
ON public.crm_activities FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_crm_pipeline_stages_updated_at
BEFORE UPDATE ON public.crm_pipeline_stages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at
BEFORE UPDATE ON public.crm_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();