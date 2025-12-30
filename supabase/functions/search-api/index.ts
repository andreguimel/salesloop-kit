import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('CUSTOM_API_KEY');
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    const { cnae, uf, cidade, page = 1, limit = 50 } = await req.json();

    if (!cnae || cnae.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'CNAE must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = 'https://consulta.thelostworld.space';
    
    // Try to extract just the main CNAE code (first 4 digits) if full code doesn't work
    // Format: "6209-1/00" -> try both "6209-1/00" and "6209"
    const cnaeClean = cnae.trim();
    
    // Build URL with optional filters
    let searchUrl = `${baseUrl}/empresas?cnae=${encodeURIComponent(cnaeClean)}`;
    
    if (uf && uf.trim()) {
      searchUrl += `&uf=${encodeURIComponent(uf.trim().toUpperCase())}`;
    }
    
    if (cidade && cidade.trim()) {
      searchUrl += `&cidade=${encodeURIComponent(cidade.trim())}`;
    }

    console.log('Searching API:', searchUrl);

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Check if API returned an error message or empty response
    if (data && data.mensagem) {
      console.log('API returned message:', data.mensagem);
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // API doesn't respect limit param, so we slice manually
    const companies = Array.isArray(data) ? data.slice(0, limit) : [];
    console.log('API returned:', Array.isArray(data) ? data.length : 'object', 'total, returning:', companies.length);

    return new Response(
      JSON.stringify(companies),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Search API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
