import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try multiple base URLs based on dashboard URL pattern
const API_URLS = [
  'https://listacnae.com.br/app/api/todosMunicipios',
  'https://listacnae.com.br/app/todosMunicipios',
  'https://listacnae.com.br/todosMunicipios',
];

// Cache for municipalities
let cachedMunicipios: { id: number; nome: string; uf: string }[] | null = null;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get('LISTA_CNAE_TOKEN');

    if (!token) {
      console.error('LISTA_CNAE_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Token da Lista CNAE não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return cached data if available
    if (cachedMunicipios) {
      console.log('Returning cached municipalities:', cachedMunicipios.length);
      return new Response(
        JSON.stringify({ municipios: cachedMunicipios, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let lastError = '';
    let successData = null;

    // Try each URL with Bearer auth
    for (const apiUrl of API_URLS) {
      console.log('Trying URL:', apiUrl);
      console.log('Using token (first 10 chars):', token.substring(0, 10) + '...');
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        console.log('Response status:', response.status);

        const responseText = await response.text();
        console.log('Response body (first 300 chars):', responseText.substring(0, 300));

        // Skip if HTML response
        if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!')) {
          console.log('Got HTML response, trying next URL...');
          lastError = 'API retornou HTML para ' + apiUrl;
          continue;
        }

        if (!response.ok) {
          console.log('Non-OK response:', response.status);
          lastError = `${apiUrl}: ${response.status} - ${responseText.substring(0, 100)}`;
          continue;
        }

        const data = JSON.parse(responseText);
        console.log('Success! Received', Array.isArray(data) ? data.length : 'object', 'from', apiUrl);
        successData = data;
        break;

      } catch (urlError) {
        console.error('Error with URL', apiUrl, ':', urlError);
        lastError = `${apiUrl}: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`;
      }
    }

    if (!successData) {
      console.error('All URLs failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar municípios. Verifique se o token está correto.', details: lastError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform and cache the data
    const municipios = (Array.isArray(successData) ? successData : successData.municipios || []).map((item: any) => ({
      id: item.id || item.codigo,
      nome: item.nome || item.municipio,
      uf: item.uf || item.estado,
    }));
    
    cachedMunicipios = municipios;

    console.log('Cached', municipios.length, 'municipalities');

    return new Response(
      JSON.stringify({ municipios, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lista-cnae-municipios function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
