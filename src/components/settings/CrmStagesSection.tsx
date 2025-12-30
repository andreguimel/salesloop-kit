import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, GripVertical, Loader2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  fetchPipelineStages, 
  createPipelineStage, 
  updatePipelineStage, 
  deletePipelineStage,
  reorderPipelineStages
} from '@/lib/crm-api';
import { PipelineStage } from '@/types';
import { useToast } from '@/hooks/use-toast';

const defaultColors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6',
];

export function CrmStagesSection() {
  const { toast } = useToast();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const data = await fetchPipelineStages();
      setStages(data);
    } catch (error) {
      console.error('Error loading stages:', error);
      toast({
        title: 'Erro ao carregar estágios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newStageName.trim()) return;
    
    setIsCreating(true);
    try {
      await createPipelineStage({
        name: newStageName,
        color: newStageColor,
        position: stages.length,
      });
      setNewStageName('');
      await loadStages();
      toast({ title: 'Estágio criado com sucesso' });
    } catch (error) {
      console.error('Error creating stage:', error);
      toast({
        title: 'Erro ao criar estágio',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updatePipelineStage(id, { name: editName, color: editColor });
      setEditingId(null);
      await loadStages();
      toast({ title: 'Estágio atualizado' });
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Erro ao atualizar estágio',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePipelineStage(id);
      await loadStages();
      toast({ title: 'Estágio excluído' });
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({
        title: 'Erro ao excluir estágio',
        description: 'Remova as empresas deste estágio primeiro.',
        variant: 'destructive',
      });
    }
  };

  const moveStage = async (index: number, direction: 'up' | 'down') => {
    const newStages = [...stages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= stages.length) return;
    
    [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
    
    const updates = newStages.map((stage, i) => ({ id: stage.id, position: i }));
    
    try {
      await reorderPipelineStages(updates);
      setStages(newStages);
    } catch (error) {
      console.error('Error reordering stages:', error);
    }
  };

  const startEditing = (stage: PipelineStage) => {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditColor(stage.color);
  };

  return (
    <Card className="glass border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Estágios do CRM
        </CardTitle>
        <CardDescription>
          Gerencie os estágios do seu pipeline de vendas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new stage */}
        <div className="flex gap-2">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Nome do novo estágio"
            className="flex-1"
          />
          <input
            type="color"
            value={newStageColor}
            onChange={(e) => setNewStageColor(e.target.value)}
            className="w-10 h-10 rounded-md border border-border cursor-pointer"
          />
          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !newStageName.trim()}
            className="gap-2"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </div>

        {/* Stages list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum estágio criado. Adicione seu primeiro estágio acima.
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30"
              >
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveStage(index, 'up')}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveStage(index, 'down')}
                    disabled={index === stages.length - 1}
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </Button>
                </div>
                
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: editingId === stage.id ? editColor : stage.color }}
                />
                
                {editingId === stage.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-8 h-8 rounded border border-border cursor-pointer"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-500"
                      onClick={() => handleUpdate(stage.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{stage.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEditing(stage)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(stage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
