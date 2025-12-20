import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cnae: string;
  municipio: string;
  naturezaJuridica?: string;
  top?: number;
  skip?: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300000) {
    console.log('Using cached access token');
    return cachedToken.token;
  }

  const clientId = Deno.env.get('NUVEM_FISCAL_CLIENT_ID');
  const clientSecret = Deno.env.get('NUVEM_FISCAL_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais da Nuvem Fiscal não configuradas');
  }

  console.log('Requesting new access token from Nuvem Fiscal');

  const response = await fetch('https://auth.nuvemfiscal.com.br/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'cnpj',
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token error:', response.status, errorText);
    throw new Error('Falha ao obter token de acesso da Nuvem Fiscal');
  }

  const data = await response.json();
  
  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  console.log('Access token obtained successfully');
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnae, municipio, naturezaJuridica, top = 50, skip = 0 }: SearchParams = await req.json();

    if (!cnae || !municipio) {
      return new Response(
        JSON.stringify({ error: 'CNAE e município são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CNAE - remove formatting (keep only digits)
    const cleanCnae = cnae.replace(/[^\d]/g, '');

    if (cleanCnae.length < 5) {
      return new Response(
        JSON.stringify({ error: 'CNAE deve ter pelo menos 5 dígitos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean município code
    const cleanMunicipio = municipio.replace(/[^\d]/g, '');

    console.log('Searching for CNAE:', cleanCnae, 'Municipality:', cleanMunicipio);

    // Get access token
    const accessToken = await getAccessToken();

    // Build query parameters
    // natureza_juridica is required by Nuvem Fiscal API
    // Default to common types if not specified:
    // 2062 - Sociedade Empresária Limitada
    // 2135 - Empresário Individual (MEI)
    // 2305 - EIRELI Empresária
    const cleanNatureza = naturezaJuridica 
      ? naturezaJuridica.replace(/[^\d]/g, '') 
      : '2062'; // Default to Sociedade Limitada

    const params = new URLSearchParams({
      '$top': top.toString(),
      '$skip': skip.toString(),
      'cnae_principal': cleanCnae,
      'municipio': cleanMunicipio,
      'natureza_juridica': cleanNatureza,
    });

    const apiUrl = `https://api.nuvemfiscal.com.br/cnpj?${params.toString()}`;
    
    console.log('Calling Nuvem Fiscal API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nuvem Fiscal API error:', response.status, errorText);
      
      if (response.status === 401) {
        // Token expired, clear cache and retry
        cachedToken = null;
        return new Response(
          JSON.stringify({ error: 'Token expirado. Tente novamente.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes na Nuvem Fiscal' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar empresas na API' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Nuvem Fiscal response count:', data.length || 0);

    // Transform the response to our format
    const companies = (data || []).map((item: any) => ({
      cnpj: item.cnpj || '',
      name: item.razao_social || item.nome_fantasia || 'Empresa sem nome',
      fantasyName: item.nome_fantasia || '',
      cnae: cleanCnae,
      cnaeDescription: item.cnae_fiscal_principal?.descricao || '',
      city: item.endereco?.municipio?.nome || '',
      state: item.endereco?.uf || '',
      phone1: item.telefone1 ? `${item.ddd1 || ''}${item.telefone1}` : '',
      phone2: item.telefone2 ? `${item.ddd2 || ''}${item.telefone2}` : '',
      email: item.email || '',
      address: item.endereco?.logradouro || '',
      number: item.endereco?.numero || '',
      neighborhood: item.endereco?.bairro || '',
      cep: item.endereco?.cep || '',
      naturezaJuridica: item.natureza_juridica?.descricao || '',
      situacao: item.situacao_cadastral || '',
    }));

    return new Response(
      JSON.stringify({
        companies,
        total: companies.length,
        success: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-by-cnae function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
