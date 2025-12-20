import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cnae?: string;
  cidade?: string;
  uf?: string;
  page?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CNPJWS_API_KEY = Deno.env.get('CNPJWS_API_KEY');
    
    if (!CNPJWS_API_KEY) {
      console.error('CNPJWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cnae, cidade, uf, page = 1 }: SearchParams = await req.json();

    console.log('Search params:', { cnae, cidade, uf, page });

    // Build query parameters for CNPJ.ws API - using /pesquisa endpoint
    const params = new URLSearchParams();
    
    if (cnae) {
      // Remove formatting from CNAE (e.g., "6201-5/01" -> "6201501")
      const cleanCnae = cnae.replace(/[-\/]/g, '');
      params.append('atividade_principal_id', cleanCnae);
    }
    
    if (cidade) {
      // Note: cidade_id expects IBGE code, but we'll try with the name for now
      params.append('razao_social', cidade); // Workaround - search by name containing city
    }
    
    if (uf) {
      // Map UF to IBGE state codes
      const ufToIbge: Record<string, string> = {
        'AC': '12', 'AL': '27', 'AP': '16', 'AM': '13', 'BA': '29',
        'CE': '23', 'DF': '53', 'ES': '32', 'GO': '52', 'MA': '21',
        'MT': '51', 'MS': '50', 'MG': '31', 'PA': '15', 'PB': '25',
        'PR': '41', 'PE': '26', 'PI': '22', 'RJ': '33', 'RN': '24',
        'RS': '43', 'RO': '11', 'RR': '14', 'SC': '42', 'SP': '35',
        'SE': '28', 'TO': '17'
      };
      const estadoId = ufToIbge[uf.toUpperCase()];
      if (estadoId) {
        params.append('estado_id', estadoId);
      }
    }
    
    // Only active companies
    params.append('situacao_cadastral', 'Ativa');

    const apiUrl = `https://comercial.cnpj.ws/pesquisa?${params.toString()}`;
    
    console.log('Calling CNPJ.ws API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x_api_token': CNPJWS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CNPJ.ws API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'API key inválida. Verifique sua chave do CNPJ.ws' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes na API CNPJ.ws' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar empresas na API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('CNPJ.ws response:', JSON.stringify(data).slice(0, 500));

    // Transform the response to our format
    // The /pesquisa endpoint returns a different structure
    const records = data.records || data.empresas || data.data || [];
    const companies = records.map((company: any) => {
      // Handle nested structure from /pesquisa endpoint
      const estabelecimento = company.estabelecimento || company;
      const atividadePrincipal = estabelecimento.atividade_principal || company.atividade_principal || {};
      
      return {
        cnpj: estabelecimento.cnpj || company.cnpj || '',
        name: company.razao_social || estabelecimento.razao_social || 'Empresa sem nome',
        fantasyName: estabelecimento.nome_fantasia || company.nome_fantasia || '',
        cnae: atividadePrincipal.id || atividadePrincipal.codigo || estabelecimento.cnae_fiscal || '',
        cnaeDescription: atividadePrincipal.descricao || estabelecimento.cnae_fiscal_descricao || '',
        city: estabelecimento.cidade?.nome || estabelecimento.municipio || company.municipio || '',
        state: estabelecimento.estado?.sigla || estabelecimento.uf || company.uf || '',
        phone1: estabelecimento.telefone1 || estabelecimento.ddd_telefone_1 || company.ddd_telefone_1 || '',
        phone2: estabelecimento.telefone2 || estabelecimento.ddd_telefone_2 || company.ddd_telefone_2 || '',
        email: estabelecimento.email || company.email || '',
        address: estabelecimento.logradouro || company.logradouro || '',
        number: estabelecimento.numero || company.numero || '',
        neighborhood: estabelecimento.bairro || company.bairro || '',
        cep: estabelecimento.cep || company.cep || '',
      };
    });

    return new Response(
      JSON.stringify({
        companies,
        total: data.total || data.count || companies.length,
        page: page,
        hasMore: companies.length === 50,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-companies function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
