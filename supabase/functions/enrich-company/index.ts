import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MINUTES = 60;

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { data: withinLimit } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'enrich-company',
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });

    if (!withinLimit) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Limite de requisições excedido. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment rate limit counter
    await supabase.rpc('increment_rate_limit', {
      p_user_id: user.id,
      p_endpoint: 'enrich-company'
    });

    const { company } = await req.json() as { company: CompanyData };

    if (!company || !company.name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados da empresa são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} enriching company:`, company.name, 'CNPJ:', company.cnpj);

    // Log audit event
    await supabase.rpc('log_audit_event', {
      p_user_id: user.id,
      p_action: 'enrich',
      p_table_name: 'companies',
      p_record_id: company.id,
      p_old_data: null,
      p_new_data: { name: company.name, cnpj: company.cnpj },
      p_ip_address: req.headers.get('x-forwarded-for'),
      p_user_agent: req.headers.get('user-agent')
    });

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

    // Clean CNPJ for search
    const cleanCnpj = company.cnpj?.replace(/\D/g, '') || '';
    const hasCnpj = cleanCnpj.length === 14;

    // Build search queries
    let primarySearchQuery: string;
    let secondaryNameSearch = '';
    
    if (hasCnpj) {
      const formattedCnpj = cleanCnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
      primarySearchQuery = `"${company.name}" ${company.city} ${company.state} empresa site contato email`;
      secondaryNameSearch = `CNPJ ${formattedCnpj} OR "${formattedCnpj}" empresa`;
    } else {
      primarySearchQuery = `"${company.name}" ${company.city} ${company.state} empresa site oficial contato email`;
    }

    console.log('Primary search:', primarySearchQuery);

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
    console.log('Primary search results:', firecrawlData.data?.length || 0);

    // Contact search
    const contactSearchQuery = `"${company.name}" ${company.city} ${company.state} contato email telefone whatsapp`;
    const contactResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: contactSearchQuery,
        limit: 5,
        scrapeOptions: { formats: ['markdown', 'links'] },
      }),
    });

    let contactData: any = { data: [] };
    if (contactResponse.ok) {
      contactData = await contactResponse.json();
    }

    // Social media search
    const socialSearchQuery = `"${company.name}" ${company.city} instagram OR facebook OR linkedin`;
    const socialResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: socialSearchQuery,
        limit: 5,
        scrapeOptions: { formats: ['markdown', 'links'] },
      }),
    });

    let socialData: any = { data: [] };
    if (socialResponse.ok) {
      socialData = await socialResponse.json();
    }

    // Combine all results
    const allResults = [
      ...(firecrawlData.data || []), 
      ...(contactData.data || []),
      ...(socialData.data || [])
    ];

    const searchContent = allResults.map((result: any) => {
      const links = result.links?.slice(0, 15)?.join('\n') || '';
      return `URL: ${result.url}\nTítulo: ${result.title || 'N/A'}\nLinks:\n${links}\nConteúdo: ${result.markdown?.slice(0, 2500) || result.description || 'N/A'}`;
    }).join('\n\n---\n\n') || 'Nenhum resultado';

    const aiPrompt = `Analise os resultados sobre a empresa:
- Nome: "${company.name}"
- CNPJ: ${company.cnpj || 'Não informado'}
- Cidade: ${company.city}, ${company.state}

Extraia informações REAIS desta empresa:
1. RAZÃO SOCIAL (nome jurídico oficial)
2. NOME FANTASIA (nome comercial)
3. Website oficial
4. Email de contato
5. Instagram oficial
6. Facebook oficial
7. LinkedIn
8. Resumo (máximo 150 palavras)

REGRAS:
- Retorne APENAS JSON válido
- Se não encontrar, use null
- VALIDE que as informações são DESTA empresa
- IGNORE emails/dados com asteriscos (***)
- IGNORE informações de outras empresas

Formato:
{
  "razaoSocial": "RAZAO SOCIAL LTDA" ou null,
  "nomeFantasia": "Nome Fantasia" ou null,
  "website": "https://site.com" ou null,
  "email": "email@empresa.com" ou null,
  "instagram": "https://instagram.com/empresa" ou null,
  "facebook": "https://facebook.com/empresa" ou null,
  "linkedin": "https://linkedin.com/company/empresa" ou null,
  "summary": "Descrição..." ou null
}

RESULTADOS:
${searchContent}`;

    console.log('Calling Lovable AI...');

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
            content: 'Você extrai dados empresariais. Retorne apenas JSON válido.'
          },
          { role: 'user', content: aiPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos insuficientes' }),
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

    let enrichmentResult: EnrichmentResult = {};
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const razaoSocial = parsed.razaoSocial && !parsed.razaoSocial.includes('*') ? parsed.razaoSocial : undefined;
        const nomeFantasia = parsed.nomeFantasia && !parsed.nomeFantasia.includes('*') ? parsed.nomeFantasia : undefined;
        
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
          razaoSocial,
          nomeFantasia,
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
        aiSummary: 'Não foi possível extrair informações estruturadas.',
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
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
