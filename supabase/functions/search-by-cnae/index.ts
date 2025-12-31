import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://listacnae.com.br';
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MINUTES = 60;

interface SearchParams {
  cnae: string;
  municipio: number;
  quantidade?: number;
  inicio?: number;
  telefoneObrigatorio?: boolean;
  emailObrigatorio?: boolean;
}

// Helper to log unauthorized access attempts
async function logUnauthorizedAccess(
  supabase: any,
  req: Request,
  reason: string,
  partialToken?: string
) {
  try {
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'unauthorized_access',
      p_table_name: 'search-by-cnae',
      p_record_id: null,
      p_old_data: null,
      p_new_data: {
        reason,
        partial_token: partialToken,
        endpoint: 'search-by-cnae',
        timestamp: new Date().toISOString()
      },
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      p_user_agent: req.headers.get('user-agent')
    });
    console.log('Logged unauthorized access attempt:', reason);
  } catch (e) {
    console.error('Failed to log unauthorized access:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client early for logging
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('Unauthorized access attempt - no auth header from IP:', req.headers.get('x-forwarded-for'));
      await logUnauthorizedAccess(supabase, req, 'missing_auth_header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const partialToken = token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'invalid_format';
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.warn('Unauthorized access attempt - invalid token from IP:', req.headers.get('x-forwarded-for'), 'Error:', userError?.message);
      await logUnauthorizedAccess(supabase, req, `invalid_token: ${userError?.message || 'no user'}`, partialToken);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { data: withinLimit } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'search-by-cnae',
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });

    if (!withinLimit) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment rate limit counter
    await supabase.rpc('increment_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'search-by-cnae'
    });

    const { cnae, municipio, quantidade = 50, inicio = 0, telefoneObrigatorio = false, emailObrigatorio = false }: SearchParams = await req.json();

    if (!cnae || !municipio) {
      return new Response(
        JSON.stringify({ error: 'CNAE e município são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiToken = Deno.env.get('LISTA_CNAE_TOKEN');

    if (!apiToken) {
      console.error('LISTA_CNAE_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Token da Lista CNAE não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CNAE - remove formatting (keep only digits)
    const cleanCnae = cnae.replace(/[^\d]/g, '');

    if (cleanCnae.length < 5) {
      return new Response(
        JSON.stringify({ error: 'CNAE deve ter pelo menos 5 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} searching Lista CNAE for CNAE:`, cleanCnae, 'Municipality ID:', municipio);

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_action: 'search',
      p_table_name: 'lista_cnae_api',
      p_record_id: null,
      p_old_data: null,
      p_new_data: { cnae: cleanCnae, municipio },
      p_ip_address: req.headers.get('x-forwarded-for'),
      p_user_agent: req.headers.get('user-agent')
    });

    // Build query parameters
    const cnaesArray = JSON.stringify([parseInt(cleanCnae)]);
    const municipiosArray = JSON.stringify([municipio]);
    
    const params = new URLSearchParams();
    params.append('inicio', inicio.toString());
    params.append('quantidade', quantidade.toString());
    params.append('cnaes', cnaesArray);
    params.append('municipios', municipiosArray);
    
    if (telefoneObrigatorio) {
      params.append('telefone_obrigatorio', 'true');
    }

    if (emailObrigatorio) {
      params.append('email_obrigatorio', 'true');
    }

    const apiUrl = `${BASE_URL}/buscar?${params.toString()}`;
    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    console.log('Response status:', response.status);

    const responseText = await response.text();
    console.log('Response body (first 200 chars):', responseText.substring(0, 200));

    // Check if response is HTML (API not working properly)
    if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!')) {
      console.error('API returned HTML instead of JSON');
      return new Response(
        JSON.stringify({ 
          error: 'A API Lista CNAE não está disponível no momento.',
          companies: [],
          total: 0
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      console.error('Lista CNAE API error:', response.status, responseText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Token inválido ou expirado.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições da API excedido.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes na Lista CNAE.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar empresas',
          companies: [],
          total: 0
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Resposta inválida da API',
          companies: [],
          total: 0
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the response
    const companiesArray = data.empresas || data.data || data || [];
    const companies = companiesArray.map((item: any) => ({
      cnpj: item.cnpj || '',
      name: item.razao_social || item.nome_fantasia || 'Empresa sem nome',
      fantasyName: item.nome_fantasia || '',
      cnae: cleanCnae,
      cnaeDescription: item.cnae_descricao || item.atividade_principal || '',
      city: item.municipio || item.cidade || '',
      state: item.uf || item.estado || '',
      phone1: item.telefone_primario || item.telefone1 || item.telefone || '',
      phone2: item.telefone_secundario || item.telefone2 || '',
      email: item.email || '',
      address: item.logradouro || item.endereco || '',
      number: item.numero || '',
      neighborhood: item.bairro || '',
      cep: item.cep || '',
      naturezaJuridica: item.natureza_juridica || '',
      situacao: item.situacao || 'ATIVA',
    }));

    console.log('Transformed', companies.length, 'companies');

    return new Response(
      JSON.stringify({
        companies,
        total: companies.length,
        success: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-by-cnae function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
