import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateCompany, UpdateCompanyData } from '@/lib/api';
import { Company } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200, 'Nome muito longo'),
  cnpj: z.string().max(18, 'CNPJ inválido').optional().or(z.literal('')),
  cnae: z.string().max(20, 'CNAE inválido'),
  cnaeDescription: z.string().max(500, 'Descrição muito longa').optional().or(z.literal('')),
  city: z.string().trim().min(1, 'Cidade é obrigatória').max(100, 'Cidade muito longa'),
  state: z.string().trim().min(2, 'Estado é obrigatório').max(2, 'Use sigla do estado'),
  address: z.string().max(300, 'Endereço muito longo').optional().or(z.literal('')),
  cep: z.string().max(10, 'CEP inválido').optional().or(z.literal('')),
  segment: z.string().max(100, 'Segmento muito longo').optional().or(z.literal('')),
  website: z.string().max(200, 'URL muito longa').optional().or(z.literal('')),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional().or(z.literal('')),
  instagram: z.string().max(100, 'Instagram muito longo').optional().or(z.literal('')),
  facebook: z.string().max(200, 'Facebook muito longo').optional().or(z.literal('')),
  linkedin: z.string().max(200, 'LinkedIn muito longo').optional().or(z.literal('')),
});

interface EditCompanyFormProps {
  company: Company;
  onSave: () => void;
  onCancel: () => void;
}

export function EditCompanyForm({ company, onSave, onCancel }: EditCompanyFormProps) {
  const [formData, setFormData] = useState<UpdateCompanyData>({
    name: company.name,
    cnpj: company.cnpj || '',
    cnae: company.cnae,
    cnaeDescription: company.cnaeDescription || '',
    city: company.city,
    state: company.state,
    address: company.address || '',
    cep: company.cep || '',
    segment: company.segment || '',
    website: company.website || '',
    email: company.email || '',
    instagram: company.instagram || '',
    facebook: company.facebook || '',
    linkedin: company.linkedin || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof UpdateCompanyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = companySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Corrija os erros antes de salvar');
      return;
    }

    setIsSaving(true);
    try {
      await updateCompany(company.id, formData);
      toast.success('Empresa atualizada com sucesso!');
      onSave();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Erro ao atualizar empresa');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome da empresa"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                className={errors.cnpj ? 'border-destructive' : ''}
              />
              {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE *</Label>
              <Input
                id="cnae"
                value={formData.cnae}
                onChange={(e) => handleChange('cnae', e.target.value)}
                placeholder="0000-0/00"
                className={errors.cnae ? 'border-destructive' : ''}
              />
              {errors.cnae && <p className="text-xs text-destructive">{errors.cnae}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="segment">Segmento</Label>
              <Input
                id="segment"
                value={formData.segment}
                onChange={(e) => handleChange('segment', e.target.value)}
                placeholder="Segmento de atuação"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnaeDescription">Descrição CNAE</Label>
            <Input
              id="cnaeDescription"
              value={formData.cnaeDescription}
              onChange={(e) => handleChange('cnaeDescription', e.target.value)}
              placeholder="Descrição da atividade"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Localização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade"
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                placeholder="UF"
                maxLength={2}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg">Contatos Digitais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contato@exemplo.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="@usuario ou URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.facebook}
                onChange={(e) => handleChange('facebook', e.target.value)}
                placeholder="URL do perfil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="URL do perfil"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="gap-2 gradient-primary hover:opacity-90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
