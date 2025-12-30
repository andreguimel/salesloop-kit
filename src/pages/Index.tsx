import { useState, useEffect } from 'react';
import { Building2, Phone, TrendingUp, Plus, Loader2, Download } from 'lucide-react';
import { Header } from '@/components/Header';
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
  cnae: string;
  cnae_description: string | null;
  city: string;
  state: string;
  segment: string | null;
  company_phones: Array<{
    id: string;
    phone_number: string;
    phone_type: string;
    status: string;
  }>;
}

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showExportCsv, setShowExportCsv] = useState(false);
  const [metrics, setMetrics] = useState({ totalCompanies: 0, validPhones: 0, messagesSent: 0, pendingMessages: 0 });
  
  const { toast } = useToast();

  // Load data on mount
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
        cnae: c.cnae,
        cnaeDescription: c.cnae_description || '',
        city: c.city,
        state: c.state,
        segment: c.segment || '',
        phones: c.company_phones.map((p) => ({
          id: p.id,
          number: p.phone_number,
          type: p.phone_type as 'mobile' | 'landline',
          status: p.status as 'valid' | 'uncertain' | 'invalid' | 'pending',
        })),
        messageStatus: 'none' as const,
      }));

      setCompanies(mappedCompanies);
      setFilteredCompanies(mappedCompanies);
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

  const handleSearch = (filters: SearchFilters) => {
    setIsSearching(true);
    
    setTimeout(() => {
      let filtered = [...companies];

      if (filters.cnae) {
        filtered = filtered.filter((c) =>
          c.cnae.toLowerCase().includes(filters.cnae.toLowerCase())
        );
      }
      if (filters.city) {
        filtered = filtered.filter((c) => c.city === filters.city);
      }
      if (filters.segment) {
        filtered = filtered.filter((c) => c.segment === filters.segment);
      }

      setFilteredCompanies(filtered);
      setIsSearching(false);
    }, 300);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <Header />
        
        <main className="container px-4 md:px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="space-y-3 animate-fade-up">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Prospecção <span className="text-gradient">Inteligente</span>
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Encontre empresas e valide telefones de forma automatizada.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SearchApiDialog onCompaniesImported={handleCompaniesImported} />
              {filteredCompanies.length > 0 && (
                <Button 
                  onClick={() => setShowExportCsv(true)}
                  variant="outline"
                  className="gap-2 border-accent/30 hover:bg-accent/10"
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              )}
              <Button 
                onClick={() => setShowAddCompany(true)}
                className="gap-2 gradient-primary hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Adicionar
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

          {/* Company Table - Full Width */}
          <CompanyTable
            companies={filteredCompanies}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 mt-16">
          <div className="container px-4 md:px-8 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 Achei Leads — Prospecção comercial inteligente
            </p>
          </div>
        </footer>
      </div>

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

export default Index;
