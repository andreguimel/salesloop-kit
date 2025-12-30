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
      .select('email, full_name, phone, cpf')
      .eq('id', user.id)
      .single();

    const customerEmail = profile?.email || user.email || '';
    const customerName = profile?.full_name || 'Cliente';
    const customerPhone = profile?.phone || '11999999999';
    const customerCpf = profile?.cpf || '00000000000';

    // Calculate total credits (base + bonus)
    const totalCredits = creditPackage.credits + creditPackage.bonus_credits;
    
    // Create PIX QR Code directly using AbacatePay's pixQrCode endpoint
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(creditPackage.price_brl * 100), // Convert to cents
        expiresIn: 3600, // 1 hour expiration
        description: `Pacote ${creditPackage.name} - ${totalCredits} créditos`,
        customer: {
          email: customerEmail,
          name: customerName,
          cellphone: customerPhone,
          taxId: customerCpf,
        },
        metadata: {
          userId: user.id,
          packageId: creditPackage.id,
          credits: creditPackage.credits,
          bonusCredits: creditPackage.bonus_credits,
          externalId: `${user.id}_${creditPackage.id}_${Date.now()}`,
        },
      }),
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('AbacatePay error:', errorText);
      throw new Error('Erro ao criar cobrança no AbacatePay');
    }

    const abacateData = await abacateResponse.json();
    console.log('AbacatePay PIX QR Code created:', abacateData);

    if (!abacateData.data?.brCode) {
      throw new Error('QR Code não retornado');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        pixId: abacateData.data.id,
        brCode: abacateData.data.brCode,
        brCodeBase64: abacateData.data.brCodeBase64,
        amount: creditPackage.price_brl,
        expiresAt: abacateData.data.expiresAt,
        packageName: creditPackage.name,
        totalCredits: totalCredits,
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
