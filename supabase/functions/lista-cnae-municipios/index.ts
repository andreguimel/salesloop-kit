import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Try different combinations of URL, method, and auth
    const attempts = [
      // Try with token as query param
      { url: `https://listacnae.com.br/todosMunicipios?token=${token}`, method: 'GET', headers: {} },
      // Try with Authorization header (no Bearer)
      { url: 'https://listacnae.com.br/todosMunicipios', method: 'GET', headers: { 'Authorization': token } },
      // Try with Bearer
      { url: 'https://listacnae.com.br/todosMunicipios', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } },
      // Try POST with token in body
      { url: 'https://listacnae.com.br/todosMunicipios', method: 'POST', headers: {}, body: JSON.stringify({ token }) },
      // Try /app/api path with token as query
      { url: `https://listacnae.com.br/app/api/todosMunicipios?token=${token}`, method: 'GET', headers: {} },
    ];

    let lastError = '';
    let successData = null;

    for (const attempt of attempts) {
      console.log('Trying:', attempt.method, attempt.url.substring(0, 80));
      
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        
        if (attempt.headers.Authorization) {
          headers['Authorization'] = attempt.headers.Authorization;
        }
        
        const fetchOptions: RequestInit = {
          method: attempt.method,
          headers,
        };
        
        if (attempt.body) {
          fetchOptions.body = attempt.body;
        }

        const response = await fetch(attempt.url, fetchOptions);

        console.log('Response status:', response.status);

        const responseText = await response.text();
        console.log('Response body (first 300 chars):', responseText.substring(0, 300));

        // Skip if HTML response
        if (responseText.trim().startsWith('<') || responseText.trim().startsWith('<!')) {
          console.log('Got HTML response, trying next...');
          lastError = 'API retornou HTML';
          continue;
        }

        if (!response.ok) {
          console.log('Non-OK response:', response.status);
          lastError = `${response.status} - ${responseText.substring(0, 100)}`;
          continue;
        }

        const data = JSON.parse(responseText);
        console.log('Success! Received', Array.isArray(data) ? data.length : 'object');
        successData = data;
        break;

      } catch (urlError) {
        console.error('Error:', urlError);
        lastError = urlError instanceof Error ? urlError.message : 'Unknown error';
      }
    }

    if (!successData) {
      console.error('All attempts failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar municípios. A API Lista CNAE pode não estar disponível como endpoint REST.', details: lastError }),
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
