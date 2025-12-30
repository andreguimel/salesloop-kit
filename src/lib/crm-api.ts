import { supabase } from '@/integrations/supabase/client';
import { PipelineStage, CrmActivity, Company } from '@/types';

// Pipeline Stages
export async function fetchPipelineStages(): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from('crm_pipeline_stages')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching pipeline stages:', error);
    throw new Error('Erro ao carregar estágios do pipeline');
  }

  return (data || []).map(stage => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    position: stage.position,
  }));
}

export async function createPipelineStage(stage: Omit<PipelineStage, 'id'>): Promise<PipelineStage> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('crm_pipeline_stages')
    .insert({
      user_id: userData.user.id,
      name: stage.name,
      color: stage.color,
      position: stage.position,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating pipeline stage:', error);
    throw new Error('Erro ao criar estágio do pipeline');
  }

  return {
    id: data.id,
    name: data.name,
    color: data.color,
    position: data.position,
  };
}

export async function updatePipelineStage(id: string, updates: Partial<PipelineStage>): Promise<void> {
  const { error } = await supabase
    .from('crm_pipeline_stages')
    .update({
      name: updates.name,
      color: updates.color,
      position: updates.position,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating pipeline stage:', error);
    throw new Error('Erro ao atualizar estágio do pipeline');
  }
}

export async function deletePipelineStage(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_pipeline_stages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting pipeline stage:', error);
    throw new Error('Erro ao excluir estágio do pipeline');
  }
}

export async function reorderPipelineStages(stages: { id: string; position: number }[]): Promise<void> {
  for (const stage of stages) {
    const { error } = await supabase
      .from('crm_pipeline_stages')
      .update({ position: stage.position })
      .eq('id', stage.id);

    if (error) {
      console.error('Error reordering pipeline stage:', error);
      throw new Error('Erro ao reordenar estágios');
    }
  }
}

// Company CRM Updates
export async function updateCompanyCrmStage(companyId: string, stageId: string | null): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ crm_stage_id: stageId })
    .eq('id', companyId);

  if (error) {
    console.error('Error updating company CRM stage:', error);
    throw new Error('Erro ao atualizar estágio da empresa');
  }
}

export async function updateCompanyDealValue(companyId: string, dealValue: number): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ deal_value: dealValue })
    .eq('id', companyId);

  if (error) {
    console.error('Error updating deal value:', error);
    throw new Error('Erro ao atualizar valor do negócio');
  }
}

export async function updateCompanyExpectedCloseDate(companyId: string, date: string | null): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ expected_close_date: date })
    .eq('id', companyId);

  if (error) {
    console.error('Error updating expected close date:', error);
    throw new Error('Erro ao atualizar data prevista');
  }
}

// CRM Activities
export async function fetchActivities(companyId?: string): Promise<CrmActivity[]> {
  let query = supabase
    .from('crm_activities')
    .select(`
      *,
      companies (
        id,
        name,
        city,
        state
      )
    `)
    .order('created_at', { ascending: false });

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activities:', error);
    throw new Error('Erro ao carregar atividades');
  }

  return (data || []).map(activity => ({
    id: activity.id,
    companyId: activity.company_id,
    activityType: activity.activity_type as CrmActivity['activityType'],
    title: activity.title,
    description: activity.description,
    isCompleted: activity.is_completed,
    dueDate: activity.due_date,
    completedAt: activity.completed_at,
    createdAt: activity.created_at,
    company: activity.companies ? {
      id: activity.companies.id,
      name: activity.companies.name,
      city: activity.companies.city,
      state: activity.companies.state,
    } as Company : undefined,
  }));
}

export async function createActivity(activity: Omit<CrmActivity, 'id' | 'createdAt' | 'company'>): Promise<CrmActivity> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      user_id: userData.user.id,
      company_id: activity.companyId,
      activity_type: activity.activityType,
      title: activity.title,
      description: activity.description,
      is_completed: activity.isCompleted,
      due_date: activity.dueDate,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    throw new Error('Erro ao criar atividade');
  }

  return {
    id: data.id,
    companyId: data.company_id,
    activityType: data.activity_type as CrmActivity['activityType'],
    title: data.title,
    description: data.description,
    isCompleted: data.is_completed,
    dueDate: data.due_date,
    completedAt: data.completed_at,
    createdAt: data.created_at,
  };
}

export async function updateActivity(id: string, updates: Partial<CrmActivity>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.isCompleted !== undefined) {
    updateData.is_completed = updates.isCompleted;
    if (updates.isCompleted) {
      updateData.completed_at = new Date().toISOString();
    }
  }
  if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;

  const { error } = await supabase
    .from('crm_activities')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating activity:', error);
    throw new Error('Erro ao atualizar atividade');
  }
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_activities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting activity:', error);
    throw new Error('Erro ao excluir atividade');
  }
}

// Fetch companies with CRM data
export async function fetchCompaniesWithCrmData(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_phones (
        id,
        phone_number,
        phone_type,
        status
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching companies with CRM data:', error);
    throw new Error('Erro ao carregar empresas');
  }

  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    cnpj: c.cnpj || undefined,
    cnae: c.cnae,
    cnaeDescription: c.cnae_description || '',
    city: c.city,
    state: c.state,
    address: c.address || undefined,
    cep: c.cep || undefined,
    segment: c.segment || '',
    website: c.website || undefined,
    email: c.email || undefined,
    instagram: c.instagram || undefined,
    facebook: c.facebook || undefined,
    linkedin: c.linkedin || undefined,
    aiSummary: c.ai_summary || undefined,
    enrichedAt: c.enriched_at || undefined,
    crmStageId: c.crm_stage_id || undefined,
    dealValue: c.deal_value ? Number(c.deal_value) : undefined,
    expectedCloseDate: c.expected_close_date || undefined,
    crmNotes: c.crm_notes || undefined,
    phones: (c.company_phones || []).map((p: { id: string; phone_number: string; phone_type: string; status: string }) => ({
      id: p.id,
      number: p.phone_number,
      type: p.phone_type as 'mobile' | 'landline',
      status: p.status as 'valid' | 'uncertain' | 'invalid' | 'pending',
    })),
    messageStatus: 'none' as const,
  }));
}

// CRM Metrics
export interface CrmMetrics {
  totalLeads: number;
  totalDealValue: number;
  pendingTasks: number;
  stageDistribution: { stageId: string; stageName: string; count: number; value: number }[];
}

export async function fetchCrmMetrics(): Promise<CrmMetrics> {
  const [companies, stages, activities] = await Promise.all([
    fetchCompaniesWithCrmData(),
    fetchPipelineStages(),
    fetchActivities(),
  ]);

  const totalLeads = companies.filter(c => c.crmStageId).length;
  const totalDealValue = companies.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const pendingTasks = activities.filter(a => a.activityType === 'task' && !a.isCompleted).length;

  const stageDistribution = stages.map(stage => {
    const stageCompanies = companies.filter(c => c.crmStageId === stage.id);
    return {
      stageId: stage.id,
      stageName: stage.name,
      count: stageCompanies.length,
      value: stageCompanies.reduce((sum, c) => sum + (c.dealValue || 0), 0),
    };
  });

  return {
    totalLeads,
    totalDealValue,
    pendingTasks,
    stageDistribution,
  };
}
