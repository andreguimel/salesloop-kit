import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

// AbacatePay public HMAC key for signature verification
const ABACATEPAY_PUBLIC_KEY = "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

async function verifySignature(rawBody: string, signatureFromHeader: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(ABACATEPAY_PUBLIC_KEY);
    const data = encoder.encode(rawBody);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, data);
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    return expectedSig === signatureFromHeader;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');

    // Get raw body for signature verification
    const rawBody = await req.text();
    console.log('Webhook received:', rawBody);

    // Verify webhook secret from query params
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('webhookSecret');
    
    if (webhookSecret && querySecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally verify HMAC signature
    const signatureHeader = req.headers.get('X-Webhook-Signature');
    if (signatureHeader) {
      const isValid = await verifySignature(rawBody, signatureHeader);
      if (!isValid) {
        console.error('Invalid HMAC signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const event = JSON.parse(rawBody);
    console.log('Parsed event:', JSON.stringify(event, null, 2));

    // Only process billing.paid events
    if (event.event !== 'billing.paid') {
      console.log('Ignoring non-payment event:', event.event);
      return new Response(
        JSON.stringify({ received: true, processed: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract billing data
    const billing = event.data?.billing;
    if (!billing) {
      console.error('No billing data in event');
      return new Response(
        JSON.stringify({ error: 'No billing data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get metadata from products or billing
    // The externalId in products should contain our packageId
    const product = billing.products?.[0];
    const packageId = product?.externalId;
    
    // We need to find the user by looking up the billing in our context
    // Since AbacatePay includes metadata, we can parse it
    // But if metadata is not available, we'll need another approach
    
    // For now, let's create admin client to lookup and update
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get user from customer email
    const customerEmail = billing.customer?.metadata?.email;
    if (!customerEmail) {
      console.error('No customer email in billing');
      return new Response(
        JSON.stringify({ error: 'No customer email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (profileError || !profile) {
      console.error('User not found for email:', customerEmail);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = profile.id;

    // Get package details
    const { data: creditPackage, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .single();

    if (packageError || !creditPackage) {
      console.error('Package not found:', packageId);
      return new Response(
        JSON.stringify({ error: 'Package not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalCredits = creditPackage.credits + creditPackage.bonus_credits;
    const billingId = billing.id;

    // Check if this billing was already processed (idempotency)
    const { data: existingTransaction } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('reference_id', billingId)
      .single();

    if (existingTransaction) {
      console.log('Billing already processed:', billingId);
      return new Response(
        JSON.stringify({ received: true, processed: false, reason: 'already_processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user credits
    const { data: currentCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (creditsError) {
      // Create credits record if not exists
      await supabase
        .from('user_credits')
        .insert({ user_id: userId, balance: totalCredits });
    } else {
      await supabase
        .from('user_credits')
        .update({ balance: currentCredits.balance + totalCredits })
        .eq('user_id', userId);
    }

    // Record purchase transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: totalCredits,
        type: 'purchase',
        description: `Compra do pacote ${creditPackage.name} - R$ ${creditPackage.price_brl}`,
        reference_id: billingId,
      });

    // If there's a bonus, record it separately
    if (creditPackage.bonus_credits > 0) {
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: creditPackage.bonus_credits,
          type: 'bonus',
          description: `Bônus do pacote ${creditPackage.name}`,
          reference_id: `${billingId}_bonus`,
        });
    }

    console.log(`Credits added: ${totalCredits} for user ${userId}`);

    return new Response(
      JSON.stringify({ received: true, processed: true, credits: totalCredits }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
