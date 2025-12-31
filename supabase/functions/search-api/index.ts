import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 50;
const RATE_LIMIT_WINDOW_MINUTES = 60;

// Helper to log unauthorized access attempts
async function logUnauthorizedAccess(
  supabase: any,
  req: Request,
  reason: string,
  partialToken?: string
) {
  try {
    await supabase.rpc('log_audit_event', {
      p_user_id: null,
      p_action: 'unauthorized_access',
      p_table_name: 'search-api',
      p_record_id: null,
      p_old_data: null,
      p_new_data: {
        reason,
        partial_token: partialToken,
        endpoint: 'search-api',
        timestamp: new Date().toISOString()
      },
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      p_user_agent: req.headers.get('user-agent')
    });
    console.log('Logged unauthorized access attempt:', reason);
  } catch (e) {
    console.error('Failed to log unauthorized access:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client early for logging
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get authorization header for user identification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('Unauthorized access attempt - no auth header from IP:', req.headers.get('x-forwarded-for'));
      await logUnauthorizedAccess(supabase, req, 'missing_auth_header');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const partialToken = token.length > 20 ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'invalid_format';
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.warn('Unauthorized access attempt - invalid token from IP:', req.headers.get('x-forwarded-for'), 'Error:', userError?.message);
      await logUnauthorizedAccess(supabase, req, `invalid_token: ${userError?.message || 'no user'}`, partialToken);
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
