import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for municipalities (they don't change often)
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
      console.log('Returning cached municipalities');
      return new Response(
        JSON.stringify({ municipios: cachedMunicipios, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching municipalities from Lista CNAE API');

    const response = await fetch('https://api.listacnae.com.br/todosMunicipios', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lista CNAE API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar municípios' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Received', data.length || 0, 'municipalities');

    // Transform and cache the data
    cachedMunicipios = (data || []).map((item: any) => ({
      id: item.codigo || item.id,
      nome: item.nome || item.municipio,
      uf: item.uf || item.estado,
    }));

    return new Response(
      JSON.stringify({ municipios: cachedMunicipios, success: true }),
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
