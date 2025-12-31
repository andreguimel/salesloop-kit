import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 50; // Max requests per window
const RATE_LIMIT_WINDOW_MINUTES = 60; // Window in minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header for user identification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { data: withinLimit } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'search-api',
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });

    if (!withinLimit) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment rate limit counter
    await supabase.rpc('increment_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'search-api'
    });

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
    
    // Remove formatting from CNAE - keep only digits
    const cnaeClean = cnae.trim().replace(/[-\/]/g, '');
    
    // Build URL with optional filters
    let searchUrl = `${baseUrl}/empresas?cnae=${encodeURIComponent(cnaeClean)}`;
    
    if (uf && uf.trim()) {
      searchUrl += `&uf=${encodeURIComponent(uf.trim().toUpperCase())}`;
    }
    
    if (cidade && cidade.trim()) {
      searchUrl += `&cidade=${encodeURIComponent(cidade.trim())}`;
    }

    console.log(`User ${user.id} searching API:`, searchUrl);

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_action: 'search',
      p_table_name: 'external_api',
      p_record_id: null,
      p_old_data: null,
      p_new_data: { cnae: cnaeClean, uf, cidade },
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      p_user_agent: req.headers.get('user-agent')
    });

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
