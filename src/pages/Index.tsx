import { useState, useMemo } from 'react';
import { Building2, Phone, Send, TrendingUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { SearchForm } from '@/components/SearchForm';
import { CompanyTable } from '@/components/CompanyTable';
import { MessagePanel } from '@/components/MessagePanel';
import { mockCompanies, mockTemplates } from '@/data/mockData';
import { Company, MessageTemplate, SearchFilters } from '@/types';

const Index = () => {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [templates, setTemplates] = useState<MessageTemplate[]>(mockTemplates);
  const [selectedPhones, setSelectedPhones] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCompanies = companies.length;
    const validPhones = companies.reduce(
      (acc, company) => acc + company.phones.filter((p) => p.status === 'valid').length,
      0
    );
    const messagesSent = companies.filter((c) => c.messageStatus === 'sent').length;
    const pendingMessages = companies.filter((c) => c.messageStatus === 'pending').length;

    return { totalCompanies, validPhones, messagesSent, pendingMessages };
  }, [companies]);

  // Count selected phones
  const selectedPhonesCount = useMemo(() => {
    return Object.values(selectedPhones).reduce((acc, phones) => acc + phones.length, 0);
  }, [selectedPhones]);

  const handleSearch = (filters: SearchFilters) => {
    setIsLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      let filtered = [...mockCompanies];

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

      setCompanies(filtered);
      setIsLoading(false);
    }, 800);
  };

  const handleSelectPhones = (companyId: string, phones: string[]) => {
    setSelectedPhones((prev) => ({
      ...prev,
      [companyId]: phones,
    }));
  };

  const handleAddTemplate = (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setTemplates((prev) => [...prev, newTemplate]);
  };

  const handleEditTemplate = (id: string, template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...template } : t))
    );
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSendMessages = (channel: 'whatsapp' | 'sms' | 'both', templateId: string) => {
    // Update message status for companies with selected phones
    setCompanies((prev) =>
      prev.map((company) => {
        if (selectedPhones[company.id]?.length > 0) {
          return { ...company, messageStatus: 'sent' as const };
        }
        return company;
      })
    );

    // Clear selections after sending
    setSelectedPhones({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 md:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-2 animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tight">
            Bem-vindo ao <span className="gradient-text">ProspectPro</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Encontre empresas, valide telefones e envie mensagens automatizadas de forma inteligente.
          </p>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Empresas Encontradas"
            value={metrics.totalCompanies}
            icon={Building2}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
            delay={0}
          />
          <MetricCard
            title="Telefones Válidos"
            value={metrics.validPhones}
            icon={Phone}
            variant="success"
            trend={{ value: 8, isPositive: true }}
            delay={100}
          />
          <MetricCard
            title="Mensagens Enviadas"
            value={metrics.messagesSent}
            icon={Send}
            variant="default"
            delay={200}
          />
          <MetricCard
            title="Taxa de Sucesso"
            value={`${metrics.messagesSent > 0 ? Math.round((metrics.messagesSent / (metrics.messagesSent + metrics.pendingMessages)) * 100) : 0}%`}
            icon={TrendingUp}
            variant="warning"
            delay={300}
          />
        </div>

        {/* Search Form */}
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Company Table */}
          <CompanyTable
            companies={companies}
            onSelectPhones={handleSelectPhones}
            selectedPhones={selectedPhones}
          />

          {/* Message Panel */}
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
      <footer className="border-t border-border/50 mt-16">
        <div className="container px-4 md:px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 ProspectPro. Prospecção comercial inteligente.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
