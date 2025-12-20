import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, limit = 20 }: SearchParams = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching businesses for:', query);

    // Use Firecrawl search to find businesses directly
    // Search for business listings, not Google Maps pages
    const searchQueries = [
      `${query} telefone contato endereço`,
      `${query} site oficial`,
    ];

    const allCompanies: any[] = [];

    for (const searchQuery of searchQueries) {
      console.log('Searching:', searchQuery);
      
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: Math.ceil(limit / 2),
          lang: 'pt',
          country: 'BR',
          scrapeOptions: {
            formats: ['markdown'],
          },
        }),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Firecrawl search error:', errorText);
        continue;
      }

      const searchData = await searchResponse.json();
      console.log(`Found ${searchData.data?.length || 0} results for: ${searchQuery}`);

      // Parse search results
      if (searchData.data && Array.isArray(searchData.data)) {
        for (const result of searchData.data) {
          const company = parseSearchResult(result);
          if (company && company.name && !isGenericResult(company.name)) {
            // Avoid duplicates
            if (!allCompanies.find(c => c.name.toLowerCase() === company.name.toLowerCase())) {
              allCompanies.push(company);
            }
          }
        }
      }
    }

    console.log(`Total unique companies found: ${allCompanies.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        companies: allCompanies.slice(0, limit),
        total: allCompanies.length,
        query,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-google-maps:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function isGenericResult(name: string): boolean {
  const genericTerms = [
    'results', 'map tools', 'map type', 'google maps', 'sign in',
    'get the most out', 'pesquisa', 'busca', 'home', 'menu',
    'collapse', 'expand', 'rating', 'hours', 'filters'
  ];
  const lowerName = name.toLowerCase();
  return genericTerms.some(term => lowerName.includes(term));
}

function parseSearchResult(result: any): any {
  if (!result) return null;

  const company: any = {
    name: '',
    phone1: '',
    address: '',
    website: '',
    rating: '',
    reviews: '',
    source: result.url || '',
  };

  // Extract name from title - clean up common suffixes
  if (result.title) {
    let name = result.title
      .replace(/ - Google Maps$/, '')
      .replace(/ \| .*$/, '')
      .replace(/ - .*$/, '')
      .replace(/ · .*$/, '')
      .trim();
    
    // If name is too long, take first part
    if (name.length > 80) {
      name = name.split(/[,\-|]/)[0].trim();
    }
    
    company.name = name;
  }

  // Extract from description/markdown
  const content = result.markdown || result.description || '';
  
  // Phone regex for Brazilian phones (with various formats)
  const phonePatterns = [
    /\(?\d{2}\)?\s*\d{4,5}[-.\s]?\d{4}/g,
    /\+55\s*\d{2}\s*\d{4,5}[-.\s]?\d{4}/g,
  ];
  
  for (const pattern of phonePatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Get the first valid phone
      company.phone1 = matches[0].replace(/\D/g, '');
      if (company.phone1.startsWith('55') && company.phone1.length > 11) {
        company.phone1 = company.phone1.substring(2);
      }
      break;
    }
  }

  // Try to extract address
  const addressPatterns = [
    /(?:Endereço|Localização|End\.?):\s*([^\n]+)/i,
    /(?:R\.|Rua|Av\.|Avenida|Al\.|Alameda|Pça\.|Praça|Travessa|Tv\.)[^,\n]+(?:,\s*\d+)?(?:\s*-\s*[^,\n]+)?(?:,\s*[^,\n]+)?/i,
  ];
  
  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) {
      company.address = (match[1] || match[0]).trim().substring(0, 200);
      break;
    }
  }

  // Extract website from URL if it's a business website
  if (result.url && !result.url.includes('google.com') && !result.url.includes('facebook.com')) {
    try {
      const url = new URL(result.url);
      company.website = url.origin;
    } catch {
      // Ignore invalid URLs
    }
  }

  // Extract rating
  const ratingMatch = content.match(/(\d[,\.]\d)\s*(?:estrelas?|⭐|\/\s*5)/i);
  if (ratingMatch) {
    company.rating = ratingMatch[1];
  }

  // Extract review count
  const reviewMatch = content.match(/\((\d+(?:\.\d+)?(?:k|K)?)\s*(?:avaliações?|reviews?|opiniões?)\)/i);
  if (reviewMatch) {
    company.reviews = reviewMatch[1];
  }

  return company;
}
