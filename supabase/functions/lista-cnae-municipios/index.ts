import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching municipalities from IBGE API...');
    
    // IBGE API - Lista todos os municípios do Brasil
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
    
    if (!response.ok) {
      throw new Error(`IBGE API error: ${response.status} ${response.statusText}`);
    }
    
    const ibgeData = await response.json();
    console.log(`Received ${ibgeData.length} municipalities from IBGE`);
    
    // Transform IBGE data to match expected format
    const municipios = ibgeData.map((mun: any) => ({
      id: mun.id,
      nome: mun.nome,
      uf: mun.microrregiao?.mesorregiao?.UF?.sigla || '',
      uf_nome: mun.microrregiao?.mesorregiao?.UF?.nome || '',
    }));

    return new Response(
      JSON.stringify({ municipios, success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching municipalities:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch municipalities',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
