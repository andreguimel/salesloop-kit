import { useState } from 'react';
import { Plus, Check, Phone, Mail, Calendar, MessageSquare, ClipboardList, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CrmActivity, Company } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ActivityListProps {
  activities: CrmActivity[];
  companies: Company[];
  onCreateActivity: (activity: Omit<CrmActivity, 'id' | 'createdAt' | 'company'>) => void;
  onUpdateActivity: (id: string, updates: Partial<CrmActivity>) => void;
  onDeleteActivity: (id: string) => void;
  showCompanyName?: boolean;
  companyId?: string;
}

const ACTIVITY_TYPES = [
  { value: 'note', label: 'Nota', icon: MessageSquare, color: 'text-blue-500' },
  { value: 'call', label: 'Ligação', icon: Phone, color: 'text-green-500' },
  { value: 'email', label: 'E-mail', icon: Mail, color: 'text-purple-500' },
  { value: 'meeting', label: 'Reunião', icon: Calendar, color: 'text-orange-500' },
  { value: 'task', label: 'Tarefa', icon: ClipboardList, color: 'text-red-500' },
];

export function ActivityList({
  activities,
  companies,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
  showCompanyName = true,
  companyId,
}: ActivityListProps) {
  const navigate = useNavigate();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newActivity, setNewActivity] = useState({
    companyId: companyId || '',
    activityType: 'note' as CrmActivity['activityType'],
    title: '',
    description: '',
    dueDate: '',
  });

  const handleCreate = () => {
    if (!newActivity.title.trim()) {
      toast.error('Digite um título para a atividade');
      return;
    }
    if (!newActivity.companyId) {
      toast.error('Selecione uma empresa');
      return;
    }

    onCreateActivity({
      companyId: newActivity.companyId,
      activityType: newActivity.activityType,
      title: newActivity.title.trim(),
      description: newActivity.description.trim() || undefined,
      isCompleted: false,
      dueDate: newActivity.dueDate || undefined,
    });

    setNewActivity({
      companyId: companyId || '',
      activityType: 'note',
      title: '',
      description: '',
      dueDate: '',
    });
    setShowNewDialog(false);
    toast.success('Atividade criada!');
  };

  const toggleComplete = (activity: CrmActivity) => {
    onUpdateActivity(activity.id, { isCompleted: !activity.isCompleted });
    toast.success(activity.isCompleted ? 'Atividade reaberta' : 'Atividade concluída!');
  };

  const getActivityIcon = (type: CrmActivity['activityType']) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType || ACTIVITY_TYPES[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} dia(s) atrás`, variant: 'destructive' as const };
    } else if (diffDays === 0) {
      return { text: 'Hoje', variant: 'default' as const };
    } else if (diffDays === 1) {
      return { text: 'Amanhã', variant: 'secondary' as const };
    } else {
      return { text: date.toLocaleDateString('pt-BR'), variant: 'outline' as const };
    }
  };

  const pendingActivities = activities.filter(a => !a.isCompleted);
  const completedActivities = activities.filter(a => a.isCompleted);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Atividades
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowNewDialog(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma atividade registrada
          </p>
        ) : (
          <div className="space-y-4">
            {/* Pending Activities */}
            {pendingActivities.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Pendentes ({pendingActivities.length})
                </p>
                {pendingActivities.map(activity => {
                  const activityType = getActivityIcon(activity.activityType);
                  const Icon = activityType.icon;
                  const dueDateInfo = activity.dueDate ? formatDate(activity.dueDate) : null;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                      <Checkbox
                        checked={activity.isCompleted}
                        onCheckedChange={() => toggleComplete(activity)}
                        className="mt-0.5"
                      />
                      <Icon className={`h-4 w-4 mt-0.5 ${activityType.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {showCompanyName && activity.company && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs gap-1 cursor-pointer"
                              onClick={() => navigate(`/empresa/${activity.companyId}`)}
                            >
                              <Building2 className="h-3 w-3" />
                              {activity.company.name}
                            </Badge>
                          )}
                          {dueDateInfo && (
                            <Badge variant={dueDateInfo.variant} className="text-xs">
                              {dueDateInfo.text}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDeleteActivity(activity.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completed Activities */}
            {completedActivities.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Concluídas ({completedActivities.length})
                </p>
                {completedActivities.slice(0, 5).map(activity => {
                  const activityType = getActivityIcon(activity.activityType);
                  const Icon = activityType.icon;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors group opacity-60"
                    >
                      <Checkbox
                        checked={activity.isCompleted}
                        onCheckedChange={() => toggleComplete(activity)}
                        className="mt-0.5"
                      />
                      <Icon className={`h-4 w-4 mt-0.5 ${activityType.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-through">{activity.title}</p>
                        {showCompanyName && activity.company && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs gap-1 mt-1 cursor-pointer"
                            onClick={() => navigate(`/empresa/${activity.companyId}`)}
                          >
                            <Building2 className="h-3 w-3" />
                            {activity.company.name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDeleteActivity(activity.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* New Activity Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!companyId && (
              <div>
                <label className="text-sm font-medium">Empresa</label>
                <Select
                  value={newActivity.companyId}
                  onValueChange={(value) => setNewActivity(prev => ({ ...prev, companyId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={newActivity.activityType}
                onValueChange={(value) => setNewActivity(prev => ({ 
                  ...prev, 
                  activityType: value as CrmActivity['activityType'] 
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newActivity.title}
                onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Ligar para agendar reunião"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes adicionais..."
                className="mt-1"
                rows={3}
              />
            </div>

            {(newActivity.activityType === 'task' || newActivity.activityType === 'meeting') && (
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={newActivity.dueDate}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} className="gradient-primary">
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
