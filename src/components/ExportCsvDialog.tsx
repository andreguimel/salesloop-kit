import { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Company } from '@/types';
import { toast } from 'sonner';

interface ExportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  preSelectedIds?: Set<string>;
}

interface ExportField {
  key: string;
  label: string;
  category: 'empresa' | 'contato' | 'redes' | 'ia' | 'telefone';
  getValue: (company: Company, phoneIndex?: number) => string;
}

const exportFields: ExportField[] = [
  // Company basic fields
  { key: 'name', label: 'Nome da Empresa', category: 'empresa', getValue: (c) => c.name },
  { key: 'cnpj', label: 'CNPJ', category: 'empresa', getValue: (c) => c.cnpj || '' },
  { key: 'cnae', label: 'CNAE', category: 'empresa', getValue: (c) => c.cnae },
  { key: 'cnaeDescription', label: 'Descrição do CNAE', category: 'empresa', getValue: (c) => c.cnaeDescription },
  { key: 'segment', label: 'Segmento', category: 'empresa', getValue: (c) => c.segment },
  
  // Location fields
  { key: 'address', label: 'Endereço', category: 'contato', getValue: (c) => c.address || '' },
  { key: 'city', label: 'Cidade', category: 'contato', getValue: (c) => c.city },
  { key: 'state', label: 'Estado', category: 'contato', getValue: (c) => c.state },
  { key: 'cep', label: 'CEP', category: 'contato', getValue: (c) => c.cep || '' },
  { key: 'email', label: 'E-mail', category: 'contato', getValue: (c) => c.email || '' },
  { key: 'website', label: 'Website', category: 'contato', getValue: (c) => c.website || '' },
  
  // Social media fields (enrichment)
  { key: 'instagram', label: 'Instagram', category: 'redes', getValue: (c) => c.instagram || '' },
  { key: 'facebook', label: 'Facebook', category: 'redes', getValue: (c) => c.facebook || '' },
  { key: 'linkedin', label: 'LinkedIn', category: 'redes', getValue: (c) => c.linkedin || '' },
  
  // AI fields
  { key: 'aiSummary', label: 'Resumo da IA', category: 'ia', getValue: (c) => c.aiSummary || '' },
  { key: 'enrichedAt', label: 'Data de Enriquecimento', category: 'ia', getValue: (c) => c.enrichedAt ? new Date(c.enrichedAt).toLocaleDateString('pt-BR') : '' },
  
  // Phone fields
  { key: 'phone', label: 'Telefone', category: 'telefone', getValue: (c, i) => c.phones[i ?? 0]?.number || '' },
  { key: 'phoneType', label: 'Tipo de Telefone', category: 'telefone', getValue: (c, i) => c.phones[i ?? 0]?.type === 'mobile' ? 'Celular' : 'Fixo' },
  { key: 'phoneStatus', label: 'Status do Telefone', category: 'telefone', getValue: (c, i) => {
    const status = c.phones[i ?? 0]?.status;
    if (status === 'valid') return 'Válido';
    if (status === 'invalid') return 'Inválido';
    if (status === 'uncertain') return 'Incerto';
    return 'Pendente';
  }},
];

type ExportMode = 'one-row' | 'multiple-rows';

export function ExportCsvDialog({ open, onOpenChange, companies, preSelectedIds }: ExportCsvDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'cnpj', 'cnae', 'city', 'state', 'email', 'phone', 'phoneStatus'
  ]);
  const [exportMode, setExportMode] = useState<ExportMode>('multiple-rows');
  const [onlyValidPhones, setOnlyValidPhones] = useState(true);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    preSelectedIds || new Set(companies.map(c => c.id))
  );
  const [companySearch, setCompanySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'fields' | 'companies'>('fields');

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const search = companySearch.toLowerCase();
    return companies.filter(c => 
      c.name.toLowerCase().includes(search) ||
      c.city.toLowerCase().includes(search) ||
      c.cnae.includes(search)
    );
  }, [companies, companySearch]);

  const selectedCompanies = useMemo(() => {
    return companies.filter(c => selectedCompanyIds.has(c.id));
  }, [companies, selectedCompanyIds]);

  const toggleField = (key: string) => {
    setSelectedFields(prev => 
      prev.includes(key) 
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(exportFields.map(f => f.key));
  };

  const selectNoneFields = () => {
    setSelectedFields([]);
  };

  const selectAllCompanies = () => {
    setSelectedCompanyIds(new Set(companies.map(c => c.id)));
  };

  const selectNoneCompanies = () => {
    setSelectedCompanyIds(new Set());
  };

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const generateCsv = () => {
    if (selectedFields.length === 0) {
      toast.error('Selecione pelo menos um campo para exportar');
      return;
    }

    if (selectedCompanyIds.size === 0) {
      toast.error('Selecione pelo menos uma empresa para exportar');
      return;
    }

    const selectedFieldsData = exportFields.filter(f => selectedFields.includes(f.key));
    const hasPhoneFields = selectedFieldsData.some(f => f.category === 'telefone');
    
    // Build CSV header
    const headers = selectedFieldsData.map(f => f.label);
    const rows: string[][] = [];

    for (const company of selectedCompanies) {
      const phonesToExport = hasPhoneFields 
        ? company.phones.filter(p => !onlyValidPhones || p.status === 'valid')
        : [null];

      if (phonesToExport.length === 0 && hasPhoneFields && onlyValidPhones) {
        // Skip companies without valid phones when filtering
        continue;
      }

      if (exportMode === 'multiple-rows' && hasPhoneFields && phonesToExport.length > 0) {
        // One row per phone
        for (let i = 0; i < phonesToExport.length; i++) {
          const phoneIndex = company.phones.indexOf(phonesToExport[i]!);
          const row = selectedFieldsData.map(f => {
            const value = f.category === 'telefone' ? f.getValue(company, phoneIndex) : f.getValue(company);
            return escapeCSV(value);
          });
          rows.push(row);
        }
      } else {
        // One row per company (concatenate phones)
        const row = selectedFieldsData.map(f => {
          if (f.category === 'telefone') {
            const values = phonesToExport
              .filter(Boolean)
              .map((_, idx) => f.getValue(company, company.phones.indexOf(phonesToExport[idx]!)))
              .filter(Boolean);
            return escapeCSV(values.join('; '));
          }
          return escapeCSV(f.getValue(company));
        });
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      toast.error('Nenhum dado para exportar com os filtros selecionados');
      return;
    }

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `achei_leads_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`CSV exportado com ${rows.length} linhas`);
    onOpenChange(false);
  };

  const escapeCSV = (value: string): string => {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const fieldCategories = [
    { key: 'empresa', label: 'Dados da Empresa' },
    { key: 'contato', label: 'Contato e Localização' },
    { key: 'redes', label: 'Redes Sociais' },
    { key: 'ia', label: 'Dados da IA' },
    { key: 'telefone', label: 'Telefones' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-accent">
              <FileSpreadsheet className="h-4 w-4 text-accent-foreground" />
            </div>
            Exportar CSV
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
          <button
            onClick={() => setActiveTab('fields')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'fields' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Campos ({selectedFields.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'companies' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Empresas ({selectedCompanyIds.size}/{companies.length})
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'fields' ? (
            <div className="space-y-4 py-2">
              {/* Quick actions for fields */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFields}>
                  <Check className="h-3 w-3 mr-1" />
                  Todos
                </Button>
                <Button variant="outline" size="sm" onClick={selectNoneFields}>
                  <X className="h-3 w-3 mr-1" />
                  Nenhum
                </Button>
              </div>

              <ScrollArea className="h-[280px] pr-4">
                <div className="space-y-4">
                  {fieldCategories.map(category => {
                    const categoryFields = exportFields.filter(f => f.category === category.key);
                    const selectedCount = categoryFields.filter(f => selectedFields.includes(f.key)).length;
                    
                    return (
                      <div key={category.key}>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                          {category.label}
                          <span className="text-primary">({selectedCount}/{categoryFields.length})</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryFields.map(field => (
                            <div key={field.key} className="flex items-center gap-2">
                              <Checkbox
                                id={field.key}
                                checked={selectedFields.includes(field.key)}
                                onCheckedChange={() => toggleField(field.key)}
                              />
                              <Label htmlFor={field.key} className="text-sm cursor-pointer">
                                {field.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Export options */}
              <div className="pt-2 border-t border-border/50 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Opções de Exportação
                </h4>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="onlyValid"
                    checked={onlyValidPhones}
                    onCheckedChange={(checked) => setOnlyValidPhones(!!checked)}
                  />
                  <Label htmlFor="onlyValid" className="text-sm cursor-pointer">
                    Apenas telefones válidos
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Formato de linhas:</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="multiple"
                        name="exportMode"
                        checked={exportMode === 'multiple-rows'}
                        onChange={() => setExportMode('multiple-rows')}
                        className="accent-primary"
                      />
                      <Label htmlFor="multiple" className="text-sm cursor-pointer">
                        Uma linha por telefone
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="single"
                        name="exportMode"
                        checked={exportMode === 'one-row'}
                        onChange={() => setExportMode('one-row')}
                        className="accent-primary"
                      />
                      <Label htmlFor="single" className="text-sm cursor-pointer">
                        Uma linha por empresa
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {/* Search and quick actions */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empresa..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAllCompanies}>
                  <Check className="h-3 w-3 mr-1" />
                  Todas
                </Button>
                <Button variant="outline" size="sm" onClick={selectNoneCompanies}>
                  <X className="h-3 w-3 mr-1" />
                  Nenhuma
                </Button>
              </div>

              {/* Company list */}
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-1">
                  {filteredCompanies.map(company => (
                    <div 
                      key={company.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedCompanyIds.has(company.id) 
                          ? 'bg-primary/10' 
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => toggleCompany(company.id)}
                    >
                      <Checkbox
                        checked={selectedCompanyIds.has(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company.city}, {company.state} • {company.phones.length} telefone(s)
                          {company.enrichedAt && ' • ✨ Enriquecido'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-secondary/30 text-sm">
          <span className="text-muted-foreground">
            {selectedFields.length} campo(s) • {selectedCompanyIds.size} empresa(s) selecionada(s)
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={generateCsv}
            disabled={selectedFields.length === 0 || selectedCompanyIds.size === 0}
            className="gap-2 gradient-primary hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
