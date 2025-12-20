import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Try multiple base URLs based on dashboard URL pattern
const API_URLS = [
  'https://listacnae.com.br/app/api/todosCnaes',
  'https://listacnae.com.br/app/todosCnaes',
  'https://listacnae.com.br/todosCnaes',
];

// Cache for CNAEs
let cachedCnaes: { id: string; descricao: string }[] | null = null;

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
    if (cachedCnaes) {
      console.log('Returning cached CNAEs:', cachedCnaes.length);
      return new Response(
        JSON.stringify({ cnaes: cachedCnaes, success: true }),
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
        JSON.stringify({ error: 'Erro ao buscar CNAEs. Verifique se o token está correto.', details: lastError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform and cache the data
    const cnaes = (Array.isArray(successData) ? successData : successData.cnaes || []).map((item: any) => ({
      id: String(item.id || item.codigo),
      descricao: item.descricao || item.nome,
    }));
    
    cachedCnaes = cnaes;

    console.log('Cached', cnaes.length, 'CNAEs');

    return new Response(
      JSON.stringify({ cnaes, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lista-cnae-cnaes function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
