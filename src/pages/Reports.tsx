import { useState, useEffect } from 'react';
import { FileBarChart, Building2, Target, TrendingUp, DollarSign, Sparkles, Users, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportData {
  totalCompanies: number;
  enrichedCompanies: number;
  companiesInCrm: number;
  totalDealValue: number;
  companiesByState: Record<string, number>;
  companiesByStage: { name: string; color: string; count: number; value: number }[];
  recentCompanies: number;
  companiesWithEmail: number;
}

const Reports = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, state, enriched_at, crm_stage_id, deal_value, email, created_at')
        .eq('user_id', user.id);

      if (companiesError) throw companiesError;

      // Fetch CRM stages
      const { data: stages, error: stagesError } = await supabase
        .from('crm_pipeline_stages')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('position');

      if (stagesError) throw stagesError;

      // Calculate metrics
      const companiesByState: Record<string, number> = {};
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      let enrichedCount = 0;
      let inCrmCount = 0;
      let totalValue = 0;
      let recentCount = 0;
      let withEmailCount = 0;

      companies?.forEach(c => {
        companiesByState[c.state] = (companiesByState[c.state] || 0) + 1;
        if (c.enriched_at) enrichedCount++;
        if (c.crm_stage_id) {
          inCrmCount++;
          totalValue += c.deal_value || 0;
        }
        if (c.email) withEmailCount++;
        if (new Date(c.created_at) >= thirtyDaysAgo) recentCount++;
      });

      // Calculate companies by stage
      const companiesByStage = stages?.map(stage => {
        const stageCompanies = companies?.filter(c => c.crm_stage_id === stage.id) || [];
        return {
          name: stage.name,
          color: stage.color,
          count: stageCompanies.length,
          value: stageCompanies.reduce((sum, c) => sum + (c.deal_value || 0), 0)
        };
      }) || [];

      setData({
        totalCompanies: companies?.length || 0,
        enrichedCompanies: enrichedCount,
        companiesInCrm: inCrmCount,
        totalDealValue: totalValue,
        companiesByState,
        companiesByStage,
        recentCompanies: recentCount,
        companiesWithEmail: withEmailCount,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: 'Erro ao carregar relatórios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const topStates = Object.entries(data.companiesByState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const enrichmentRate = data.totalCompanies > 0 
    ? Math.round((data.enrichedCompanies / data.totalCompanies) * 100) 
    : 0;

  const crmRate = data.totalCompanies > 0 
    ? Math.round((data.companiesInCrm / data.totalCompanies) * 100) 
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="space-y-2 animate-fade-up">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
          Relatórios
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl">
          Análise detalhada da sua base de prospecção e pipeline de vendas.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total de Empresas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalCompanies}</p>
            <p className="text-xs text-muted-foreground mt-1">
              +{data.recentCompanies} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Enriquecidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.enrichedCompanies}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {enrichmentRate}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" />
              No Pipeline CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{data.companiesInCrm}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {crmRate}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-success">
              <DollarSign className="h-4 w-4" />
              Valor Total Pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-success">{formatCurrency(data.totalDealValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              em oportunidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline by Stage */}
        <Card className="glass border-border/50 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Pipeline por Estágio
            </CardTitle>
            <CardDescription>Distribuição de leads no funil de vendas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.companiesByStage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum estágio criado no CRM</p>
                <p className="text-xs mt-1">Crie estágios no CRM para ver estatísticas aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.companiesByStage.map((stage, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-medium">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {stage.count} {stage.count === 1 ? 'empresa' : 'empresas'}
                        </Badge>
                        {stage.value > 0 && (
                          <span className="text-xs text-success font-medium">
                            {formatCurrency(stage.value)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: data.companiesInCrm > 0 ? `${(stage.count / data.companiesInCrm) * 100}%` : '0%',
                          backgroundColor: stage.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top States */}
        <Card className="glass border-border/50 animate-fade-up" style={{ animationDelay: '250ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-primary" />
              Empresas por Estado
            </CardTitle>
            <CardDescription>Top 5 estados com mais empresas</CardDescription>
          </CardHeader>
          <CardContent>
            {topStates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topStates.map(([state, count], index) => (
                  <div key={state} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{state}</span>
                      <span className="text-sm text-muted-foreground">{count} empresa{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className="h-full rounded-full gradient-primary transition-all"
                        style={{ 
                          width: `${(count / (topStates[0]?.[1] || 1)) * 100}%`,
                          opacity: 1 - (index * 0.15)
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card className="glass border-border/50 animate-fade-up lg:col-span-2" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Métricas Adicionais
            </CardTitle>
            <CardDescription>Visão geral da qualidade dos dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-center">
                <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{enrichmentRate}%</p>
                <p className="text-xs text-muted-foreground">Taxa de Enriquecimento</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold">{crmRate}%</p>
                <p className="text-xs text-muted-foreground">Leads no CRM</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold">{data.companiesWithEmail}</p>
                <p className="text-xs text-muted-foreground">Com E-mail</p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold">{data.recentCompanies}</p>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
