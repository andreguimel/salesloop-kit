import { useState, useEffect } from 'react';
import { FileBarChart, Building2, Phone, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportData {
  totalCompanies: number;
  totalPhones: number;
  validPhones: number;
  invalidPhones: number;
  pendingPhones: number;
  uncertainPhones: number;
  companiesByState: Record<string, number>;
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

      // Fetch companies with phones
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          state,
          company_phones (
            id,
            status
          )
        `)
        .eq('user_id', user.id);

      if (companiesError) throw companiesError;

      // Calculate metrics
      const allPhones = companies?.flatMap(c => c.company_phones) || [];
      const companiesByState: Record<string, number> = {};
      
      companies?.forEach(c => {
        companiesByState[c.state] = (companiesByState[c.state] || 0) + 1;
      });

      setData({
        totalCompanies: companies?.length || 0,
        totalPhones: allPhones.length,
        validPhones: allPhones.filter(p => p.status === 'valid').length,
        invalidPhones: allPhones.filter(p => p.status === 'invalid').length,
        pendingPhones: allPhones.filter(p => p.status === 'pending').length,
        uncertainPhones: allPhones.filter(p => p.status === 'uncertain').length,
        companiesByState,
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

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="space-y-3 animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Relatórios
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Análise detalhada da sua base de prospecção.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total de Empresas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalCompanies}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Total de Telefones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalPhones}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Telefones Válidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{data.validPhones}</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              Telefones Inválidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{data.invalidPhones}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Phone Status Breakdown */}
        <Card className="glass border-border/50 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Status dos Telefones
            </CardTitle>
            <CardDescription>Distribuição por status de validação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Válidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.validPhones}</span>
                  <span className="text-xs text-muted-foreground">
                    ({data.totalPhones > 0 ? Math.round((data.validPhones / data.totalPhones) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Inválidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.invalidPhones}</span>
                  <span className="text-xs text-muted-foreground">
                    ({data.totalPhones > 0 ? Math.round((data.invalidPhones / data.totalPhones) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Incertos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.uncertainPhones}</span>
                  <span className="text-xs text-muted-foreground">
                    ({data.totalPhones > 0 ? Math.round((data.uncertainPhones / data.totalPhones) * 100) : 0}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{data.pendingPhones}</span>
                  <span className="text-xs text-muted-foreground">
                    ({data.totalPhones > 0 ? Math.round((data.pendingPhones / data.totalPhones) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {data.totalPhones > 0 && (
              <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
                <div 
                  className="bg-green-500 transition-all" 
                  style={{ width: `${(data.validPhones / data.totalPhones) * 100}%` }} 
                />
                <div 
                  className="bg-red-500 transition-all" 
                  style={{ width: `${(data.invalidPhones / data.totalPhones) * 100}%` }} 
                />
                <div 
                  className="bg-yellow-500 transition-all" 
                  style={{ width: `${(data.uncertainPhones / data.totalPhones) * 100}%` }} 
                />
                <div 
                  className="bg-gray-400 transition-all" 
                  style={{ width: `${(data.pendingPhones / data.totalPhones) * 100}%` }} 
                />
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
      </div>
    </div>
  );
};

export default Reports;
