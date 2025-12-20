import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CNPJWS_API_KEY = Deno.env.get('CNPJWS_API_KEY');
    
    if (!CNPJWS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'CNPJWS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cnae, uf, municipio, pagina = 1 } = await req.json();

    if (!cnae) {
      return new Response(
        JSON.stringify({ error: 'CNAE é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testing CNPJ.ws Premium search for CNAE:', cnae);

    // Build query parameters for CNPJ.ws Premium search
    const params = new URLSearchParams();
    params.append('atividade_principal_id', cnae);
    params.append('pagina', pagina.toString());
    
    if (uf) {
      params.append('estabelecimento_uf', uf);
    }
    
    if (municipio) {
      params.append('estabelecimento_municipio', municipio);
    }

    // CNPJ.ws Premium Company Search endpoint
    const apiUrl = `https://comercial.cnpj.ws/pesquisa?${params.toString()}`;
    
    console.log('Calling API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x_api_token': CNPJWS_API_KEY,
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText.slice(0, 500));

    if (!response.ok) {
      // Check if it's a plan restriction error
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ 
            error: 'Acesso negado - Plano Premium necessário',
            isPremium: false,
            details: 'Sua chave CNPJ.ws é do plano Basic. Para buscar empresas por CNAE, é necessário o Plano Premium.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro na API', details: responseText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = JSON.parse(responseText);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        isPremium: true,
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
