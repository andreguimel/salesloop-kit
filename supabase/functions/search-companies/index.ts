import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cnpj: string;
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

    const { cnpj }: SearchParams = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CNPJ - remove formatting
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    if (cleanCnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for CNPJ:', cleanCnpj);

    // Call CNPJ.ws API - individual CNPJ lookup (available in Basic plan)
    const apiUrl = `https://comercial.cnpj.ws/cnpj/${cleanCnpj}`;
    
    console.log('Calling CNPJ.ws API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x_api_token': CNPJWS_API_KEY,
        'Accept': 'application/json',
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
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'CNPJ não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes na API CNPJ.ws' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar empresa na API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('CNPJ.ws response:', JSON.stringify(data).slice(0, 1000));

    // Transform the response to our format
    // The individual CNPJ endpoint has a nested structure
    const estabelecimento = data.estabelecimento || {};
    const atividadePrincipal = estabelecimento.atividade_principal || {};
    
    // Build phone numbers with DDD
    const phone1 = estabelecimento.ddd1 && estabelecimento.telefone1 
      ? `${estabelecimento.ddd1}${estabelecimento.telefone1}` 
      : '';
    const phone2 = estabelecimento.ddd2 && estabelecimento.telefone2 
      ? `${estabelecimento.ddd2}${estabelecimento.telefone2}` 
      : '';

    const company = {
      cnpj: estabelecimento.cnpj || cleanCnpj,
      name: data.razao_social || 'Empresa sem nome',
      fantasyName: estabelecimento.nome_fantasia || '',
      cnae: atividadePrincipal.id || atividadePrincipal.subclasse || '',
      cnaeDescription: atividadePrincipal.descricao || '',
      city: estabelecimento.cidade?.nome || '',
      state: estabelecimento.estado?.sigla || '',
      phone1: phone1,
      phone2: phone2,
      email: estabelecimento.email || '',
      address: estabelecimento.logradouro || '',
      number: estabelecimento.numero || '',
      neighborhood: estabelecimento.bairro || '',
      cep: estabelecimento.cep || '',
      // Additional data available from CNPJ.ws
      capitalSocial: data.capital_social || '',
      naturezaJuridica: data.natureza_juridica?.descricao || '',
      porte: data.porte?.descricao || '',
      situacao: estabelecimento.situacao_cadastral || '',
      dataAbertura: estabelecimento.data_inicio_atividade || '',
    };

    return new Response(
      JSON.stringify({
        company,
        success: true,
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
