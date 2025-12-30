import { supabase } from '@/integrations/supabase/client';
import { Company, MessageTemplate } from '@/types';

// Search Company by CNPJ via CNPJá API
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
  // Additional data from CNPJá
  capitalSocial?: string;
  naturezaJuridica?: string;
  porte?: string;
  situacao?: string;
  dataAbertura?: string;
  simples?: string;
  mei?: string;
}

export interface SearchCompanyByCnpjResponse {
  company: SearchCompanyResult;
  success: boolean;
}

export async function searchCompanyByCnpj(cnpj: string): Promise<SearchCompanyByCnpjResponse> {
  const { data, error } = await supabase.functions.invoke('search-cnpja', {
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

// Search Companies by CNAE via Lista CNAE API
export interface SearchByCnaeParams {
  cnae: string;
  municipio: number; // ID do município na Lista CNAE
  quantidade?: number;
  inicio?: number;
  telefoneObrigatorio?: boolean;
  emailObrigatorio?: boolean;
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

// Fetch municipalities from Lista CNAE API
export interface Municipio {
  id: number;
  nome: string;
  uf: string;
}

let cachedMunicipios: Municipio[] | null = null;

export async function fetchMunicipios(): Promise<Municipio[]> {
  // Return cached data if available
  if (cachedMunicipios) {
    return cachedMunicipios;
  }

  const { data, error } = await supabase.functions.invoke('lista-cnae-municipios');

  if (error) {
    console.error('Error fetching municipalities:', error);
    throw new Error(error.message || 'Erro ao buscar municípios');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  cachedMunicipios = data.municipios || [];
  return cachedMunicipios;
}

// Fetch CNAEs from Lista CNAE API
export interface Cnae {
  id: string;
  descricao: string;
}

let cachedCnaes: Cnae[] | null = null;

export async function fetchCnaes(): Promise<Cnae[]> {
  // Return cached data if available
  if (cachedCnaes) {
    return cachedCnaes;
  }

  const { data, error } = await supabase.functions.invoke('lista-cnae-cnaes');

  if (error) {
    console.error('Error fetching CNAEs:', error);
    throw new Error(error.message || 'Erro ao buscar CNAEs');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  cachedCnaes = data.cnaes || [];
  return cachedCnaes;
}

// Search Companies via Google Maps (Firecrawl)
export interface GoogleMapsCompany {
  name: string;
  phone1: string;
  address: string;
  website: string;
  rating: string;
  reviews: string;
  source: string;
}

export interface SearchGoogleMapsResponse {
  companies: GoogleMapsCompany[];
  total: number;
  success: boolean;
  query: string;
}

export async function searchGoogleMaps(query: string, limit = 20): Promise<SearchGoogleMapsResponse> {
  const { data, error } = await supabase.functions.invoke('search-google-maps', {
    body: { query, limit },
  });

  if (error) {
    console.error('Error searching Google Maps:', error);
    throw new Error(error.message || 'Erro ao buscar no Google Maps');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

// Import company from Google Maps result
export async function importCompanyFromGoogleMaps(company: GoogleMapsCompany) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create the company
  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      user_id: user.id,
      name: company.name,
      cnae: '',
      cnae_description: '',
      city: extractCityFromAddress(company.address),
      state: extractStateFromAddress(company.address),
      segment: null,
    })
    .select()
    .single();

  if (companyError) throw companyError;

  // Add phone if available
  if (company.phone1) {
    await supabase.from('company_phones').insert({
      company_id: newCompany.id,
      phone_number: company.phone1,
      phone_type: company.phone1.length > 10 ? 'mobile' : 'landline',
      status: 'pending',
    });
  }

  return newCompany;
}

function extractCityFromAddress(address: string): string {
  if (!address) return '';
  // Try to extract city from Brazilian address format
  const parts = address.split('-');
  if (parts.length >= 2) {
    return parts[parts.length - 2]?.trim() || '';
  }
  return '';
}

function extractStateFromAddress(address: string): string {
  if (!address) return '';
  // Try to extract state abbreviation
  const stateMatch = address.match(/\b([A-Z]{2})\b/);
  return stateMatch ? stateMatch[1] : '';
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

export interface UpdateCompanyData {
  name?: string;
  cnpj?: string;
  cnae?: string;
  cnaeDescription?: string;
  city?: string;
  state?: string;
  address?: string;
  cep?: string;
  segment?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export async function updateCompany(companyId: string, data: UpdateCompanyData) {
  const { error } = await supabase
    .from('companies')
    .update({
      name: data.name,
      cnpj: data.cnpj,
      cnae: data.cnae,
      cnae_description: data.cnaeDescription,
      city: data.city,
      state: data.state,
      address: data.address,
      cep: data.cep,
      segment: data.segment,
      website: data.website,
      email: data.email,
      instagram: data.instagram,
      facebook: data.facebook,
      linkedin: data.linkedin,
    })
    .eq('id', companyId);

  if (error) throw error;
}

export async function deleteCompany(companyId: string) {
  // First delete all phones associated with the company
  const { error: phonesError } = await supabase
    .from('company_phones')
    .delete()
    .eq('company_id', companyId);

  if (phonesError) throw phonesError;

  // Then delete the company
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
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

export async function deletePhone(phoneId: string) {
  const { error } = await supabase
    .from('company_phones')
    .delete()
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

  // Add phones if available (avoiding duplicates)
  const phones: string[] = [];
  if (searchResult.phone1) {
    const cleaned = searchResult.phone1.replace(/\D/g, '');
    if (cleaned.length >= 10 && cleaned !== '0000000000') {
      phones.push(cleaned);
    }
  }
  if (searchResult.phone2) {
    const cleaned = searchResult.phone2.replace(/\D/g, '');
    if (cleaned.length >= 10 && cleaned !== '0000000000' && !phones.includes(cleaned)) {
      phones.push(cleaned);
    }
  }

  for (const phone of phones) {
    // Check if phone already exists for this company
    const { data: existingPhone } = await supabase
      .from('company_phones')
      .select('id')
      .eq('company_id', company.id)
      .eq('phone_number', phone)
      .maybeSingle();

    if (!existingPhone) {
      await supabase.from('company_phones').insert({
        company_id: company.id,
        phone_number: phone,
        phone_type: phone.length > 10 ? 'mobile' : 'landline',
        status: 'pending',
      });
    }
  }

  return company;
}

// Enrich company with AI (Firecrawl + Lovable AI)
export interface EnrichmentResult {
  name?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  aiSummary?: string;
}

export interface EnrichCompanyResponse {
  success: boolean;
  companyId: string;
  data?: EnrichmentResult;
  error?: string;
}

export async function enrichCompany(company: Company): Promise<EnrichCompanyResponse> {
  const { data, error } = await supabase.functions.invoke('enrich-company', {
    body: {
      company: {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        city: company.city,
        state: company.state,
        cnae: company.cnae,
      },
    },
  });

  if (error) {
    console.error('Error enriching company:', error);
    throw new Error(error.message || 'Erro ao enriquecer empresa');
  }

  if (!data.success) {
    throw new Error(data.error || 'Erro ao enriquecer empresa');
  }

  // Update company in database with enriched data
  if (data.data) {
    const updateData: Record<string, any> = {
      website: data.data.website,
      email: data.data.email,
      instagram: data.data.instagram,
      facebook: data.data.facebook,
      linkedin: data.data.linkedin,
      ai_summary: data.data.aiSummary,
      enriched_at: new Date().toISOString(),
    };
    
    // Update name if a better one was found (replaces names with asterisks)
    if (data.data.name) {
      updateData.name = data.data.name;
    }
    
    const { error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', company.id);

    if (updateError) {
      console.error('Error updating company with enriched data:', updateError);
      throw new Error('Erro ao salvar dados enriquecidos');
    }
  }

  return data;
}

export async function enrichCompanies(companies: Company[]): Promise<{
  success: number;
  failed: number;
  results: EnrichCompanyResponse[];
}> {
  const results: EnrichCompanyResponse[] = [];
  let success = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const result = await enrichCompany(company);
      results.push(result);
      success++;
    } catch (error) {
      console.error(`Error enriching company ${company.id}:`, error);
      results.push({
        success: false,
        companyId: company.id,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      failed++;
    }
  }

  return { success, failed, results };
}
