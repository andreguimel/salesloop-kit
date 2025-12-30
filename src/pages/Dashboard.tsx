import { useState, useEffect } from 'react';
import { Building2, Phone, TrendingUp, Search, Loader2, Target, Sparkles, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '@/components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompaniesChart } from '@/components/dashboard/CompaniesChart';
import { CrmFunnelChart } from '@/components/dashboard/CrmFunnelChart';
import { EnrichmentRateCard } from '@/components/dashboard/EnrichmentRateCard';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { fetchMetrics } from '@/lib/api';
import { fetchCompaniesWithCrmData, fetchPipelineStages, fetchCrmMetrics } from '@/lib/crm-api';
import { Company, PipelineStage } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [metrics, setMetrics] = useState({ 
    totalCompanies: 0, 
    validPhones: 0, 
    messagesSent: 0, 
    pendingMessages: 0 
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [funnelData, setFunnelData] = useState<{ stageId: string; stageName: string; count: number; value: number; color: string }[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [metricsData, companiesData, stagesData, crmMetrics] = await Promise.all([
        fetchMetrics(),
        fetchCompaniesWithCrmData(),
        fetchPipelineStages(),
        fetchCrmMetrics(),
      ]);
      
      setMetrics(metricsData);
      setCompanies(companiesData);
      setStages(stagesData);
      
      // Build funnel data with colors
      const funnel = crmMetrics.stageDistribution.map(item => {
        const stage = stagesData.find(s => s.id === item.stageId);
        return {
          ...item,
          color: stage?.color || '#6366f1',
        };
      });
      setFunnelData(funnel);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: 'Erro ao carregar métricas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enrichedCount = companies.filter(c => c.enrichedAt).length;

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
        <div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 animate-fade-up">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            Visão geral da sua prospecção comercial.
          </p>
        </div>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Empresas"
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
          title="Telefones Pendentes"
          value={metrics.pendingMessages}
          icon={Search}
          variant="default"
          delay={100}
        />
        <MetricCard
          title="Taxa de Validação"
          value={`${metrics.validPhones + metrics.pendingMessages > 0 
            ? Math.round((metrics.validPhones / (metrics.validPhones + metrics.pendingMessages)) * 100) 
            : 0}%`}
          icon={TrendingUp}
          variant="success"
          delay={150}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Companies Evolution Chart */}
        <Card className="glass border-border/30 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Empresas Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompaniesChart companies={companies} />
          </CardContent>
        </Card>

        {/* CRM Funnel Chart */}
        <Card className="glass border-border/30 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Funil de Conversão CRM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrmFunnelChart data={funnelData} />
          </CardContent>
        </Card>
      </div>

      {/* Enrichment Rate Card */}
      <Card className="glass border-border/30 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <CardContent className="pt-6">
          <EnrichmentRateCard enriched={enrichedCount} total={companies.length} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 md:p-6 rounded-2xl glass animate-fade-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg gradient-primary">
              <Search className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">Buscar Empresas</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Encontre novas empresas por CNAE, cidade ou segmento.
          </p>
          <Link 
            to="/buscar" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Iniciar busca →
          </Link>
        </div>

        <div className="p-4 md:p-6 rounded-2xl glass animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg gradient-accent">
              <Target className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold">CRM</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Gerencie seus leads e oportunidades de vendas.
          </p>
          <Link 
            to="/crm" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Acessar CRM →
          </Link>
        </div>

        <div className="p-4 md:p-6 rounded-2xl glass animate-fade-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary">
              <TrendingUp className="h-5 w-5 text-foreground" />
            </div>
            <h3 className="font-semibold">Relatórios</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Analise o desempenho da sua prospecção.
          </p>
          <Link 
            to="/relatorios" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver relatórios →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
