import { supabase } from '@/integrations/supabase/client';
import { Company, MessageTemplate } from '@/types';

// Search Company by CNPJ via CNPJ.ws API
export interface SearchCompanyResult {
  cnpj: string;
  name: string;
  fantasyName: string;
  cnae: string;
  cnaeDescription: string;
  city: string;
  state: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  number: string;
  neighborhood: string;
  cep: string;
  // Additional data from CNPJ.ws
  capitalSocial?: string;
  naturezaJuridica?: string;
  porte?: string;
  situacao?: string;
  dataAbertura?: string;
}

export interface SearchCompanyByCnpjResponse {
  company: SearchCompanyResult;
  success: boolean;
}

export async function searchCompanyByCnpj(cnpj: string): Promise<SearchCompanyByCnpjResponse> {
  const { data, error } = await supabase.functions.invoke('search-companies', {
    body: { cnpj },
  });

  if (error) {
    console.error('Error searching company:', error);
    throw new Error(error.message || 'Erro ao buscar empresa');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Search Companies by CNAE via Nuvem Fiscal API
export interface SearchByCnaeParams {
  cnae: string;
  municipio: string;
  naturezaJuridica?: string;
  top?: number;
  skip?: number;
}

export interface SearchByCnaeResponse {
  companies: SearchCompanyResult[];
  total: number;
  success: boolean;
}

export async function searchCompaniesByCnae(params: SearchByCnaeParams): Promise<SearchByCnaeResponse> {
  const { data, error } = await supabase.functions.invoke('search-by-cnae', {
    body: params,
  });

  if (error) {
    console.error('Error searching companies by CNAE:', error);
    throw new Error(error.message || 'Erro ao buscar empresas');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

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

// Validate phones via Evolution API (WhatsApp check)
export interface PhoneValidationResult {
  id: string;
  status: string;
  whatsappName?: string;
}

export interface ValidatePhonesResponse {
  success: boolean;
  results: PhoneValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    uncertain: number;
  };
}

export async function validatePhones(phoneIds: string[]): Promise<ValidatePhonesResponse> {
  const { data, error } = await supabase.functions.invoke('validate-phones', {
    body: { phoneIds },
  });

  if (error) {
    console.error('Error validating phones:', error);
    throw new Error(error.message || 'Erro ao validar telefones');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
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

// Import company from API search result
export async function importCompanyFromSearch(searchResult: SearchCompanyResult) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create the company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      name: searchResult.fantasyName || searchResult.name,
      cnae: searchResult.cnae,
      cnae_description: searchResult.cnaeDescription,
      city: searchResult.city,
      state: searchResult.state,
      segment: null,
    })
    .select()
    .single();

  if (companyError) throw companyError;

  // Add phones if available
  const phones: string[] = [];
  if (searchResult.phone1) phones.push(searchResult.phone1);
  if (searchResult.phone2) phones.push(searchResult.phone2);

  for (const phone of phones) {
    await supabase.from('company_phones').insert({
      company_id: company.id,
      phone_number: phone,
      phone_type: phone.length > 10 ? 'mobile' : 'landline',
      status: 'pending',
    });
  }

  return company;
}
