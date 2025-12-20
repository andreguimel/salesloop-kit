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

    console.log('Checking CNPJ.ws account status...');

    // Call CNPJ.ws consumption/account endpoint
    const response = await fetch('https://comercial.cnpj.ws/consumo', {
      method: 'GET',
      headers: {
        'x_api_token': CNPJWS_API_KEY,
        'Accept': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CNPJ.ws API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar conta', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Account data:', JSON.stringify(data));

    return new Response(
      JSON.stringify({ success: true, account: data }),
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
