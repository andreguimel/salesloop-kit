import { useState, useMemo, useEffect } from 'react';
import { Building2, Phone, Send, TrendingUp, Plus, Loader2, Search, Download, MapPin } from 'lucide-react';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { SearchForm } from '@/components/SearchForm';
import { CompanyTable } from '@/components/CompanyTable';
import { MessagePanel } from '@/components/MessagePanel';
import { AddCompanyDialog } from '@/components/AddCompanyDialog';
import { SearchByCnpjDialog } from '@/components/SearchByCnpjDialog';
import { SearchByCnaeDialog } from '@/components/SearchByCnaeDialog';
import { SearchByCepDialog } from '@/components/SearchByCepDialog';
import { SearchGoogleMapsDialog } from '@/components/SearchGoogleMapsDialog';
import { ExportCsvDialog } from '@/components/ExportCsvDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchCompanies, 
  fetchTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  sendMessage,
  fetchMetrics
} from '@/lib/api';
import { Company, MessageTemplate, SearchFilters } from '@/types';

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

interface DbTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showSearchCompanies, setShowSearchCompanies] = useState(false);
  const [showSearchByCep, setShowSearchByCep] = useState(false);
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
      const [companiesData, templatesData, metricsData] = await Promise.all([
        fetchCompanies(),
        fetchTemplates(),
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

      const mappedTemplates: MessageTemplate[] = (templatesData as DbTemplate[]).map((t) => ({
        id: t.id,
        name: t.name,
        content: t.content,
        createdAt: new Date(t.created_at),
      }));

      setCompanies(mappedCompanies);
      setFilteredCompanies(mappedCompanies);
      setTemplates(mappedTemplates);
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

  // Count selected phones
  const selectedPhonesCount = useMemo(() => {
    return Object.values(selectedPhones).reduce((acc, phones) => acc + phones.length, 0);
  }, [selectedPhones]);

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

  const handleSelectPhones = (companyId: string, phones: string[]) => {
    setSelectedPhones((prev) => ({
      ...prev,
      [companyId]: phones,
    }));
  };

  const handleAddTemplate = async (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    try {
      const newTemplate = await createTemplate(template);
      setTemplates((prev) => [...prev, {
        id: newTemplate.id,
        name: newTemplate.name,
        content: newTemplate.content,
        createdAt: new Date(newTemplate.created_at),
      }]);
      toast({ title: 'Template criado!' });
    } catch (error) {
      toast({
        title: 'Erro ao criar template',
        variant: 'destructive',
      });
    }
  };

  const handleEditTemplate = async (id: string, template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    try {
      await updateTemplate(id, template);
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...template } : t))
      );
      toast({ title: 'Template atualizado!' });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar template',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'Template excluído!' });
    } catch (error) {
      toast({
        title: 'Erro ao excluir template',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessages = async (channel: 'whatsapp' | 'sms' | 'both', templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const channels: ('whatsapp' | 'sms')[] = channel === 'both' ? ['whatsapp', 'sms'] : [channel];
    let sentCount = 0;

    try {
      for (const companyId of Object.keys(selectedPhones)) {
        const phones = selectedPhones[companyId];
        const company = companies.find(c => c.id === companyId);
        
        if (!company) continue;

        for (const phoneNumber of phones) {
          const phone = company.phones.find(p => p.number === phoneNumber);
          if (!phone || !phone.id) continue;

          for (const ch of channels) {
            await sendMessage(companyId, phone.id, templateId, ch, template.content);
            sentCount++;
          }
        }
      }

      toast({
        title: 'Mensagens enviadas!',
        description: `${sentCount} mensagem(ns) foram enviadas com sucesso.`,
      });

      // Refresh metrics
      const metricsData = await fetchMetrics();
      setMetrics(metricsData);

      // Clear selections
      setSelectedPhones({});
    } catch (error) {
      toast({
        title: 'Erro ao enviar mensagens',
        variant: 'destructive',
      });
    }
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
                Encontre empresas, valide telefones e envie mensagens automatizadas.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SearchGoogleMapsDialog onCompaniesImported={handleCompaniesImported} />
              <SearchByCnaeDialog onCompaniesImported={handleCompaniesImported} />
              <Button 
                onClick={() => setShowSearchByCep(true)}
                variant="outline"
                className="gap-2 border-accent/30 hover:bg-accent/10"
              >
                <MapPin className="h-4 w-4" />
                Buscar por CEP
              </Button>
              <Button 
                onClick={() => setShowSearchCompanies(true)}
                variant="outline"
                className="gap-2 border-primary/30 hover:bg-primary/10"
              >
                <Search className="h-4 w-4" />
                Buscar por CNPJ
              </Button>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              title="Mensagens Enviadas"
              value={metrics.messagesSent}
              icon={Send}
              variant="success"
              delay={100}
            />
            <MetricCard
              title="Taxa de Sucesso"
              value={`${metrics.messagesSent > 0 ? Math.round((metrics.messagesSent / (metrics.messagesSent + metrics.pendingMessages + 1)) * 100) : 0}%`}
              icon={TrendingUp}
              variant="default"
              delay={150}
            />
          </div>

          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isSearching} />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <CompanyTable
              companies={filteredCompanies}
              onSelectPhones={handleSelectPhones}
              selectedPhones={selectedPhones}
              onPhonesValidated={loadData}
            />
            <MessagePanel
              templates={templates}
              onAddTemplate={handleAddTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              selectedPhonesCount={selectedPhonesCount}
              onSendMessages={handleSendMessages}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 mt-16">
          <div className="container px-4 md:px-8 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 ProspectPro — Prospecção comercial inteligente
            </p>
          </div>
        </footer>
      </div>

      <AddCompanyDialog 
        open={showAddCompany} 
        onOpenChange={setShowAddCompany}
        onCompanyAdded={handleCompanyAdded}
      />

      <SearchByCnpjDialog
        open={showSearchCompanies}
        onOpenChange={setShowSearchCompanies}
        onCompanyImported={handleCompaniesImported}
      />

      <ExportCsvDialog
        open={showExportCsv}
        onOpenChange={setShowExportCsv}
        companies={filteredCompanies}
      />

      <SearchByCepDialog
        open={showSearchByCep}
        onOpenChange={setShowSearchByCep}
        onCompanyImported={handleCompaniesImported}
      />
    </div>
  );
};

export default Index;
