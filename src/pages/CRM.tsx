import { useState, useEffect } from 'react';
import { Loader2, Target, DollarSign, ClipboardList, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { ActivityList } from '@/components/crm/ActivityList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Company, PipelineStage, CrmActivity } from '@/types';
import {
  fetchPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  fetchCompaniesWithCrmData,
  updateCompanyCrmStage,
  updateCompanyDealValue,
  fetchActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  fetchCrmMetrics,
  CrmMetrics,
} from '@/lib/crm-api';
import { toast } from 'sonner';

const CRM = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showActivities, setShowActivities] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [stagesData, companiesData, activitiesData, metricsData] = await Promise.all([
        fetchPipelineStages(),
        fetchCompaniesWithCrmData(),
        fetchActivities(),
        fetchCrmMetrics(),
      ]);
      setStages(stagesData);
      setCompanies(companiesData);
      setActivities(activitiesData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading CRM data:', error);
      toast.error('Erro ao carregar dados do CRM');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveCompany = async (companyId: string, newStageId: string) => {
    try {
      // Optimistic update
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, crmStageId: newStageId } : c
      ));
      
      await updateCompanyCrmStage(companyId, newStageId);
      
      // Reload metrics
      const metricsData = await fetchCrmMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error moving company:', error);
      toast.error('Erro ao mover empresa');
      loadData(); // Revert on error
    }
  };

  const handleCreateStage = async (name: string, color: string) => {
    try {
      const newPosition = stages.length;
      const newStage = await createPipelineStage({ name, color, position: newPosition });
      setStages(prev => [...prev, newStage]);
      toast.success('Estágio criado!');
    } catch (error) {
      console.error('Error creating stage:', error);
      toast.error('Erro ao criar estágio');
    }
  };

  const handleUpdateStage = async (id: string, name: string, color: string) => {
    try {
      await updatePipelineStage(id, { name, color });
      setStages(prev => prev.map(s => 
        s.id === id ? { ...s, name, color } : s
      ));
      toast.success('Estágio atualizado!');
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Erro ao atualizar estágio');
    }
  };

  const handleDeleteStage = async (id: string) => {
    try {
      // Move companies from this stage to unassigned
      const companiesInStage = companies.filter(c => c.crmStageId === id);
      for (const company of companiesInStage) {
        await updateCompanyCrmStage(company.id, null as unknown as string);
      }
      
      await deletePipelineStage(id);
      setStages(prev => prev.filter(s => s.id !== id));
      setCompanies(prev => prev.map(c => 
        c.crmStageId === id ? { ...c, crmStageId: undefined } : c
      ));
      toast.success('Estágio excluído!');
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Erro ao excluir estágio');
    }
  };

  const handleUpdateDealValue = async (companyId: string, value: number) => {
    try {
      await updateCompanyDealValue(companyId, value);
      setCompanies(prev => prev.map(c => 
        c.id === companyId ? { ...c, dealValue: value } : c
      ));
      
      // Reload metrics
      const metricsData = await fetchCrmMetrics();
      setMetrics(metricsData);
      
      toast.success('Valor atualizado!');
    } catch (error) {
      console.error('Error updating deal value:', error);
      toast.error('Erro ao atualizar valor');
    }
  };

  const handleCreateActivity = async (activity: Omit<CrmActivity, 'id' | 'createdAt' | 'company'>) => {
    try {
      const newActivity = await createActivity(activity);
      setActivities(prev => [newActivity, ...prev]);
      
      // Reload metrics
      const metricsData = await fetchCrmMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Erro ao criar atividade');
    }
  };

  const handleUpdateActivity = async (id: string, updates: Partial<CrmActivity>) => {
    try {
      await updateActivity(id, updates);
      setActivities(prev => prev.map(a => 
        a.id === id ? { ...a, ...updates } : a
      ));
      
      // Reload metrics if completing a task
      if (updates.isCompleted !== undefined) {
        const metricsData = await fetchCrmMetrics();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Erro ao atualizar atividade');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      
      // Reload metrics
      const metricsData = await fetchCrmMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Erro ao excluir atividade');
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
          <p className="text-muted-foreground">Carregando CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="space-y-2 animate-fade-up">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
          CRM
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl">
          Organize seus leads e acompanhe o progresso das negociações.
        </p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up" style={{ animationDelay: '50ms' }}>
          <Card className="glass border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Leads no Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{metrics.totalLeads}</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{formatCurrency(metrics.totalDealValue)}</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Tarefas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{metrics.pendingTasks}</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Empresas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{companies.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activities Button - Fixed position */}
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={showActivities} onOpenChange={setShowActivities}>
          <SheetTrigger asChild>
            <Button size="lg" className="gap-2 shadow-lg">
              <ClipboardList className="h-5 w-5" />
              Atividades
              {activities.filter(a => !a.isCompleted).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activities.filter(a => !a.isCompleted).length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Atividades
              </SheetTitle>
            </SheetHeader>
            <ActivityList
              activities={activities}
              companies={companies}
              onCreateActivity={handleCreateActivity}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content - Kanban Board */}
      <div className="animate-fade-up overflow-x-auto" style={{ animationDelay: '100ms' }}>
        <KanbanBoard
          stages={stages}
          companies={companies}
          onMoveCompany={handleMoveCompany}
          onCreateStage={handleCreateStage}
          onUpdateStage={handleUpdateStage}
          onDeleteStage={handleDeleteStage}
          onUpdateDealValue={handleUpdateDealValue}
        />
      </div>
    </div>
  );
};

export default CRM;
