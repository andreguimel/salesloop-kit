import { useState, useMemo } from 'react';
import { MapPin, Building2, RefreshCw, CheckCircle, Phone, Trash2, Loader2, ChevronLeft, ChevronRight, Sparkles, Globe, Mail, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PhoneStatusBadge } from './PhoneStatusBadge';
import { Company } from '@/types';
import { validatePhones, deleteCompany, enrichCompany, enrichCompanies } from '@/lib/api';
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

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

interface CompanyTableProps {
  companies: Company[];
  onPhonesValidated?: () => void;
  onCompanyDeleted?: () => void;
  onCompanyEnriched?: () => void;
}

export function CompanyTable({ companies, onPhonesValidated, onCompanyDeleted, onCompanyEnriched }: CompanyTableProps) {
  const [validatingCompanyId, setValidatingCompanyId] = useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [enrichingCompanyId, setEnrichingCompanyId] = useState<string | null>(null);
  const [isEnrichingSelected, setIsEnrichingSelected] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isValidatingAll, setIsValidatingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const totalPages = Math.ceil(companies.length / itemsPerPage);
  
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return companies.slice(startIndex, startIndex + itemsPerPage);
  }, [companies, currentPage, itemsPerPage]);

  const allPendingPhoneIds = useMemo(() => {
    return companies.flatMap(c => 
      c.phones.filter(p => p.status === 'pending' && p.id).map(p => p.id!)
    );
  }, [companies]);

  const selectedCompanies = useMemo(() => {
    return companies.filter(c => selectedIds.has(c.id));
  }, [companies, selectedIds]);

  const notEnrichedSelectedCount = useMemo(() => {
    return selectedCompanies.filter(c => !c.enrichedAt).length;
  }, [selectedCompanies]);

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

  const handleEnrichCompany = async (company: Company) => {
    if (company.enrichedAt) {
      toast.info('Esta empresa já foi enriquecida');
      return;
    }

    setEnrichingCompanyId(company.id);
    
    try {
      await enrichCompany(company);
      toast.success('Empresa enriquecida com sucesso!', {
        description: 'Dados adicionais foram encontrados e salvos',
      });
      onCompanyEnriched?.();
    } catch (error) {
      console.error('Error enriching company:', error);
      toast.error('Erro ao enriquecer empresa', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setEnrichingCompanyId(null);
    }
  };

  const handleEnrichSelectedCompanies = async () => {
    const companiesToEnrich = selectedCompanies.filter(c => !c.enrichedAt);
    
    if (companiesToEnrich.length === 0) {
      toast.info('Todas as empresas selecionadas já foram enriquecidas');
      return;
    }

    setIsEnrichingSelected(true);
    
    try {
      const result = await enrichCompanies(companiesToEnrich);
      
      if (result.success > 0) {
        toast.success(`${result.success} empresa${result.success > 1 ? 's' : ''} enriquecida${result.success > 1 ? 's' : ''}!`);
      }
      if (result.failed > 0) {
        toast.error(`Falha ao enriquecer ${result.failed} empresa${result.failed > 1 ? 's' : ''}`);
      }
      
      onCompanyEnriched?.();
    } catch (error) {
      console.error('Error enriching companies:', error);
      toast.error('Erro ao enriquecer empresas', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setIsEnrichingSelected(false);
      setSelectedIds(new Set());
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    setDeletingCompanyId(companyToDelete.id);
    
    try {
      await deleteCompany(companyToDelete.id);
      toast.success('Empresa excluída com sucesso');
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(companyToDelete.id);
        return newSet;
      });
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of idsToDelete) {
      try {
        await deleteCompany(id);
        successCount++;
      } catch (error) {
        console.error(`Error deleting company ${id}:`, error);
        errorCount++;
      }
    }
    
    setIsDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    
    if (successCount > 0) {
      toast.success(`${successCount} empresa${successCount > 1 ? 's' : ''} excluída${successCount > 1 ? 's' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`Falha ao excluir ${errorCount} empresa${errorCount > 1 ? 's' : ''}`);
    }
    
    onCompanyDeleted?.();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedCompanies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCompanies.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set());
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
    setSelectedIds(new Set());
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
          {selectedIds.size > 0 && (
            <>
              {notEnrichedSelectedCount > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEnrichSelectedCompanies}
                  disabled={isEnrichingSelected}
                  className="gap-2 text-xs font-medium"
                >
                  {isEnrichingSelected ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="hidden sm:inline">Enriquecendo...</span>
                      <span className="sm:hidden">IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Buscar com IA ({notEnrichedSelectedCount})</span>
                      <span className="sm:hidden">IA ({notEnrichedSelectedCount})</span>
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={isDeleting}
                className="gap-2 text-xs font-medium"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">Excluir ({selectedIds.size})</span>
                <span className="sm:hidden">Excluir ({selectedIds.size})</span>
              </Button>
            </>
          )}
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
        {paginatedCompanies.map((company, index) => (
          <div 
            key={company.id}
            className="p-4 space-y-3 animate-fade-up"
            style={{ animationDelay: `${400 + index * 30}ms` }}
          >
            {/* Company Name & CNPJ */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={selectedIds.has(company.id)}
                  onCheckedChange={() => toggleSelect(company.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{company.name}</h4>
                  {company.cnpj && (
                    <code className="text-xs font-mono text-muted-foreground">
                      {formatCnpj(company.cnpj)}
                    </code>
                  )}
                </div>
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
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-4 w-12">
                <Checkbox
                  checked={selectedIds.size === paginatedCompanies.length && paginatedCompanies.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
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
            {paginatedCompanies.map((company, index) => (
              <tr 
                key={company.id}
                className={`hover:bg-secondary/20 transition-colors animate-fade-up ${selectedIds.has(company.id) ? 'bg-primary/5' : ''}`}
                style={{ animationDelay: `${400 + index * 50}ms` }}
              >
                <td className="px-5 py-4 w-12">
                  <Checkbox
                    checked={selectedIds.has(company.id)}
                    onCheckedChange={() => toggleSelect(company.id)}
                  />
                </td>
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={company.enrichedAt ? "ghost" : "default"}
                            size="sm"
                            onClick={() => handleEnrichCompany(company)}
                            disabled={enrichingCompanyId === company.id || !!company.enrichedAt}
                            className={`text-xs font-medium gap-1.5 ${company.enrichedAt ? 'text-muted-foreground' : ''}`}
                          >
                            {enrichingCompanyId === company.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Buscando...
                              </>
                            ) : company.enrichedAt ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Enriquecido
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                Buscar com IA
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        {company.enrichedAt && (
                          <TooltipContent>
                            <div className="space-y-1 text-xs">
                              {company.website && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{company.website}</a>
                                </div>
                              )}
                              {company.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <a href={`mailto:${company.email}`} className="hover:underline">{company.email}</a>
                                </div>
                              )}
                              {company.instagram && (
                                <div className="flex items-center gap-1">
                                  <Instagram className="h-3 w-3" />
                                  {company.instagram}
                                </div>
                              )}
                              {company.facebook && (
                                <div className="flex items-center gap-1">
                                  <Facebook className="h-3 w-3" />
                                  {company.facebook}
                                </div>
                              )}
                              {company.linkedin && (
                                <div className="flex items-center gap-1">
                                  <Linkedin className="h-3 w-3" />
                                  {company.linkedin}
                                </div>
                              )}
                              {company.aiSummary && (
                                <p className="mt-1 max-w-xs">{company.aiSummary}</p>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Exibindo</span>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>de {companies.length}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedIds.size} empresa{selectedIds.size > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> empresa{selectedIds.size > 1 ? 's' : ''}?
              Esta ação não pode ser desfeita e todos os telefones associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                `Excluir ${selectedIds.size}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
