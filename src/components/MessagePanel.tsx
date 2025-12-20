import { useState } from 'react';
import { MessageSquare, Send, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border-border/50 shadow-sm animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Enviar Mensagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Template de Mensagem</Label>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={openNewDialog}>
                  <Plus className="h-3.5 w-3.5" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Editar Template' : 'Novo Template'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Nome do Template</Label>
                    <Input
                      id="template-name"
                      placeholder="Ex: Apresentação Comercial"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-content">Conteúdo</Label>
                    <Textarea
                      id="template-content"
                      placeholder="Digite sua mensagem..."
                      rows={5}
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveTemplate}>
                    {editingTemplate ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{template.name}</span>
                  </div>
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
                  className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md"
                >
                  <span className="font-medium">{template.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive"
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
            <Label className="text-sm font-medium">Preview</Label>
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              {templates.find((t) => t.id === selectedTemplate)?.content}
            </div>
          </div>
        )}

        {/* Channel Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Canais de Envio</Label>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="whatsapp"
                checked={channels.whatsapp}
                onCheckedChange={(checked) => setChannels({ ...channels, whatsapp: !!checked })}
              />
              <Label htmlFor="whatsapp" className="text-sm font-normal cursor-pointer">
                WhatsApp
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sms"
                checked={channels.sms}
                onCheckedChange={(checked) => setChannels({ ...channels, sms: !!checked })}
              />
              <Label htmlFor="sms" className="text-sm font-normal cursor-pointer">
                SMS
              </Label>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={selectedPhonesCount === 0}
          className="w-full gap-2"
          size="lg"
        >
          <Send className="h-4 w-4" />
          Enviar para {selectedPhonesCount} telefone{selectedPhonesCount !== 1 ? 's' : ''}
        </Button>

        {selectedPhonesCount === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Selecione telefones válidos na tabela para enviar mensagens
          </p>
        )}
      </CardContent>
    </Card>
  );
}
