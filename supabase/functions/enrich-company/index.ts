import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  id: string;
  name: string;
  cnpj?: string;
  city: string;
  state: string;
  cnae?: string;
}

interface EnrichmentResult {
  name?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  aiSummary?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company } = await req.json() as { company: CompanyData };

    if (!company || !company.name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados da empresa são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Enriching company:', company.name, 'CNPJ:', company.cnpj);

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não está configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI não está configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CNPJ for search (remove formatting)
    const cleanCnpj = company.cnpj?.replace(/\D/g, '') || '';
    const hasCnpj = cleanCnpj.length === 14;

    // Step 1: Primary search - prioritize CNPJ if available
    let primarySearchQuery: string;
    if (hasCnpj) {
      // Format CNPJ for better search results: XX.XXX.XXX/XXXX-XX
      const formattedCnpj = cleanCnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
      primarySearchQuery = `CNPJ ${formattedCnpj} OR "${formattedCnpj}" empresa site oficial`;
      console.log('Using CNPJ-based search:', primarySearchQuery);
    } else {
      primarySearchQuery = `"${company.name}" ${company.city} ${company.state} empresa site oficial contato`;
      console.log('Using name-based search:', primarySearchQuery);
    }

    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: primarySearchQuery,
        limit: 10,
        scrapeOptions: {
          formats: ['markdown', 'links'],
        },
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error('Firecrawl API error:', firecrawlResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na busca Firecrawl' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlData = await firecrawlResponse.json();
    console.log('Primary search results count:', firecrawlData.data?.length || 0);

    // Step 2: Secondary search for contact info
    const contactSearchQuery = hasCnpj 
      ? `CNPJ ${cleanCnpj} contato email telefone endereço`
      : `"${company.name}" ${company.city} contato email telefone`;
    
    console.log('Contact search query:', contactSearchQuery);

    const contactResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: contactSearchQuery,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown', 'links'],
        },
      }),
    });

    let contactData: any = { data: [] };
    if (contactResponse.ok) {
      contactData = await contactResponse.json();
      console.log('Contact search results count:', contactData.data?.length || 0);
    }

    // Step 3: Search for social media profiles
    const socialSearchQuery = hasCnpj
      ? `CNPJ ${cleanCnpj} instagram facebook linkedin`
      : `"${company.name}" ${company.city} instagram facebook linkedin`;
    
    console.log('Social media search query:', socialSearchQuery);

    const socialResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: socialSearchQuery,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown', 'links'],
        },
      }),
    });

    let socialData: any = { data: [] };
    if (socialResponse.ok) {
      socialData = await socialResponse.json();
      console.log('Social media results count:', socialData.data?.length || 0);
    }

    // Combine all search results
    const allResults = [
      ...(firecrawlData.data || []), 
      ...(contactData.data || []),
      ...(socialData.data || [])
    ];

    // Combine search results for AI processing
    const searchContent = allResults.map((result: any) => {
      const links = result.links?.slice(0, 15)?.join('\n') || '';
      return `URL: ${result.url}\nTítulo: ${result.title || 'N/A'}\nLinks encontrados:\n${links}\nConteúdo: ${result.markdown?.slice(0, 2500) || result.description || 'N/A'}`;
    }).join('\n\n---\n\n') || 'Nenhum resultado encontrado';

    // Check if company name contains asterisks or seems incomplete
    const nameHasAsterisks = company.name.includes('*') || company.name.includes('**');
    
    const aiPrompt = `Analise os resultados de busca abaixo sobre a empresa com os seguintes dados:
- Nome cadastrado: "${company.name}"
- CNPJ: ${company.cnpj || 'Não informado'}
- Cidade: ${company.city}
- Estado: ${company.state}

TAREFA: Extraia as informações REAIS desta empresa específica a partir dos resultados de busca.

INFORMAÇÕES A EXTRAIR:
1. RAZÃO SOCIAL da empresa (nome jurídico oficial completo registrado, sem asteriscos) - MUITO IMPORTANTE
2. NOME FANTASIA da empresa (nome comercial/marca que a empresa usa, diferente da razão social)
3. Website oficial (URL completa começando com https://)
4. Email de contato (email completo e válido, sem asteriscos)
5. Instagram oficial (@usuario ou URL completa)
6. Facebook oficial (URL completa)
7. LinkedIn da empresa (URL completa)
8. Resumo sobre a empresa (máximo 150 palavras descrevendo o que a empresa faz)

REGRAS CRÍTICAS:
- Retorne APENAS um JSON válido, sem markdown, sem código, sem texto adicional
- Se não encontrar uma informação com certeza, use null
- VALIDE que as informações são realmente DESTA empresa (confira o CNPJ ${company.cnpj || ''} se disponível)
- IGNORE emails mascarados com asteriscos (***) - retorne null
- IGNORE informações de outras empresas que aparecem nos resultados
- Para redes sociais, retorne apenas perfis oficiais verificados da empresa
- O website deve ser o site oficial da empresa, não diretórios ou listas
- IMPORTANTE: Razão Social é o nome jurídico (ex: "EMPRESA XYZ LTDA"), Nome Fantasia é o nome comercial (ex: "XYZ Store")

Formato EXATO de resposta (apenas o JSON):
{
  "razaoSocial": "RAZAO SOCIAL COMPLETA LTDA" ou null,
  "nomeFantasia": "Nome Fantasia da Empresa" ou null,
  "website": "https://www.empresa.com.br" ou null,
  "email": "contato@empresa.com.br" ou null,
  "instagram": "https://instagram.com/empresa" ou null,
  "facebook": "https://facebook.com/empresa" ou null,
  "linkedin": "https://linkedin.com/company/empresa" ou null,
  "summary": "Descrição do que a empresa faz..." ou null
}

RESULTADOS DA BUSCA:
${searchContent}`;

    console.log('Calling Lovable AI for data extraction...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em extração de dados empresariais. Sua tarefa é analisar resultados de busca e extrair informações precisas e verificadas sobre empresas brasileiras. Sempre valide que os dados correspondem à empresa correta usando o CNPJ quando disponível. Retorne apenas JSON válido.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido, tente novamente mais tarde' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos insuficientes para Lovable AI' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    console.log('AI response:', aiContent);

    // Parse AI response
    let enrichmentResult: EnrichmentResult = {};
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
      // Validate and clean data
        const razaoSocial = parsed.razaoSocial && !parsed.razaoSocial.includes('*') ? parsed.razaoSocial : undefined;
        const nomeFantasia = parsed.nomeFantasia && !parsed.nomeFantasia.includes('*') ? parsed.nomeFantasia : undefined;
        
        // Build combined name: "Razão Social | Nome Fantasia" or just one if only one is available
        let combinedName: string | undefined = undefined;
        if (razaoSocial && nomeFantasia && razaoSocial !== nomeFantasia) {
          combinedName = `${razaoSocial} | ${nomeFantasia}`;
        } else if (razaoSocial) {
          combinedName = razaoSocial;
        } else if (nomeFantasia) {
          combinedName = nomeFantasia;
        }
        
        enrichmentResult = {
          name: combinedName,
          razaoSocial: razaoSocial,
          nomeFantasia: nomeFantasia,
          website: parsed.website && parsed.website.startsWith('http') ? parsed.website : undefined,
          email: parsed.email && parsed.email.includes('@') && !parsed.email.includes('*') ? parsed.email : undefined,
          instagram: parsed.instagram && (parsed.instagram.includes('instagram.com') || parsed.instagram.startsWith('@')) ? parsed.instagram : undefined,
          facebook: parsed.facebook && parsed.facebook.includes('facebook.com') ? parsed.facebook : undefined,
          linkedin: parsed.linkedin && parsed.linkedin.includes('linkedin.com') ? parsed.linkedin : undefined,
          aiSummary: parsed.summary || undefined,
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      enrichmentResult = {
        aiSummary: 'Não foi possível extrair informações estruturadas desta empresa.',
      };
    }

    console.log('Enrichment result:', enrichmentResult);

    return new Response(
      JSON.stringify({
        success: true,
        companyId: company.id,
        data: enrichmentResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error enriching company:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
