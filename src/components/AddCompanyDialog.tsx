import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useToast } from '@/hooks/use-toast';
import { createCompany, addPhoneToCompany } from '@/lib/api';
import { segments, cities } from '@/data/mockData';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded: () => void;
}

interface PhoneInput {
  number: string;
  type: 'mobile' | 'landline';
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function AddCompanyDialog({ open, onOpenChange, onCompanyAdded }: AddCompanyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnae: '',
    cnaeDescription: '',
    city: '',
    state: '',
    segment: '',
  });
  const [phones, setPhones] = useState<PhoneInput[]>([{ number: '', type: 'mobile' }]);
  
  const { toast } = useToast();

  const handleAddPhone = () => {
    setPhones([...phones, { number: '', type: 'mobile' }]);
  };

  const handleRemovePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index));
  };

  const handlePhoneChange = (index: number, field: keyof PhoneInput, value: string) => {
    const newPhones = [...phones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setPhones(newPhones);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnae: '',
      cnaeDescription: '',
      city: '',
      state: '',
      segment: '',
    });
    setPhones([{ number: '', type: 'mobile' }]);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.cnae || !formData.city || !formData.state) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Nome, CNAE, cidade e estado são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const company = await createCompany(formData);

      // Add phones
      for (const phone of phones) {
        if (phone.number) {
          await addPhoneToCompany(company.id, phone.number, phone.type, 'pending');
        }
      }

      toast({
        title: 'Empresa adicionada!',
        description: `${formData.name} foi adicionada com sucesso.`,
      });

      resetForm();
      onCompanyAdded();
    } catch (error) {
      console.error('Error adding company:', error);
      toast({
        title: 'Erro ao adicionar empresa',
        description: 'Não foi possível adicionar a empresa. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Empresa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Nome da Empresa *
            </Label>
            <Input
              placeholder="Nome da empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CNAE *
              </Label>
              <Input
                placeholder="Ex: 6201-5/01"
                value={formData.cnae}
                onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Segmento
              </Label>
              <Select
                value={formData.segment}
                onValueChange={(value) => setFormData({ ...formData, segment: value })}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {segments.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Descrição do CNAE
            </Label>
            <Input
              placeholder="Descrição da atividade"
              value={formData.cnaeDescription}
              onChange={(e) => setFormData({ ...formData, cnaeDescription: e.target.value })}
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cidade *
              </Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Estado *
              </Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phones Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Telefones
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddPhone}
                className="gap-1 text-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {phones.map((phone, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="(00) 00000-0000"
                  value={phone.number}
                  onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                  className="flex-1 bg-secondary/50 border-border/50"
                />
                <Select
                  value={phone.type}
                  onValueChange={(value) => handlePhoneChange(index, 'type', value as 'mobile' | 'landline')}
                >
                  <SelectTrigger className="w-32 bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="mobile">Celular</SelectItem>
                    <SelectItem value="landline">Fixo</SelectItem>
                  </SelectContent>
                </Select>
                {phones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePhone(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gradient-primary">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Adicionar Empresa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
