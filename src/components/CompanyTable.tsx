import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Building2, RefreshCw, CheckCircle, Phone, Trash2, Loader2, ChevronLeft, ChevronRight, Sparkles, Globe, Mail, Instagram, Facebook, Linkedin, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PhoneStatusBadge } from './PhoneStatusBadge';
import { ExportCsvDialog } from './ExportCsvDialog';
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
  const navigate = useNavigate();
  const [validatingCompanyId, setValidatingCompanyId] = useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [enrichingCompanyId, setEnrichingCompanyId] = useState<string | null>(null);
  const [isEnrichingSelected, setIsEnrichingSelected] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isValidatingAll, setIsValidatingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
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
      toast.info('Não há telefones pendentes para validar WhatsApp');
      return;
    }

    setValidatingCompanyId(company.id);
    
    try {
      const phoneIds = pendingPhones.map(p => p.id!);
      const result = await validatePhones(phoneIds);
      
      toast.success(
        `WhatsApp: ${result.summary.valid} com WhatsApp, ${result.summary.invalid} sem WhatsApp`,
        { description: `${result.summary.uncertain} incertos` }
      );
      
      onPhonesValidated?.();
    } catch (error) {
      console.error('Error validating phones:', error);
      toast.error('Erro ao validar WhatsApp', {
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setValidatingCompanyId(null);
    }
  };

  const handleValidateAllPhones = async () => {
    if (allPendingPhoneIds.length === 0) {
      toast.info('Não há telefones pendentes para validar WhatsApp');
      return;
    }

    setIsValidatingAll(true);
    
    try {
      const result = await validatePhones(allPendingPhoneIds);
      
      toast.success(
        `Validação de WhatsApp concluída!`,
        { 
          description: `${result.summary.valid} com WhatsApp, ${result.summary.invalid} sem WhatsApp, ${result.summary.uncertain} incertos` 
        }
      );
      
      onPhonesValidated?.();
    } catch (error) {
      console.error('Error validating all phones:', error);
      toast.error('Erro ao validar WhatsApp', {
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
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                className="gap-2 text-xs font-medium border-accent/30 hover:bg-accent/10"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exportar ({selectedIds.size})</span>
                <span className="sm:hidden">CSV ({selectedIds.size})</span>
              </Button>
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
                  <span className="hidden sm:inline">Validando WhatsApp...</span>
                  <span className="sm:hidden">Validando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Validar WhatsApp ({allPendingPhoneIds.length})</span>
                  <span className="sm:hidden">WhatsApp ({allPendingPhoneIds.length})</span>
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
            className="p-3 flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: `${400 + index * 20}ms` }}
          >
            <Checkbox
              checked={selectedIds.has(company.id)}
              onCheckedChange={() => toggleSelect(company.id)}
            />
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/empresa/${company.id}`)}
            >
              <h4 className="font-medium text-foreground truncate text-sm">
                {company.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{company.city}, {company.state}</span>
                {company.phones.length > 0 && (
                  <>
                    <span className="text-border">•</span>
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="font-mono">{formatPhone(company.phones[0].number)}</span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/empresa/${company.id}`)}
              className="h-8 w-8 shrink-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-10">
                <Checkbox
                  checked={selectedIds.size === paginatedCompanies.length && paginatedCompanies.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Empresa
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Local
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Telefone
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-28">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedCompanies.map((company, index) => (
              <tr 
                key={company.id}
                className={`hover:bg-secondary/20 transition-colors animate-fade-up ${selectedIds.has(company.id) ? 'bg-primary/5' : ''}`}
                style={{ animationDelay: `${400 + index * 30}ms` }}
              >
                <td className="px-4 py-3 w-10">
                  <Checkbox
                    checked={selectedIds.has(company.id)}
                    onCheckedChange={() => toggleSelect(company.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div 
                    className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors truncate max-w-[200px]"
                    onClick={() => navigate(`/empresa/${company.id}`)}
                    title={company.name}
                  >
                    {company.name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{company.city}, {company.state}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {company.phones.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-mono">{formatPhone(company.phones[0].number)}</span>
                      {company.phones.length > 1 && (
                        <span className="text-xs text-muted-foreground">+{company.phones.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {company.enrichedAt ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Enriquecido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Básico
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/empresa/${company.id}`)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalhes</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCompanyToDelete(company)}
                            disabled={deletingCompanyId === company.id}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingCompanyId === company.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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

      <ExportCsvDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        companies={companies}
        preSelectedIds={selectedIds}
      />
    </div>
  );
}
