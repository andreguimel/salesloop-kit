import { supabase } from '@/integrations/supabase/client';
import { Company, MessageTemplate } from '@/types';

// Companies
export async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_phones (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createCompany(company: Omit<Company, 'id' | 'phones' | 'messageStatus'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      name: company.name,
      cnae: company.cnae,
      cnae_description: company.cnaeDescription,
      city: company.city,
      state: company.state,
      segment: company.segment,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addPhoneToCompany(companyId: string, phoneNumber: string, phoneType: string, status: string) {
  const { data, error } = await supabase
    .from('company_phones')
    .insert({
      company_id: companyId,
      phone_number: phoneNumber,
      phone_type: phoneType,
      status: status,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePhoneStatus(phoneId: string, status: string) {
  const { error } = await supabase
    .from('company_phones')
    .update({ status })
    .eq('id', phoneId);

  if (error) throw error;
}

// Message Templates
export async function fetchTemplates() {
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      user_id: user.id,
      name: template.name,
      content: template.content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, template: Partial<Omit<MessageTemplate, 'id' | 'createdAt'>>) {
  const { error } = await supabase
    .from('message_templates')
    .update({
      name: template.name,
      content: template.content,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Message History
export async function sendMessage(
  companyId: string,
  phoneId: string,
  templateId: string | null,
  channel: 'whatsapp' | 'sms',
  messageContent: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('message_history')
    .insert({
      user_id: user.id,
      company_id: companyId,
      phone_id: phoneId,
      template_id: templateId,
      channel,
      message_content: messageContent,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMessageHistory() {
  const { data, error } = await supabase
    .from('message_history')
    .select(`
      *,
      companies (name),
      company_phones (phone_number),
      message_templates (name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Dashboard metrics
export async function fetchMetrics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [companiesResult, phonesResult, messagesResult] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact' }),
    supabase.from('company_phones').select('id, status'),
    supabase.from('message_history').select('id, status'),
  ]);

  const totalCompanies = companiesResult.count || 0;
  const validPhones = phonesResult.data?.filter(p => p.status === 'valid').length || 0;
  const messagesSent = messagesResult.data?.filter(m => m.status === 'sent' || m.status === 'delivered').length || 0;
  const pendingMessages = messagesResult.data?.filter(m => m.status === 'pending').length || 0;

  return { totalCompanies, validPhones, messagesSent, pendingMessages };
}
