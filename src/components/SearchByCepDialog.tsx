import { useState } from 'react';
import { Search, Building2, MapPin, Phone, Mail, Loader2, Download, CheckCircle, Coins, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { importCompanyFromSearch, SearchCompanyResult } from '@/lib/api';
import { useCredits } from '@/hooks/useCredits';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchByCepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyImported: () => void;
}

// Format CEP as 00000-000
const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

// Format phone number
const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

interface CepCompany {
  cnpj: string;
  name: string;
  fantasyName: string;
  cnae: string;
  cnaeDescription: string;
  city: string;
  state: string;
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  number: string;
  neighborhood: string;
  cep: string;
}

export function SearchByCepDialog({ open, onOpenChange, onCompanyImported }: SearchByCepDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [results, setResults] = useState<CepCompany[]>([]);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const { balance, hasCredits, consumeCredits, isCritical, isLow } = useCredits();

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCep(e.target.value));
  };

  const handleSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('search-by-cep', {
        body: { cep: cleanCep },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.companies && data.companies.length > 0) {
        setResults(data.companies);
        toast.success(`${data.companies.length} empresa(s) encontrada(s)`);
      } else {
        toast.info('Nenhuma empresa encontrada neste CEP');
      }
    } catch (error) {
      console.error('Error searching by CEP:', error);
      toast.error('Erro ao buscar empresas por CEP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (company: CepCompany) => {
    setImportingIds(prev => new Set(prev).add(company.cnpj));

    try {
      const searchResult: SearchCompanyResult = {
        cnpj: company.cnpj,
        name: company.name,
        fantasyName: company.fantasyName,
        cnae: company.cnae,
        cnaeDescription: company.cnaeDescription,
        city: company.city,
        state: company.state,
        phone1: company.phone1,
        phone2: company.phone2,
        email: company.email,
        address: company.address,
        number: company.number,
        neighborhood: company.neighborhood,
        cep: company.cep,
      };

      await importCompanyFromSearch(searchResult);
      setImportedIds(prev => new Set(prev).add(company.cnpj));
      toast.success('Empresa importada com sucesso!');
      onCompanyImported();
    } catch (error) {
      console.error('Error importing company:', error);
      toast.error('Erro ao importar empresa');
    } finally {
      setImportingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(company.cnpj);
        return newSet;
      });
    }
  };

  const handleImportAll = async () => {
    const toImport = results.filter(c => !importedIds.has(c.cnpj));
    
    for (const company of toImport) {
      await handleImport(company);
    }
    
    toast.success(`${toImport.length} empresa(s) importada(s)`);
  };

  const handleClose = () => {
    setCep('');
    setResults([]);
    setImportedIds(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Buscar Empresas por CEP
          </DialogTitle>
          <DialogDescription>
            Busque empresas usando o CEP. Requer plano Premium do CNPJ.ws.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Form */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={cep}
                onChange={handleCepChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={9}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || cep.replace(/\D/g, '').length !== 8}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar
              </Button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary">
                  {results.length} empresa(s) encontrada(s)
                </Badge>
                {results.some(c => !importedIds.has(c.cnpj)) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleImportAll}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Importar Todas
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 h-[350px]">
                <div className="space-y-3 pr-4">
                  {results.map((company, index) => (
                    <div 
                      key={`${company.cnpj}-${index}`}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium truncate">
                              {company.fantasyName || company.name}
                            </span>
                          </div>
                          
                          {company.fantasyName && company.name !== company.fantasyName && (
                            <p className="text-sm text-muted-foreground ml-6 truncate">
                              {company.name}
                            </p>
                          )}
                          
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <p className="ml-6">CNPJ: {company.cnpj}</p>
                            
                            {company.address && (
                              <div className="flex items-center gap-2 ml-6">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {company.address}{company.number ? `, ${company.number}` : ''} - {company.neighborhood} - {company.city}/{company.state}
                                </span>
                              </div>
                            )}
                            
                            {(company.phone1 || company.phone2) && (
                              <div className="flex items-center gap-2 ml-6">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>
                                  {formatPhone(company.phone1)}
                                  {company.phone2 && ` / ${formatPhone(company.phone2)}`}
                                </span>
                              </div>
                            )}
                            
                            {company.email && (
                              <div className="flex items-center gap-2 ml-6">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{company.email}</span>
                              </div>
                            )}

                            {company.cnaeDescription && (
                              <p className="ml-6 text-xs">
                                CNAE: {company.cnae} - {company.cnaeDescription}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={importedIds.has(company.cnpj) ? "secondary" : "default"}
                          onClick={() => handleImport(company)}
                          disabled={importingIds.has(company.cnpj) || importedIds.has(company.cnpj)}
                          className="shrink-0"
                        >
                          {importingIds.has(company.cnpj) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : importedIds.has(company.cnpj) ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            'Importar'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && results.length === 0 && cep && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Digite um CEP e clique em Buscar</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
