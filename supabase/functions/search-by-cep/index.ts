import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cep: string;
  pagina?: number;
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

    const { cep, pagina = 1 }: SearchParams = await req.json();

    if (!cep) {
      return new Response(
        JSON.stringify({ error: 'CEP é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CEP - remove formatting
    const cleanCep = cep.replace(/[^\d]/g, '');

    if (cleanCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP deve ter 8 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching companies by CEP:', cleanCep, 'Page:', pagina);

    // Call CNPJ.ws API - Premium search by CEP
    const apiUrl = `https://comercial.cnpj.ws/cep/${cleanCep}?pagina=${pagina}`;
    
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
      
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Acesso negado. Esta funcionalidade requer plano Premium do CNPJ.ws' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Nenhuma empresa encontrada neste CEP' }),
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
        JSON.stringify({ error: 'Erro ao buscar empresas na API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('CNPJ.ws response items:', Array.isArray(data) ? data.length : 'not array');

    // Transform the response to our format
    const companies = Array.isArray(data) ? data.map((item: any) => {
      const estabelecimento = item.estabelecimento || item;
      const atividadePrincipal = estabelecimento.atividade_principal || {};
      
      // Build phone numbers with DDD
      const phone1 = estabelecimento.ddd1 && estabelecimento.telefone1 
        ? `${estabelecimento.ddd1}${estabelecimento.telefone1}` 
        : '';
      const phone2 = estabelecimento.ddd2 && estabelecimento.telefone2 
        ? `${estabelecimento.ddd2}${estabelecimento.telefone2}` 
        : '';

      return {
        cnpj: estabelecimento.cnpj || item.cnpj || '',
        name: item.razao_social || estabelecimento.razao_social || 'Empresa sem nome',
        fantasyName: estabelecimento.nome_fantasia || '',
        cnae: atividadePrincipal.id || atividadePrincipal.subclasse || '',
        cnaeDescription: atividadePrincipal.descricao || '',
        city: estabelecimento.cidade?.nome || estabelecimento.municipio || '',
        state: estabelecimento.estado?.sigla || estabelecimento.uf || '',
        phone1: phone1,
        phone2: phone2,
        email: estabelecimento.email || '',
        address: estabelecimento.logradouro || '',
        number: estabelecimento.numero || '',
        neighborhood: estabelecimento.bairro || '',
        cep: estabelecimento.cep || cleanCep,
      };
    }) : [];

    return new Response(
      JSON.stringify({
        companies,
        total: companies.length,
        page: pagina,
        success: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-by-cep function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
