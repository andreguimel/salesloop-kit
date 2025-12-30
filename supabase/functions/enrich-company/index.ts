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

    // Step 1: Search with Firecrawl
    const searchQuery = `${company.name} ${company.city} ${company.state} contato site telefone`;
    console.log('Firecrawl search query:', searchQuery);

    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
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

    // Combine search results for AI processing
    const searchContent = firecrawlData.data?.map((result: any) => {
      return `URL: ${result.url}\nTítulo: ${result.title || 'N/A'}\nConteúdo: ${result.markdown?.slice(0, 1500) || result.description || 'N/A'}`;
    }).join('\n\n---\n\n') || 'Nenhum resultado encontrado';

    // Step 2: Process with Lovable AI to extract structured data
    const aiPrompt = `Analise os resultados de busca abaixo sobre a empresa "${company.name}" localizada em ${company.city}, ${company.state}.

Extraia as seguintes informações (se encontradas):
1. Website oficial da empresa
2. Email de contato
3. Instagram (@usuario)
4. Facebook (URL ou @usuario)
5. LinkedIn (URL)
6. Um breve resumo sobre a empresa (máximo 150 palavras)

IMPORTANTE: 
- Retorne APENAS um JSON válido, sem markdown ou texto adicional
- Se não encontrar uma informação, use null
- Para redes sociais, inclua apenas se for da própria empresa
- Valide que os dados são realmente da empresa "${company.name}"

Formato de resposta (JSON):
{
  "website": "https://...",
  "email": "contato@...",
  "instagram": "@...",
  "facebook": "https://... ou @...",
  "linkedin": "https://...",
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
