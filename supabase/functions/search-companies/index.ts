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

    // Build query parameters for CNPJ.ws API
    const params = new URLSearchParams();
    
    if (cnae) {
      // Remove formatting from CNAE (e.g., "6201-5/01" -> "6201501")
      const cleanCnae = cnae.replace(/[-\/]/g, '');
      params.append('cnae', cleanCnae);
    }
    
    if (cidade) {
      params.append('municipio', cidade);
    }
    
    if (uf) {
      params.append('uf', uf);
    }
    
    params.append('page', page.toString());
    params.append('limit', '50');
    // Only active companies
    params.append('situacao', 'ATIVA');

    const apiUrl = `https://comercial.cnpj.ws/cnpj?${params.toString()}`;
    
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
    const companies = (data.records || data.data || []).map((company: any) => ({
      cnpj: company.cnpj,
      name: company.razao_social || company.nome_fantasia || 'Empresa sem nome',
      fantasyName: company.nome_fantasia || '',
      cnae: company.cnae_fiscal || '',
      cnaeDescription: company.cnae_fiscal_descricao || '',
      city: company.municipio || '',
      state: company.uf || '',
      phone1: company.ddd_telefone_1 || '',
      phone2: company.ddd_telefone_2 || '',
      email: company.email || '',
      address: company.logradouro || '',
      number: company.numero || '',
      neighborhood: company.bairro || '',
      cep: company.cep || '',
    }));

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
