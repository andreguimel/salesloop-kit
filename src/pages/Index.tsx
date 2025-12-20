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
    setCompanies((prev) =>
      prev.map((company) => {
        if (selectedPhones[company.id]?.length > 0) {
          return { ...company, messageStatus: 'sent' as const };
        }
        return company;
      })
    );
    setSelectedPhones({});
  };

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
          <div className="space-y-3 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Prospecção <span className="text-gradient">Inteligente</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Encontre empresas, valide telefones e envie mensagens automatizadas.
            </p>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Empresas"
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
              variant="accent"
              trend={{ value: 8, isPositive: true }}
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
              value={`${metrics.messagesSent > 0 ? Math.round((metrics.messagesSent / (metrics.messagesSent + metrics.pendingMessages)) * 100) : 0}%`}
              icon={TrendingUp}
              variant="default"
              delay={150}
            />
          </div>

          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <CompanyTable
              companies={companies}
              onSelectPhones={handleSelectPhones}
              selectedPhones={selectedPhones}
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
    </div>
  );
};

export default Index;
