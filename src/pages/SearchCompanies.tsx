import { useState, useEffect, useMemo } from 'react';
import { Building2, Phone, TrendingUp, Plus, Loader2, Download } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { SearchForm } from '@/components/SearchForm';
import { CompanyTable } from '@/components/CompanyTable';
import { AddCompanyDialog } from '@/components/AddCompanyDialog';
import { SearchApiDialog } from '@/components/SearchApiDialog';
import { ExportCsvDialog } from '@/components/ExportCsvDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchCompanies, 
  fetchMetrics
} from '@/lib/api';
import { Company, SearchFilters } from '@/types';

interface DbCompany {
  id: string;
  name: string;
  cnpj: string | null;
  cnae: string;
  cnae_description: string | null;
  city: string;
  state: string;
  address: string | null;
  cep: string | null;
  segment: string | null;
  website: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  ai_summary: string | null;
  enriched_at: string | null;
  crm_stage_id: string | null;
  company_phones: Array<{
    id: string;
    phone_number: string;
    phone_type: string;
    status: string;
  }>;
}

const SearchCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    cnae: '',
    city: '',
    segment: '',
    name: '',
    enrichmentStatus: 'all',
    crmStageId: '',
    sortBy: 'newest',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showExportCsv, setShowExportCsv] = useState(false);
  const [metrics, setMetrics] = useState({ totalCompanies: 0, validPhones: 0, messagesSent: 0, pendingMessages: 0 });
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [companiesData, metricsData] = await Promise.all([
        fetchCompanies(),
        fetchMetrics(),
      ]);

      const mappedCompanies: Company[] = (companiesData as DbCompany[]).map((c) => ({
        id: c.id,
        name: c.name,
        cnpj: c.cnpj || undefined,
        cnae: c.cnae,
        cnaeDescription: c.cnae_description || '',
        city: c.city,
        state: c.state,
        address: c.address || undefined,
        cep: c.cep || undefined,
        segment: c.segment || '',
        website: c.website || undefined,
        email: c.email || undefined,
        instagram: c.instagram || undefined,
        facebook: c.facebook || undefined,
        linkedin: c.linkedin || undefined,
        aiSummary: c.ai_summary || undefined,
        enrichedAt: c.enriched_at || undefined,
        crmStageId: c.crm_stage_id || undefined,
        phones: c.company_phones.map((p) => ({
          id: p.id,
          number: p.phone_number,
          type: p.phone_type as 'mobile' | 'landline',
          status: p.status as 'valid' | 'uncertain' | 'invalid' | 'pending',
        })),
        messageStatus: 'none' as const,
      }));

      setCompanies(mappedCompanies);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    setIsSearching(true);
    
    let result = [...companies];

    // Filter by name
    if (filters.name) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // Filter by CNAE
    if (filters.cnae) {
      result = result.filter((c) =>
        c.cnae.toLowerCase().includes(filters.cnae.toLowerCase())
      );
    }

    // Filter by city
    if (filters.city) {
      result = result.filter((c) => c.city === filters.city);
    }

    // Filter by segment
    if (filters.segment) {
      result = result.filter((c) => c.segment === filters.segment);
    }

    // Filter by enrichment status
    if (filters.enrichmentStatus === 'enriched') {
      result = result.filter((c) => c.enrichedAt);
    } else if (filters.enrichmentStatus === 'not_enriched') {
      result = result.filter((c) => !c.enrichedAt);
    }

    // Filter by CRM stage
    if (filters.crmStageId === 'none') {
      result = result.filter((c) => !c.crmStageId);
    } else if (filters.crmStageId) {
      result = result.filter((c) => c.crmStageId === filters.crmStageId);
    }

    // Sort
    switch (filters.sortBy) {
      case 'oldest':
        result.reverse();
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'city_asc':
        result.sort((a, b) => a.city.localeCompare(b.city));
        break;
      default:
        // 'newest' - already sorted by created_at desc from API
        break;
    }

    setIsSearching(false);
    return result;
  }, [companies, filters]);

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleCompanyAdded = () => {
    loadData();
    setShowAddCompany(false);
  };

  const handleCompaniesImported = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <div className="space-y-2 animate-fade-up">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Buscar Empresas
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Encontre empresas e valide telefones de forma automatizada.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SearchApiDialog onCompaniesImported={handleCompaniesImported} />
          {filteredCompanies.length > 0 && (
            <Button 
              onClick={() => setShowExportCsv(true)}
              variant="outline"
              size="sm"
              className="gap-2 border-accent/30 hover:bg-accent/10"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          )}
          <Button 
            onClick={() => setShowAddCompany(true)}
            size="sm"
            className="gap-2 gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Empresas"
          value={metrics.totalCompanies}
          icon={Building2}
          variant="primary"
          delay={0}
        />
        <MetricCard
          title="Telefones Válidos"
          value={metrics.validPhones}
          icon={Phone}
          variant="accent"
          delay={50}
        />
        <MetricCard
          title="Taxa de Validação"
          value={`${metrics.totalCompanies > 0 ? Math.round((metrics.validPhones / Math.max(metrics.validPhones + metrics.pendingMessages, 1)) * 100) : 0}%`}
          icon={TrendingUp}
          variant="success"
          delay={100}
        />
      </div>

      {/* Search Form */}
      <SearchForm onSearch={handleSearch} isLoading={isSearching} />

      {/* Company Table */}
      <CompanyTable
        companies={filteredCompanies}
        onCompanyDeleted={loadData}
        onCompanyEnriched={loadData}
      />

      <AddCompanyDialog 
        open={showAddCompany} 
        onOpenChange={setShowAddCompany}
        onCompanyAdded={handleCompanyAdded}
      />

      <ExportCsvDialog
        open={showExportCsv}
        onOpenChange={setShowExportCsv}
        companies={filteredCompanies}
      />
    </div>
  );
};

export default SearchCompanies;
