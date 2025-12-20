import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://listacnae.com.br';

interface SearchParams {
  cnae: string;
  municipio: number; // ID do município na Lista CNAE (não IBGE)
  quantidade?: number;
  inicio?: number;
  telefoneObrigatorio?: boolean;
  emailObrigatorio?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnae, municipio, quantidade = 50, inicio = 0, telefoneObrigatorio = false, emailObrigatorio = false }: SearchParams = await req.json();

    if (!cnae || !municipio) {
      return new Response(
        JSON.stringify({ error: 'CNAE e município são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = Deno.env.get('LISTA_CNAE_TOKEN');

    if (!token) {
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

    console.log('Searching Lista CNAE for CNAE:', cleanCnae, 'Municipality ID:', municipio);

    // Build query parameters for Lista CNAE API
    const params = new URLSearchParams();
    params.append('inicio', inicio.toString());
    params.append('quantidade', quantidade.toString());
    params.append('cnaes', cleanCnae);
    params.append('municipios', municipio.toString());
    params.append('token', token);
    
    if (telefoneObrigatorio) {
      params.append('telefone_obrigatorio', 'true');
    }

    if (emailObrigatorio) {
      params.append('email_obrigatorio', 'true');
    }

    // Lista CNAE API - GET /buscar with query parameters
    const apiUrl = `${BASE_URL}/buscar?${params.toString()}`;
    
    console.log('Calling API:', apiUrl.replace(token, '***TOKEN***'));

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    // Get response as text first to check for HTML
    const responseText = await response.text();
    console.log('Response body (first 200 chars):', responseText.substring(0, 200));

    // Check if response is HTML (API not working properly)
    if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!')) {
      console.error('API returned HTML instead of JSON');
      return new Response(
        JSON.stringify({ 
          error: 'A API Lista CNAE não está disponível no momento. A API requer autenticação via sessão do navegador.',
          details: 'Entre em contato com o suporte da Lista CNAE para obter acesso à API REST.',
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
          JSON.stringify({ error: 'Token inválido ou expirado. Verifique o token da Lista CNAE.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento.' }),
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
          error: 'Erro ao buscar empresas na API Lista CNAE',
          details: responseText.substring(0, 200),
          status: response.status
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
          error: 'Resposta inválida da API Lista CNAE',
          details: responseText.substring(0, 100),
          companies: [],
          total: 0
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Lista CNAE response:', JSON.stringify(data).substring(0, 500));

    // Transform the response to our format
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
