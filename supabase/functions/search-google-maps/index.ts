import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchParams {
  query: string; // Ex: "agências de publicidade em Recife PE"
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

    console.log('Searching Google Maps for:', query);

    // Use Firecrawl search to find businesses
    const searchQuery = `${query} site:google.com/maps`;
    
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: Math.min(limit, 10),
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
      return new Response(
        JSON.stringify({ error: 'Erro na busca', details: errorText }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', JSON.stringify(searchData).slice(0, 1000));

    // Now scrape the Google Maps search page directly
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    console.log('Scraping Google Maps URL:', mapsUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: mapsUrl,
        formats: ['markdown', 'links'],
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl scrape error:', errorText);
      // Continue with search results if scrape fails
    }

    let scrapeData = null;
    if (scrapeResponse.ok) {
      scrapeData = await scrapeResponse.json();
      console.log('Scrape results:', JSON.stringify(scrapeData).slice(0, 1000));
    }

    // Parse the results to extract company information
    const companies: any[] = [];
    
    // Parse search results
    if (searchData.data && Array.isArray(searchData.data)) {
      for (const result of searchData.data) {
        const company = parseGoogleMapsResult(result);
        if (company && company.name) {
          companies.push(company);
        }
      }
    }

    // Parse markdown content from scrape
    if (scrapeData?.data?.markdown) {
      const parsedFromMarkdown = parseMarkdownForBusinesses(scrapeData.data.markdown);
      for (const company of parsedFromMarkdown) {
        // Avoid duplicates
        if (!companies.find(c => c.name === company.name)) {
          companies.push(company);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        companies: companies.slice(0, limit),
        total: companies.length,
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

function parseGoogleMapsResult(result: any): any {
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

  // Extract from title
  if (result.title) {
    company.name = result.title.replace(/ - Google Maps$/, '').replace(/ · .*$/, '').trim();
  }

  // Extract from description/markdown
  const content = result.markdown || result.description || '';
  
  // Phone regex for Brazilian phones
  const phoneMatch = content.match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
  if (phoneMatch) {
    company.phone1 = phoneMatch[0].replace(/\D/g, '');
  }

  // Try to extract address
  const addressPatterns = [
    /(?:R\.|Rua|Av\.|Avenida|Al\.|Alameda|Pça\.|Praça)[^,\n]+(?:,\s*\d+)?(?:\s*-\s*[^,\n]+)?/i,
  ];
  for (const pattern of addressPatterns) {
    const match = content.match(pattern);
    if (match) {
      company.address = match[0].trim();
      break;
    }
  }

  // Extract rating
  const ratingMatch = content.match(/(\d[,\.]\d)\s*(?:estrelas?|⭐)/i);
  if (ratingMatch) {
    company.rating = ratingMatch[1];
  }

  // Extract review count
  const reviewMatch = content.match(/\((\d+(?:\.\d+)?)\s*(?:avaliações?|reviews?)\)/i);
  if (reviewMatch) {
    company.reviews = reviewMatch[1];
  }

  return company;
}

function parseMarkdownForBusinesses(markdown: string): any[] {
  const companies: any[] = [];
  
  // Split by potential business entries (looking for patterns)
  const lines = markdown.split('\n');
  let currentCompany: any = null;

  for (const line of lines) {
    // Look for business names (usually in headers or bold)
    const headerMatch = line.match(/^#+\s*(.+)$/) || line.match(/^\*\*(.+)\*\*$/);
    if (headerMatch) {
      if (currentCompany && currentCompany.name) {
        companies.push(currentCompany);
      }
      currentCompany = {
        name: headerMatch[1].trim(),
        phone1: '',
        address: '',
        website: '',
        rating: '',
        reviews: '',
      };
      continue;
    }

    if (currentCompany) {
      // Extract phone
      const phoneMatch = line.match(/\(?\d{2}\)?\s*\d{4,5}[-\s]?\d{4}/);
      if (phoneMatch && !currentCompany.phone1) {
        currentCompany.phone1 = phoneMatch[0].replace(/\D/g, '');
      }

      // Extract address
      if (line.match(/(?:R\.|Rua|Av\.|Avenida)/i) && !currentCompany.address) {
        currentCompany.address = line.trim();
      }

      // Extract rating
      const ratingMatch = line.match(/(\d[,\.]\d)\s*(?:estrelas?|⭐)/i);
      if (ratingMatch && !currentCompany.rating) {
        currentCompany.rating = ratingMatch[1];
      }
    }
  }

  // Don't forget the last company
  if (currentCompany && currentCompany.name) {
    companies.push(currentCompany);
  }

  return companies;
}
