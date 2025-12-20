import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cnpj: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CNPJA_API_KEY = Deno.env.get('CNPJA_API_KEY');
    
    if (!CNPJA_API_KEY) {
      console.error('CNPJA_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key da CNPJá não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { cnpj }: SearchParams = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CNPJ - remove formatting
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    if (cleanCnpj.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ deve ter 14 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching CNPJá for CNPJ:', cleanCnpj);

    // Call CNPJá API - office endpoint (Receita Federal data)
    const apiUrl = `https://api.cnpja.com/office/${cleanCnpj}`;
    
    console.log('Calling CNPJá API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': CNPJA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('CNPJá API error:', response.status, JSON.stringify(errorData));
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Chave de API inválida. Verifique sua chave da CNPJá.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'CNPJ não encontrado na base da Receita Federal.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        const message = errorData.message || 'Limite de requisições excedido';
        if (message.includes('not enough credits')) {
          return new Response(
            JSON.stringify({ 
              error: 'Créditos insuficientes na CNPJá.', 
              required: errorData.required,
              remaining: errorData.remaining 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: errorData.message || 'Erro ao buscar empresa na API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('CNPJá response received for:', cleanCnpj);

    // Transform the response to our format
    // CNPJá structure: https://cnpja.com/api
    const phones = data.phones || [];
    const mainActivity = data.mainActivity || {};
    const address = data.address || {};
    const company = data.company || {};
    
    const transformedCompany = {
      cnpj: data.taxId || cleanCnpj,
      name: company.name || data.alias || 'Empresa sem nome',
      fantasyName: data.alias || '',
      cnae: mainActivity.id?.toString() || '',
      cnaeDescription: mainActivity.text || '',
      city: address.city || '',
      state: address.state || '',
      phone1: phones[0]?.area && phones[0]?.number ? `${phones[0].area}${phones[0].number}` : '',
      phone2: phones[1]?.area && phones[1]?.number ? `${phones[1].area}${phones[1].number}` : '',
      email: data.emails?.[0]?.address || '',
      address: address.street || '',
      number: address.number || '',
      neighborhood: address.district || '',
      cep: address.zip || '',
      // Additional data
      capitalSocial: company.equity || '',
      naturezaJuridica: company.nature?.text || '',
      porte: company.size?.text || '',
      situacao: data.status?.text || '',
      dataAbertura: data.founded || '',
      simples: company.simples?.optant ? 'Sim' : 'Não',
      mei: company.simei?.optant ? 'Sim' : 'Não',
    };

    return new Response(
      JSON.stringify({
        company: transformedCompany,
        success: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-cnpja function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
