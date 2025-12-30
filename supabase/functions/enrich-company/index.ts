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

    console.log('Enriching company:', company.name);

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

    // Step 1: Search with Firecrawl - busca principal
    const searchQuery = `"${company.name}" ${company.city} ${company.state} site oficial contato email`;
    console.log('Firecrawl search query:', searchQuery);

    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 8,
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
    console.log('Firecrawl results count:', firecrawlData.data?.length || 0);

    // Step 1.5: Search for social media profiles
    const socialSearchQuery = `"${company.name}" ${company.city} instagram facebook linkedin`;
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
    const allResults = [...(firecrawlData.data || []), ...(socialData.data || [])];

    // Combine search results for AI processing
    const searchContent = allResults.map((result: any) => {
      const links = result.links?.slice(0, 10)?.join('\n') || '';
      return `URL: ${result.url}\nTítulo: ${result.title || 'N/A'}\nLinks encontrados:\n${links}\nConteúdo: ${result.markdown?.slice(0, 2000) || result.description || 'N/A'}`;
    }).join('\n\n---\n\n') || 'Nenhum resultado encontrado';

    // Step 2: Process with Lovable AI to extract structured data
    const aiPrompt = `Analise os resultados de busca abaixo sobre a empresa "${company.name}" localizada em ${company.city}, ${company.state}.

Extraia as seguintes informações (se encontradas):
1. Website oficial da empresa (URL completa)
2. Email de contato REAL e COMPLETO (sem asteriscos ou mascaramento)
3. Instagram (URL completa ou @usuario)
4. Facebook (URL completa)
5. LinkedIn (URL completa)
6. Um breve resumo sobre a empresa (máximo 150 palavras)

REGRAS IMPORTANTES: 
- Retorne APENAS um JSON válido, sem markdown, sem blocos de código, sem texto adicional
- Se não encontrar uma informação, use null
- IGNORE emails mascarados com asteriscos (***) ou parciais - retorne null nesses casos
- Para redes sociais, procure nos links e no conteúdo - inclua apenas perfis oficiais da empresa
- URLs de Instagram devem começar com https://instagram.com/ ou https://www.instagram.com/
- URLs de Facebook devem começar com https://facebook.com/ ou https://www.facebook.com/
- URLs de LinkedIn devem começar com https://linkedin.com/ ou https://www.linkedin.com/
- Valide que os dados são realmente da empresa "${company.name}"

Formato de resposta (apenas o JSON, nada mais):
{
  "website": "https://...",
  "email": "contato@...",
  "instagram": "https://instagram.com/...",
  "facebook": "https://facebook.com/...",
  "linkedin": "https://linkedin.com/...",
  "summary": "Resumo sobre a empresa..."
}

Resultados da busca:
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
            content: 'Você é um assistente especializado em extrair informações de contato de empresas a partir de resultados de busca. Sempre retorne JSON válido.'
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
        enrichmentResult = {
          website: parsed.website || null,
          email: parsed.email || null,
          instagram: parsed.instagram || null,
          facebook: parsed.facebook || null,
          linkedin: parsed.linkedin || null,
          aiSummary: parsed.summary || null,
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return partial success with what we have
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
