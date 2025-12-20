import { useState } from 'react';
import { MapPin, Building2, Smartphone, RefreshCw, CheckCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PhoneStatusBadge } from './PhoneStatusBadge';
import { MessageStatusBadge } from './MessageStatusBadge';
import { Company } from '@/types';
import { cn } from '@/lib/utils';
import { validatePhones } from '@/lib/api';
import { toast } from 'sonner';

interface CompanyTableProps {
  companies: Company[];
  onSelectPhones: (companyId: string, phones: string[]) => void;
  selectedPhones: Record<string, string[]>;
  onPhonesValidated?: () => void;
}

export function CompanyTable({ companies, onSelectPhones, selectedPhones, onPhonesValidated }: CompanyTableProps) {
  const [validatingCompanyId, setValidatingCompanyId] = useState<string | null>(null);

  const handlePhoneToggle = (companyId: string, phoneNumber: string, isValid: boolean) => {
    if (!isValid) return;
    
    const currentSelection = selectedPhones[companyId] || [];
    const newSelection = currentSelection.includes(phoneNumber)
      ? currentSelection.filter((p) => p !== phoneNumber)
      : [...currentSelection, phoneNumber];
    
    onSelectPhones(companyId, newSelection);
  };

  const handleSelectAllValid = (company: Company) => {
    const validPhones = company.phones
      .filter((p) => p.status === 'valid')
      .map((p) => p.number);
    onSelectPhones(company.id, validPhones);
  };

  const handleValidatePhones = async (company: Company) => {
    const pendingPhones = company.phones.filter(p => p.status === 'pending' && p.id);
    
    if (pendingPhones.length === 0) {
      toast.info('Não há telefones pendentes para validar');
      return;
    }

    setValidatingCompanyId(company.id);
    
    try {
      const phoneIds = pendingPhones.map(p => p.id!);
      const result = await validatePhones(phoneIds);
      
      toast.success(
        `Validação concluída: ${result.summary.valid} válidos, ${result.summary.invalid} inválidos`,
        { description: `${result.summary.uncertain} incertos` }
      );
      
      onPhonesValidated?.();
    } catch (error) {
      console.error('Error validating phones:', error);
      toast.error('Erro ao validar telefones', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setValidatingCompanyId(null);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="p-16 rounded-2xl glass text-center animate-fade-up" style={{ animationDelay: '300ms' }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-semibold mb-1">Nenhuma empresa encontrada</p>
        <p className="text-sm text-muted-foreground">Use os filtros acima para buscar empresas</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
      <div className="p-5 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-accent">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Empresas</h3>
        </div>
        <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-secondary">
          {companies.length} resultado{companies.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Empresa
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                CNAE
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Local
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Telefones
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Status
              </th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {companies.map((company, index) => (
              <tr 
                key={company.id}
                className="hover:bg-secondary/20 transition-colors animate-fade-up"
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <td className="px-5 py-4">
                  <div className="font-semibold text-foreground">{company.name}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{company.segment}</div>
                </td>
                <td className="px-5 py-4">
                  <code className="text-xs font-mono px-2 py-1 rounded bg-secondary text-muted-foreground">
                    {company.cnae}
                  </code>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.city}, {company.state}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    {company.phones.map((phone) => (
                      <div key={phone.number} className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedPhones[company.id]?.includes(phone.number) || false}
                          onCheckedChange={() => handlePhoneToggle(company.id, phone.number, phone.status === 'valid')}
                          disabled={phone.status !== 'valid'}
                          className={cn(
                            'border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary',
                            phone.status !== 'valid' && 'opacity-40 cursor-not-allowed'
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                          <PhoneStatusBadge phone={phone} />
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <MessageStatusBadge status={company.messageStatus} />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex flex-col gap-1.5 items-end">
                    {company.phones.some(p => p.status === 'pending') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidatePhones(company)}
                        disabled={validatingCompanyId === company.id}
                        className="text-xs font-medium gap-1.5"
                      >
                        {validatingCompanyId === company.id ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Validar WhatsApp
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllValid(company)}
                      className="text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Selecionar válidos
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
