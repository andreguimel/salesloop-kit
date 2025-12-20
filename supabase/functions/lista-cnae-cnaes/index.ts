import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://listacnae.com.br';

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

    console.log('Fetching CNAEs from Lista CNAE API');

    const apiUrl = `${BASE_URL}/todosCnaes`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lista CNAE API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar CNAEs: ' + errorText.substring(0, 100) }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Received', Array.isArray(data) ? data.length : 'unknown', 'CNAEs');

    // Transform and cache the data
    const cnaes = (Array.isArray(data) ? data : data.cnaes || []).map((item: any) => ({
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
