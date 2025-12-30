import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for CNAEs data (in-memory, resets on cold start)
let cachedCnaes: { id: string; descricao: string }[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// IBGE API endpoint for CNAE subclasses (most detailed level)
const IBGE_API_URL = 'https://servicodados.ibge.gov.br/api/v2/cnae/subclasses';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Check if cache is valid
    if (cachedCnaes && (now - cacheTimestamp) < CACHE_DURATION_MS) {
      console.log('Returning cached CNAE list with', cachedCnaes.length, 'items');
      return new Response(
        JSON.stringify({ cnaes: cachedCnaes, success: true, cached: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('Fetching CNAEs from IBGE API...');
    
    // Fetch from IBGE API
    const response = await fetch(IBGE_API_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`IBGE API returned status ${response.status}`);
    }

    const data = await response.json();
    
    console.log('IBGE API returned', data.length, 'items');

    // Transform IBGE format to our format
    // IBGE format: { id: "0111301", descricao: "...", classe: {...}, grupo: {...}, ... }
    const cnaes = data.map((item: any) => {
      // Format the code as XX.XX-X/XX (CNAE subclass format)
      const codigo = item.id.toString().padStart(7, '0');
      const formatted = `${codigo.slice(0, 4)}-${codigo.slice(4, 5)}/${codigo.slice(5, 7)}`;
      
      return {
        id: formatted,
        descricao: item.descricao
      };
    });

    // Sort alphabetically by description
    cnaes.sort((a: any, b: any) => a.descricao.localeCompare(b.descricao, 'pt-BR'));

    // Update cache
    cachedCnaes = cnaes;
    cacheTimestamp = now;

    console.log('Returning CNAE list with', cnaes.length, 'items');

    return new Response(
      JSON.stringify({ cnaes, success: true, cached: false, total: cnaes.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching CNAEs:', error);
    
    // If we have cached data, return it even if expired
    if (cachedCnaes) {
      console.log('Returning stale cache due to error');
      return new Response(
        JSON.stringify({ cnaes: cachedCnaes, success: true, cached: true, stale: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Falha ao buscar CNAEs do IBGE',
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
