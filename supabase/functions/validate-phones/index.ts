import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PhoneValidationRequest {
  phoneIds: string[];
}

interface EvolutionCheckResponse {
  exists: boolean;
  jid?: string;
  name?: string;
  number?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionInstanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
      console.error('Missing Evolution API configuration');
      return new Response(
        JSON.stringify({ error: 'Evolution API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Supabase não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { phoneIds } = await req.json() as PhoneValidationRequest;

    if (!phoneIds || phoneIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhum telefone para validar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating ${phoneIds.length} phones...`);

    // Fetch phone records from database
    const { data: phones, error: fetchError } = await supabase
      .from('company_phones')
      .select('id, phone_number, phone_type')
      .in('id', phoneIds);

    if (fetchError) {
      console.error('Error fetching phones:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar telefones' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phones || phones.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Telefones não encontrados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Array<{ id: string; status: string; whatsappName?: string }> = [];

    for (const phone of phones) {
      try {
        // Clean phone number - remove non-digits and ensure country code
        let cleanNumber = phone.phone_number.replace(/\D/g, '');
        
        // Add Brazil country code if not present
        if (!cleanNumber.startsWith('55')) {
          cleanNumber = '55' + cleanNumber;
        }

        console.log(`Checking WhatsApp for: ${cleanNumber}`);

        // Call Evolution API to check if number exists on WhatsApp
        // Remove /manager from path if the base URL already includes it
        const baseUrl = evolutionApiUrl.replace(/\/+$/, '').replace(/\/manager$/, ''); // Remove trailing slashes and /manager
        const evolutionUrl = `${baseUrl}/chat/whatsappNumbers/${evolutionInstanceName}`;
        
        const evolutionResponse = await fetch(evolutionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            numbers: [cleanNumber]
          }),
        });

        if (!evolutionResponse.ok) {
          const errorText = await evolutionResponse.text();
          console.error(`Evolution API error for ${cleanNumber}:`, evolutionResponse.status, errorText);
          
          // Mark as uncertain if API fails
          results.push({ id: phone.id, status: 'uncertain' });
          continue;
        }

        const evolutionData = await evolutionResponse.json() as EvolutionCheckResponse[];
        console.log(`Evolution response for ${cleanNumber}:`, JSON.stringify(evolutionData));

        // Determine status based on Evolution response
        let status = 'invalid';
        let whatsappName: string | undefined;

        if (Array.isArray(evolutionData) && evolutionData.length > 0) {
          const result = evolutionData[0];
          if (result.exists) {
            status = 'valid';
            whatsappName = result.name;
          }
        }

        // Update phone status in database
        const { error: updateError } = await supabase
          .from('company_phones')
          .update({ status })
          .eq('id', phone.id);

        if (updateError) {
          console.error(`Error updating phone ${phone.id}:`, updateError);
        }

        results.push({ id: phone.id, status, whatsappName });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (phoneError) {
        console.error(`Error validating phone ${phone.id}:`, phoneError);
        results.push({ id: phone.id, status: 'uncertain' });
      }
    }

    console.log(`Validation complete. Results:`, JSON.stringify(results));

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          total: results.length,
          valid: results.filter(r => r.status === 'valid').length,
          invalid: results.filter(r => r.status === 'invalid').length,
          uncertain: results.filter(r => r.status === 'uncertain').length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-phones function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
