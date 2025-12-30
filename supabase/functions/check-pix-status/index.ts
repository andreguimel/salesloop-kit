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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const { pixId } = await req.json();

    if (!pixId) {
      throw new Error('ID do PIX não informado');
    }

    // Check PIX status using AbacatePay API
    const abacateResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('AbacatePay check status error:', errorText);
      throw new Error('Erro ao verificar status do pagamento');
    }

    const abacateData = await abacateResponse.json();
    console.log('AbacatePay PIX status:', abacateData);

    const status = abacateData.data?.status || 'PENDING';
    const isPaid = status === 'PAID';

    // If paid, add credits to user
    if (isPaid && abacateData.data?.metadata) {
      const metadata = abacateData.data.metadata;
      const credits = metadata.credits || 0;
      const bonusCredits = metadata.bonusCredits || 0;
      const totalCredits = credits + bonusCredits;
      const packageId = metadata.packageId;
      const externalId = metadata.externalId;

      // Use service role to update credits
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Check if this payment was already processed (prevent double credits)
      const { data: existingTransaction } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('reference_id', externalId)
        .eq('type', 'purchase')
        .single();

      if (!existingTransaction) {
        console.log(`Processing payment for user ${user.id}: ${totalCredits} credits`);

        // Get current balance
        const { data: currentCredits } = await supabaseAdmin
          .from('user_credits')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        const currentBalance = currentCredits?.balance || 0;
        const newBalance = currentBalance + totalCredits;

        // Update user credits
        const { error: updateError } = await supabaseAdmin
          .from('user_credits')
          .upsert({
            user_id: user.id,
            balance: newBalance,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (updateError) {
          console.error('Error updating credits:', updateError);
        }

        // Record purchase transaction
        const { error: transactionError } = await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: user.id,
            amount: totalCredits,
            type: 'purchase',
            description: `Compra de pacote - ${credits} créditos${bonusCredits > 0 ? ` + ${bonusCredits} bônus` : ''}`,
            reference_id: externalId,
          });

        if (transactionError) {
          console.error('Error recording transaction:', transactionError);
        }

        console.log(`Credits added successfully: ${totalCredits} credits to user ${user.id}`);
      } else {
        console.log('Payment already processed, skipping credit addition');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        status: status,
        isPaid: isPaid,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Check PIX status error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
