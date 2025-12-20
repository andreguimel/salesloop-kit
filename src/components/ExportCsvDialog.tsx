import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
}

interface ExportField {
  key: string;
  label: string;
  category: 'empresa' | 'telefone';
  getValue: (company: Company, phoneIndex?: number) => string;
}

const exportFields: ExportField[] = [
  // Company fields
  { key: 'name', label: 'Nome da Empresa', category: 'empresa', getValue: (c) => c.name },
  { key: 'cnae', label: 'CNAE', category: 'empresa', getValue: (c) => c.cnae },
  { key: 'cnaeDescription', label: 'Descrição do CNAE', category: 'empresa', getValue: (c) => c.cnaeDescription },
  { key: 'city', label: 'Cidade', category: 'empresa', getValue: (c) => c.city },
  { key: 'state', label: 'Estado', category: 'empresa', getValue: (c) => c.state },
  { key: 'segment', label: 'Segmento', category: 'empresa', getValue: (c) => c.segment },
  // Phone fields
  { key: 'phone', label: 'Telefone', category: 'telefone', getValue: (c, i) => c.phones[i ?? 0]?.number || '' },
  { key: 'phoneType', label: 'Tipo de Telefone', category: 'telefone', getValue: (c, i) => c.phones[i ?? 0]?.type || '' },
  { key: 'phoneStatus', label: 'Status do Telefone', category: 'telefone', getValue: (c, i) => c.phones[i ?? 0]?.status || '' },
];

type ExportMode = 'one-row' | 'multiple-rows';

export function ExportCsvDialog({ open, onOpenChange, companies }: ExportCsvDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'cnae', 'city', 'state', 'phone', 'phoneStatus'
  ]);
  const [exportMode, setExportMode] = useState<ExportMode>('multiple-rows');
  const [onlyValidPhones, setOnlyValidPhones] = useState(true);

  const toggleField = (key: string) => {
    setSelectedFields(prev => 
      prev.includes(key) 
        ? prev.filter(f => f !== key)
        : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedFields(exportFields.map(f => f.key));
  };

  const selectNone = () => {
    setSelectedFields([]);
  };

  const generateCsv = () => {
    if (selectedFields.length === 0) {
      toast.error('Selecione pelo menos um campo para exportar');
      return;
    }

    const selectedFieldsData = exportFields.filter(f => selectedFields.includes(f.key));
    const hasPhoneFields = selectedFieldsData.some(f => f.category === 'telefone');
    
    // Build CSV header
    const headers = selectedFieldsData.map(f => f.label);
    const rows: string[][] = [];

    for (const company of companies) {
      const phonesToExport = hasPhoneFields 
        ? company.phones.filter(p => !onlyValidPhones || p.status === 'valid')
        : [null];

      if (phonesToExport.length === 0 && hasPhoneFields && onlyValidPhones) {
        // Skip companies without valid phones when filtering
        continue;
      }

      if (exportMode === 'multiple-rows' && hasPhoneFields) {
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
    link.download = `empresas_${new Date().toISOString().split('T')[0]}.csv`;
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

  const empresaFields = exportFields.filter(f => f.category === 'empresa');
  const telefoneFields = exportFields.filter(f => f.category === 'telefone');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-accent">
              <FileSpreadsheet className="h-4 w-4 text-accent-foreground" />
            </div>
            Exportar CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Selecionar todos
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Limpar seleção
            </Button>
          </div>

          {/* Company fields */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Dados da Empresa
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {empresaFields.map(field => (
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

          {/* Phone fields */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Dados de Telefone
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {telefoneFields.map(field => (
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

          {/* Summary */}
          <div className="p-3 rounded-lg bg-secondary/30 text-sm">
            <span className="text-muted-foreground">
              {selectedFields.length} campo(s) selecionado(s) • {companies.length} empresa(s)
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={generateCsv}
            disabled={selectedFields.length === 0}
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
