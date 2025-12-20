import { useState } from 'react';
import { Search, Building2, MapPin, Phone as PhoneIcon, Loader2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { searchCompaniesAPI, importCompanyFromSearch, SearchCompanyResult } from '@/lib/api';

interface SearchCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompaniesImported: () => void;
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function SearchCompaniesDialog({ open, onOpenChange, onCompaniesImported }: SearchCompaniesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    cnae: '',
    cidade: '',
    uf: '',
  });
  const [results, setResults] = useState<SearchCompanyResult[]>([]);
  const [importing, setImporting] = useState<Record<string, boolean>>({});
  const [imported, setImported] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState(false);
  
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchParams.cnae && !searchParams.cidade && !searchParams.uf) {
      toast({
        title: 'Preencha pelo menos um filtro',
        description: 'Informe CNAE, cidade ou estado para buscar.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await searchCompaniesAPI(searchParams);
      setResults(response.companies);
      
      if (response.companies.length === 0) {
        toast({
          title: 'Nenhuma empresa encontrada',
          description: 'Tente ajustar os filtros de busca.',
        });
      } else {
        toast({
          title: `${response.companies.length} empresas encontradas`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: error instanceof Error ? error.message : 'Não foi possível buscar empresas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (company: SearchCompanyResult) => {
    setImporting(prev => ({ ...prev, [company.cnpj]: true }));

    try {
      await importCompanyFromSearch(company);
      setImported(prev => ({ ...prev, [company.cnpj]: true }));
      toast({
        title: 'Empresa importada!',
        description: `${company.fantasyName || company.name} foi adicionada.`,
      });
      onCompaniesImported();
    } catch (error) {
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Não foi possível importar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setImporting(prev => ({ ...prev, [company.cnpj]: false }));
    }
  };

  const handleClose = () => {
    setResults([]);
    setHasSearched(false);
    setImported({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong border-border/50 max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            Buscar Empresas por CNAE
          </DialogTitle>
        </DialogHeader>

        {/* Search Form */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              CNAE
            </Label>
            <Input
              placeholder="Ex: 6201-5/01"
              value={searchParams.cnae}
              onChange={(e) => setSearchParams({ ...searchParams, cnae: e.target.value })}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Cidade
            </Label>
            <Input
              placeholder="Ex: São Paulo"
              value={searchParams.cidade}
              onChange={(e) => setSearchParams({ ...searchParams, cidade: e.target.value })}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Estado
            </Label>
            <Select
              value={searchParams.uf}
              onValueChange={(value) => setSearchParams({ ...searchParams, uf: value })}
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

        <Button 
          onClick={handleSearch} 
          disabled={isLoading}
          className="w-full gap-2 gradient-primary hover:opacity-90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isLoading ? 'Buscando...' : 'Buscar Empresas'}
        </Button>

        {/* Results */}
        {hasSearched && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[400px]">
            {results.length === 0 && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma empresa encontrada</p>
              </div>
            ) : (
              results.map((company) => (
                <div
                  key={company.cnpj}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-border/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {company.fantasyName || company.name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {company.name}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {company.city}, {company.state}
                        </span>
                        {company.phone1 && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="h-3 w-3" />
                            {company.phone1}
                          </span>
                        )}
                        <code className="px-1.5 py-0.5 rounded bg-secondary">
                          CNAE: {company.cnae}
                        </code>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImport(company)}
                      disabled={importing[company.cnpj] || imported[company.cnpj]}
                      className={imported[company.cnpj] 
                        ? 'bg-success hover:bg-success' 
                        : 'gradient-primary hover:opacity-90'
                      }
                    >
                      {importing[company.cnpj] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : imported[company.cnpj] ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Importado
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
