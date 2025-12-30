import { useState } from 'react';
import { Plus, GripVertical, MoreHorizontal, Pencil, Trash2, DollarSign, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Company, PipelineStage } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface KanbanBoardProps {
  stages: PipelineStage[];
  companies: Company[];
  onMoveCompany: (companyId: string, newStageId: string) => void;
  onCreateStage: (name: string, color: string) => void;
  onUpdateStage: (id: string, name: string, color: string) => void;
  onDeleteStage: (id: string) => void;
  onUpdateDealValue: (companyId: string, value: number) => void;
}

const STAGE_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#14b8a6', // Teal
];

export function KanbanBoard({
  stages,
  companies,
  onMoveCompany,
  onCreateStage,
  onUpdateStage,
  onDeleteStage,
  onUpdateDealValue,
}: KanbanBoardProps) {
  const navigate = useNavigate();
  const [draggedCompanyId, setDraggedCompanyId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [showNewStageDialog, setShowNewStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(STAGE_COLORS[0]);
  const [editingDealValue, setEditingDealValue] = useState<{ companyId: string; value: string } | null>(null);

  const unassignedCompanies = companies.filter(c => !c.crmStageId);

  const handleDragStart = (e: React.DragEvent, companyId: string) => {
    setDraggedCompanyId(companyId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStageId(null);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedCompanyId) {
      onMoveCompany(draggedCompanyId, stageId);
    }
    setDraggedCompanyId(null);
    setDragOverStageId(null);
  };

  const handleCreateStage = () => {
    if (!newStageName.trim()) {
      toast.error('Digite um nome para o estágio');
      return;
    }
    onCreateStage(newStageName.trim(), newStageColor);
    setNewStageName('');
    setNewStageColor(STAGE_COLORS[0]);
    setShowNewStageDialog(false);
  };

  const handleUpdateStage = () => {
    if (!editingStage || !newStageName.trim()) return;
    onUpdateStage(editingStage.id, newStageName.trim(), newStageColor);
    setEditingStage(null);
    setNewStageName('');
    setNewStageColor(STAGE_COLORS[0]);
  };

  const handleSaveDealValue = () => {
    if (!editingDealValue) return;
    const value = parseFloat(editingDealValue.value.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (!isNaN(value)) {
      onUpdateDealValue(editingDealValue.companyId, value);
    }
    setEditingDealValue(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStageTotal = (stageId: string) => {
    return companies
      .filter(c => c.crmStageId === stageId)
      .reduce((sum, c) => sum + (c.dealValue || 0), 0);
  };

  const openEditStageDialog = (stage: PipelineStage) => {
    setEditingStage(stage);
    setNewStageName(stage.name);
    setNewStageColor(stage.color);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {/* Unassigned Column */}
      <div className="flex-shrink-0 w-72">
        <Card className="h-full glass border-border/50">
          <CardHeader className="p-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
                <CardTitle className="text-sm font-medium">Sem estágio</CardTitle>
              </div>
              <Badge variant="secondary" className="text-xs">
                {unassignedCompanies.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
            {unassignedCompanies.map(company => (
              <div
                key={company.id}
                draggable
                onDragStart={(e) => handleDragStart(e, company.id)}
                className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors border border-border/30"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium text-sm truncate hover:text-primary cursor-pointer"
                      onClick={() => navigate(`/empresa/${company.id}`)}
                    >
                      {company.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {company.city}, {company.state}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {unassignedCompanies.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Arraste empresas aqui
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      {stages.map(stage => {
        const stageCompanies = companies.filter(c => c.crmStageId === stage.id);
        const isOver = dragOverStageId === stage.id;

        return (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <Card 
              className={`h-full glass border-border/50 transition-all ${isOver ? 'ring-2 ring-primary' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <CardHeader className="p-3 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {stageCompanies.length}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditStageDialog(stage)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteStage(stage.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {getStageTotal(stage.id) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {formatCurrency(getStageTotal(stage.id))}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                {stageCompanies.map(company => (
                  <div
                    key={company.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, company.id)}
                    className={`p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors border border-border/30 ${
                      draggedCompanyId === company.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium text-sm truncate hover:text-primary cursor-pointer"
                          onClick={() => navigate(`/empresa/${company.id}`)}
                        >
                          {company.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company.city}, {company.state}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {company.dealValue ? (
                            <Badge 
                              variant="outline" 
                              className="text-xs gap-1 cursor-pointer hover:bg-secondary"
                              onClick={() => setEditingDealValue({ 
                                companyId: company.id, 
                                value: company.dealValue?.toString() || '' 
                              })}
                            >
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(company.dealValue)}
                            </Badge>
                          ) : (
                            <Badge 
                              variant="outline" 
                              className="text-xs gap-1 cursor-pointer hover:bg-secondary text-muted-foreground"
                              onClick={() => setEditingDealValue({ 
                                companyId: company.id, 
                                value: '' 
                              })}
                            >
                              <DollarSign className="h-3 w-3" />
                              Adicionar valor
                            </Badge>
                          )}
                          {company.expectedCloseDate && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(company.expectedCloseDate).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {stageCompanies.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Arraste empresas aqui
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}

      {/* Add Stage Button */}
      <div className="flex-shrink-0 w-72">
        <Button
          variant="outline"
          className="w-full h-12 border-dashed gap-2"
          onClick={() => setShowNewStageDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Novo Estágio
        </Button>
      </div>

      {/* New Stage Dialog */}
      <Dialog open={showNewStageDialog} onOpenChange={setShowNewStageDialog}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Novo Estágio do Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome do Estágio</label>
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Ex: Proposta Enviada"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 mt-2">
                {STAGE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStageColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newStageColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateStage} className="gradient-primary">
              Criar Estágio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editingStage} onOpenChange={() => setEditingStage(null)}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Editar Estágio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome do Estágio</label>
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Ex: Proposta Enviada"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 mt-2">
                {STAGE_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewStageColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newStageColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStage(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStage} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deal Value Dialog */}
      <Dialog open={!!editingDealValue} onOpenChange={() => setEditingDealValue(null)}>
        <DialogContent className="glass-strong border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor do Negócio
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              value={editingDealValue?.value || ''}
              onChange={(e) => setEditingDealValue(prev => prev ? { ...prev, value: e.target.value } : null)}
              placeholder="0,00"
              className="text-lg"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDealValue(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDealValue} className="gradient-primary">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
