import { useState, useMemo } from 'react';
import { MapPin, Building2, RefreshCw, CheckCircle, Phone, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneStatusBadge } from './PhoneStatusBadge';
import { Company } from '@/types';
import { validatePhones, deleteCompany } from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompanyTableProps {
  companies: Company[];
  onPhonesValidated?: () => void;
  onCompanyDeleted?: () => void;
}

export function CompanyTable({ companies, onPhonesValidated, onCompanyDeleted }: CompanyTableProps) {
  const [validatingCompanyId, setValidatingCompanyId] = useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isValidatingAll, setIsValidatingAll] = useState(false);

  const allPendingPhoneIds = useMemo(() => {
    return companies.flatMap(c => 
      c.phones.filter(p => p.status === 'pending' && p.id).map(p => p.id!)
    );
  }, [companies]);

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

  const handleValidateAllPhones = async () => {
    if (allPendingPhoneIds.length === 0) {
      toast.info('Não há telefones pendentes para validar');
      return;
    }

    setIsValidatingAll(true);
    
    try {
      const result = await validatePhones(allPendingPhoneIds);
      
      toast.success(
        `Validação em lote concluída!`,
        { 
          description: `${result.summary.valid} válidos, ${result.summary.invalid} inválidos, ${result.summary.uncertain} incertos` 
        }
      );
      
      onPhonesValidated?.();
    } catch (error) {
      console.error('Error validating all phones:', error);
      toast.error('Erro ao validar telefones', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setIsValidatingAll(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    setDeletingCompanyId(companyToDelete.id);
    
    try {
      await deleteCompany(companyToDelete.id);
      toast.success('Empresa excluída com sucesso');
      onCompanyDeleted?.();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Erro ao excluir empresa', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setDeletingCompanyId(null);
      setCompanyToDelete(null);
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatCnpj = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return cnpj;
  };

  if (companies.length === 0) {
    return (
      <div className="p-8 md:p-16 rounded-2xl glass text-center animate-fade-up" style={{ animationDelay: '300ms' }}>
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
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-accent">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Empresas</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allPendingPhoneIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidateAllPhones}
              disabled={isValidatingAll}
              className="gap-2 text-xs font-medium border-primary/30 hover:bg-primary/10"
            >
              {isValidatingAll ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">Validando {allPendingPhoneIds.length}...</span>
                  <span className="sm:hidden">Validando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Validar todos ({allPendingPhoneIds.length})</span>
                  <span className="sm:hidden">Validar ({allPendingPhoneIds.length})</span>
                </>
              )}
            </Button>
          )}
          <span className="text-sm text-muted-foreground px-3 py-1 rounded-full bg-secondary">
            {companies.length} resultado{companies.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-border/30">
        {companies.map((company, index) => (
          <div 
            key={company.id}
            className="p-4 space-y-3 animate-fade-up"
            style={{ animationDelay: `${400 + index * 30}ms` }}
          >
            {/* Company Name & CNPJ */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{company.name}</h4>
                {company.cnpj && (
                  <code className="text-xs font-mono text-muted-foreground">
                    {formatCnpj(company.cnpj)}
                  </code>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCompanyToDelete(company)}
                disabled={deletingCompanyId === company.id}
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                {deletingCompanyId === company.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* CNAE */}
            {company.cnae && (
              <code className="text-xs font-mono px-2 py-1 rounded bg-secondary text-muted-foreground inline-block">
                CNAE: {company.cnae}
              </code>
            )}

            {/* Location */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {company.city}, {company.state}
              </div>
              {company.address && (
                <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
                  {company.address}
                  {company.cep && ` - CEP: ${company.cep}`}
                </p>
              )}
            </div>

            {/* Phones */}
            <div className="space-y-1.5">
              {company.phones.length > 0 ? (
                company.phones.map((phone) => (
                  <div key={phone.number} className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-mono">{formatPhone(phone.number)}</span>
                    <PhoneStatusBadge phone={phone} />
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Sem telefone</span>
              )}
            </div>

            {/* Actions */}
            {company.phones.some(p => p.status === 'pending') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleValidatePhones(company)}
                disabled={validatingCompanyId === company.id}
                className="w-full text-xs font-medium gap-1.5"
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
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Empresa
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                CNPJ
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Local / Endereço
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4">
                Telefones
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
                  {company.cnae && (
                    <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground mt-1 inline-block">
                      CNAE: {company.cnae}
                    </code>
                  )}
                </td>
                <td className="px-5 py-4">
                  {company.cnpj ? (
                    <code className="text-sm font-mono text-foreground">
                      {formatCnpj(company.cnpj)}
                    </code>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {company.city}, {company.state}
                    </div>
                    {company.address && (
                      <div className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                        {company.address}
                        {company.cep && ` - CEP: ${company.cep}`}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-2">
                    {company.phones.length > 0 ? (
                      company.phones.map((phone) => (
                        <div key={phone.number} className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{formatPhone(phone.number)}</span>
                            <PhoneStatusBadge phone={phone} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem telefone</span>
                    )}
                  </div>
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
                      onClick={() => setCompanyToDelete(company)}
                      disabled={deletingCompanyId === company.id}
                      className="text-xs font-medium gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {deletingCompanyId === company.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>{companyToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e todos os telefones associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
