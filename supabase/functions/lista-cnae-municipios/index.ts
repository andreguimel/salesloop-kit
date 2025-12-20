import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://listacnae.com.br/api';

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

    console.log('Fetching municipalities from Lista CNAE API');

    const apiUrl = `${BASE_URL}/todosMunicipios`;
    
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
        JSON.stringify({ error: 'Erro ao buscar municípios: ' + errorText.substring(0, 100) }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Received', Array.isArray(data) ? data.length : 'unknown', 'municipalities');

    // Transform and cache the data
    // Lista CNAE returns: { id: number, nome: string, uf: string }
    const municipios = (Array.isArray(data) ? data : data.municipios || []).map((item: any) => ({
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
