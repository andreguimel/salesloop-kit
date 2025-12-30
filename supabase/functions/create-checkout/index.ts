import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const abacateApiKey = Deno.env.get('ABACATEPAY_API_KEY');

    if (!abacateApiKey) {
      throw new Error('ABACATEPAY_API_KEY não configurada');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { packageId } = await req.json();

    if (!packageId) {
      throw new Error('ID do pacote não informado');
    }

    // Fetch package details
    const { data: creditPackage, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (packageError || !creditPackage) {
      throw new Error('Pacote não encontrado');
    }

    // Get user profile for customer info
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, phone')
      .eq('id', user.id)
      .single();

    const customerEmail = profile?.email || user.email || '';
    const customerName = profile?.full_name || 'Cliente';
    const customerPhone = profile?.phone || '11999999999';

    // Calculate total credits (base + bonus)
    const totalCredits = creditPackage.credits + creditPackage.bonus_credits;
    
    // Get origin for return/completion URLs
    const origin = req.headers.get('origin') || 'https://achei-leads.lovable.app';

    // Create billing in AbacatePay
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [{
          externalId: creditPackage.id,
          name: `Pacote ${creditPackage.name} - ${totalCredits} créditos`,
          description: `${creditPackage.credits} créditos${creditPackage.bonus_credits > 0 ? ` + ${creditPackage.bonus_credits} bônus` : ''}`,
          quantity: 1,
          price: Math.round(creditPackage.price_brl * 100), // Convert to cents
        }],
        returnUrl: `${origin}/creditos?status=pending`,
        completionUrl: `${origin}/creditos?status=success`,
        customer: {
          email: customerEmail,
          name: customerName,
          cellphone: customerPhone,
        },
        metadata: {
          userId: user.id,
          packageId: creditPackage.id,
          credits: creditPackage.credits,
          bonusCredits: creditPackage.bonus_credits,
        },
      }),
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('AbacatePay error:', errorText);
      throw new Error('Erro ao criar cobrança no AbacatePay');
    }

    const abacateData = await abacateResponse.json();
    console.log('AbacatePay billing created:', abacateData);

    if (!abacateData.data?.url) {
      throw new Error('URL de pagamento não retornada');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        url: abacateData.data.url,
        billingId: abacateData.data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Create checkout error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
