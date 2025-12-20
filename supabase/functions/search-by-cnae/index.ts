import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  cnae: string;
  municipio: string; // Now accepts IBGE code as string
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

    if (!cnae || !municipio) {
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

    // Clean municipio - remove formatting (keep only digits)
    const cleanMunicipio = municipio.replace(/[^\d]/g, '');

    console.log('Searching Lista CNAE for CNAE:', cleanCnae, 'Municipality IBGE Code:', cleanMunicipio);

    // Build request body for Lista CNAE API
    // The API expects the municipio ID from Lista CNAE, not IBGE code
    // We'll pass it directly and let the API handle it
    const requestBody: Record<string, any> = {
      inicio: inicio,
      quantidade: quantidade,
      cnaes: [parseInt(cleanCnae)],
    };

    // Try with IBGE code directly - Lista CNAE may accept it
    if (cleanMunicipio) {
      requestBody.municipios = [parseInt(cleanMunicipio)];
    }

    if (telefoneObrigatorio) {
      requestBody.telefone_obrigatorio = true;
    }

    if (emailObrigatorio) {
      requestBody.email_obrigatorio = true;
    }

    console.log('Request body:', JSON.stringify(requestBody));

    // Lista CNAE API uses GET with query params sent as body
    const response = await fetch('https://listacnae.com.br/api/buscar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);

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
        JSON.stringify({ error: 'Erro ao buscar empresas na API Lista CNAE: ' + errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    console.log('Lista CNAE response:', JSON.stringify(data).substring(0, 500));

    // Transform the response to our format
    // Lista CNAE returns an array of companies
    const companiesArray = data.empresas || data.data || data || [];
    const companies = companiesArray.map((item: any) => ({
      cnpj: item.cnpj || '',
      name: item.razao_social || item.nome_fantasia || 'Empresa sem nome',
      fantasyName: item.nome_fantasia || '',
      cnae: cleanCnae,
      cnaeDescription: item.cnae_descricao || item.atividade_principal || '',
      city: item.municipio || item.cidade || '',
      state: item.uf || item.estado || '',
      phone1: item.telefone_primario || item.telefone1 || item.telefone || '',
      phone2: item.telefone_secundario || item.telefone2 || '',
      email: item.email || '',
      address: item.logradouro || item.endereco || '',
      number: item.numero || '',
      neighborhood: item.bairro || '',
      cep: item.cep || '',
      naturezaJuridica: item.natureza_juridica || '',
      situacao: item.situacao || 'ATIVA',
    }));

    console.log('Transformed', companies.length, 'companies');

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
