import { useState, useEffect } from 'react';
import { Building2, Phone, TrendingUp, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '@/components/MetricCard';
import { fetchMetrics } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({ 
    totalCompanies: 0, 
    validPhones: 0, 
    messagesSent: 0, 
    pendingMessages: 0 
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const metricsData = await fetchMetrics();
      setMetrics(metricsData);
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
      <div className="space-y-2 animate-fade-up">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl">
          Visão geral da sua prospecção comercial.
        </p>
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 md:p-6 rounded-2xl glass animate-fade-up" style={{ animationDelay: '200ms' }}>
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

        <div className="p-4 md:p-6 rounded-2xl glass animate-fade-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg gradient-accent">
              <Phone className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold">Validar Telefones</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Valide os telefones das empresas cadastradas.
          </p>
          <Link 
            to="/buscar" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver empresas →
          </Link>
        </div>

        <div className="p-4 md:p-6 rounded-2xl glass animate-fade-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: '300ms' }}>
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
