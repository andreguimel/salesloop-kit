import { useState } from 'react';
import { MessageSquare, Send, Plus, Edit2, Trash2, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageTemplate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MessagePanelProps {
  templates: MessageTemplate[];
  onAddTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => void;
  onEditTemplate: (id: string, template: Omit<MessageTemplate, 'id' | 'createdAt'>) => void;
  onDeleteTemplate: (id: string) => void;
  selectedPhonesCount: number;
  onSendMessages: (channel: 'whatsapp' | 'sms' | 'both', templateId: string) => void;
}

export function MessagePanel({
  templates,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  selectedPhonesCount,
  onSendMessages,
}: MessagePanelProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [channels, setChannels] = useState({ whatsapp: true, sms: false });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

  const handleSend = () => {
    if (!selectedTemplate) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha um template de mensagem antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    if (!channels.whatsapp && !channels.sms) {
      toast({
        title: 'Selecione um canal',
        description: 'Escolha pelo menos um canal de envio.',
        variant: 'destructive',
      });
      return;
    }

    const channel = channels.whatsapp && channels.sms ? 'both' : channels.whatsapp ? 'whatsapp' : 'sms';
    onSendMessages(channel, selectedTemplate);
    
    toast({
      title: 'Mensagens enviadas!',
      description: `${selectedPhonesCount} mensagem(ns) foram enviadas com sucesso.`,
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Nome e conteúdo são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (editingTemplate) {
      onEditTemplate(editingTemplate.id, newTemplate);
      toast({ title: 'Template atualizado!' });
    } else {
      onAddTemplate(newTemplate);
      toast({ title: 'Template criado!' });
    }

    setNewTemplate({ name: '', content: '' });
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({ name: template.name, content: template.content });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setNewTemplate({ name: '', content: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="rounded-2xl glass animate-fade-up h-fit sticky top-24" style={{ animationDelay: '400ms' }}>
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-primary">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Enviar Mensagens</h3>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Template Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Template
            </Label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10 h-7 text-xs" onClick={openNewDialog}>
                  <Plus className="h-3.5 w-3.5" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-border/50">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Editar Template' : 'Novo Template'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nome
                    </Label>
                    <Input
                      id="template-name"
                      placeholder="Ex: Apresentação Comercial"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-content" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Mensagem
                    </Label>
                    <Textarea
                      id="template-content"
                      placeholder="Digite sua mensagem..."
                      rows={5}
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      className="bg-secondary/50 border-border/50 resize-none"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-border/50">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTemplate} className="gradient-primary">
                    {editingTemplate ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Template Actions */}
          {templates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-1 text-xs bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border/30"
                >
                  <span className="font-medium text-muted-foreground">{template.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-secondary"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        {selectedTemplate && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Preview
            </Label>
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm text-muted-foreground leading-relaxed">
              {templates.find((t) => t.id === selectedTemplate)?.content}
            </div>
          </div>
        )}

        {/* Channel Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Canais
          </Label>
          <div className="flex gap-3">
            <label
              className={cn(
                'flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                channels.whatsapp 
                  ? 'border-success bg-success/10' 
                  : 'border-border/50 bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <Checkbox
                checked={channels.whatsapp}
                onCheckedChange={(checked) => setChannels({ ...channels, whatsapp: !!checked })}
                className="border-border data-[state=checked]:bg-success data-[state=checked]:border-success"
              />
              <MessageCircle className={cn('h-4 w-4', channels.whatsapp ? 'text-success' : 'text-muted-foreground')} />
              <span className={cn('text-sm font-medium', channels.whatsapp ? 'text-success' : 'text-muted-foreground')}>
                WhatsApp
              </span>
            </label>
            <label
              className={cn(
                'flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                channels.sms 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border/50 bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <Checkbox
                checked={channels.sms}
                onCheckedChange={(checked) => setChannels({ ...channels, sms: !!checked })}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Mail className={cn('h-4 w-4', channels.sms ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-sm font-medium', channels.sms ? 'text-primary' : 'text-muted-foreground')}>
                SMS
              </span>
            </label>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={selectedPhonesCount === 0}
          className="w-full gap-2 h-12 font-semibold text-base gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          size="lg"
        >
          <Send className="h-5 w-5" />
          Enviar para {selectedPhonesCount} telefone{selectedPhonesCount !== 1 ? 's' : ''}
        </Button>

        {selectedPhonesCount === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Selecione telefones válidos na tabela
          </p>
        )}
      </div>
    </div>
  );
}
