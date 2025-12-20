import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cnae: string;
  municipio: number;
  quantidade?: number;
  inicio?: number;
  telefoneObrigatorio?: boolean;
  emailObrigatorio?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnae, municipio, quantidade = 50, inicio = 0, telefoneObrigatorio = false, emailObrigatorio = false }: SearchParams = await req.json();

    if (!cnae || municipio === undefined) {
      return new Response(
        JSON.stringify({ error: 'CNAE e município são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = Deno.env.get('LISTA_CNAE_TOKEN');

    if (!token) {
      console.error('LISTA_CNAE_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Token da Lista CNAE não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    console.log('Searching Lista CNAE for CNAE:', cleanCnae, 'Municipality ID:', municipio);

    // Build request body for Lista CNAE API
    const requestBody: Record<string, any> = {
      inicio: inicio,
      quantidade: quantidade,
      cnaes: [parseInt(cleanCnae)],
      municipios: [municipio],
    };

    if (telefoneObrigatorio) {
      requestBody.telefone_obrigatorio = true;
    }

    if (emailObrigatorio) {
      requestBody.email_obrigatorio = true;
    }

    console.log('Request body:', JSON.stringify(requestBody));

    const response = await fetch('https://api.listacnae.com.br/buscar', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lista CNAE API error:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Token inválido ou expirado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar empresas na API Lista CNAE' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Lista CNAE response:', JSON.stringify(data).substring(0, 500));

    // Transform the response to our format
    // Lista CNAE returns an array of companies
    const companies = (data.empresas || data || []).map((item: any) => ({
      cnpj: item.cnpj || '',
      name: item.razao_social || item.nome_fantasia || 'Empresa sem nome',
      fantasyName: item.nome_fantasia || '',
      cnae: cleanCnae,
      cnaeDescription: item.cnae_descricao || '',
      city: item.municipio || '',
      state: item.uf || '',
      phone1: item.telefone_primario || item.telefone || '',
      phone2: item.telefone_secundario || '',
      email: item.email || '',
      address: item.logradouro || '',
      number: item.numero || '',
      neighborhood: item.bairro || '',
      cep: item.cep || '',
      naturezaJuridica: item.natureza_juridica || '',
      situacao: item.situacao || 'ATIVA',
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
