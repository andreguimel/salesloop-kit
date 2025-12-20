import { useState } from 'react';
import { Search, Building2, MapPin, Loader2, Plus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { searchCompaniesByCnae, importCompanyFromSearch, SearchCompanyResult } from '@/lib/api';

const NATUREZAS_JURIDICAS = [
  { value: '2062', label: 'Sociedade Empresária Limitada' },
  { value: '2135', label: 'Empresário Individual (MEI)' },
  { value: '2305', label: 'EIRELI (Natureza Empresária)' },
  { value: '2313', label: 'EIRELI (Natureza Simples)' },
  { value: '2143', label: 'Cooperativa' },
  { value: '2046', label: 'Sociedade Anônima Fechada' },
  { value: '2054', label: 'Sociedade Anônima Aberta' },
];

interface SearchByCnaeDialogProps {
  onCompaniesImported: () => void;
}

export function SearchByCnaeDialog({ onCompaniesImported }: SearchByCnaeDialogProps) {
  const [open, setOpen] = useState(false);
  const [cnae, setCnae] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [naturezaJuridica, setNaturezaJuridica] = useState('2062');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchCompanyResult[]>([]);
  const [importingCnpjs, setImportingCnpjs] = useState<Set<string>>(new Set());
  const [importedCnpjs, setImportedCnpjs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!cnae.trim() || !municipio.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o CNAE e o código do município',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const response = await searchCompaniesByCnae({
        cnae: cnae.trim(),
        municipio: municipio.trim(),
        naturezaJuridica: naturezaJuridica,
        top: 50,
      });

      if (response.companies.length === 0) {
        toast({
          title: 'Nenhuma empresa encontrada',
          description: 'Tente outro CNAE ou município',
        });
      } else {
        setResults(response.companies);
        toast({
          title: 'Busca concluída',
          description: `${response.companies.length} empresa(s) encontrada(s)`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (company: SearchCompanyResult) => {
    if (importedCnpjs.has(company.cnpj)) return;

    setImportingCnpjs(prev => new Set(prev).add(company.cnpj));

    try {
      await importCompanyFromSearch(company);
      setImportedCnpjs(prev => new Set(prev).add(company.cnpj));
      toast({
        title: 'Empresa importada',
        description: `${company.fantasyName || company.name} foi adicionada`,
      });
      onCompaniesImported();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setImportingCnpjs(prev => {
        const next = new Set(prev);
        next.delete(company.cnpj);
        return next;
      });
    }
  };

  const handleImportAll = async () => {
    const toImport = results.filter(c => !importedCnpjs.has(c.cnpj));
    
    for (const company of toImport) {
      await handleImport(company);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCnae('');
    setMunicipio('');
    setResults([]);
    setImportedCnpjs(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          Buscar por CNAE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Buscar Empresas por CNAE
          </DialogTitle>
          <DialogDescription>
            Busque empresas por atividade econômica (CNAE) e município usando a API Nuvem Fiscal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnae">Código CNAE</Label>
              <Input
                id="cnae"
                placeholder="Ex: 6202300 (Desenvolvimento de Software)"
                value={cnae}
                onChange={(e) => setCnae(e.target.value)}
                disabled={isSearching}
              />
              <p className="text-xs text-muted-foreground">
                Apenas números. Ex: 6202300
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Código do Município (IBGE)</Label>
              <Input
                id="municipio"
                placeholder="Ex: 4106902 (Curitiba)"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                disabled={isSearching}
              />
              <p className="text-xs text-muted-foreground">
                Código IBGE. Ex: 4106902
              </p>
            </div>
          </div>

          {/* Natureza Jurídica */}
          <div className="space-y-2">
            <Label htmlFor="natureza">Natureza Jurídica</Label>
            <Select value={naturezaJuridica} onValueChange={setNaturezaJuridica} disabled={isSearching}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a natureza jurídica" />
              </SelectTrigger>
              <SelectContent>
                {NATUREZAS_JURIDICAS.map((nj) => (
                  <SelectItem key={nj.value} value={nj.value}>
                    {nj.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isSearching} className="flex-1">
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Empresas
                </>
              )}
            </Button>
            {results.length > 0 && (
              <Button 
                onClick={handleImportAll} 
                variant="secondary"
                disabled={results.every(c => importedCnpjs.has(c.cnpj))}
              >
                <Plus className="h-4 w-4 mr-2" />
                Importar Todas
              </Button>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-3">
                {results.map((company) => (
                  <div
                    key={company.cnpj}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">
                            {company.fantasyName || company.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                          </Badge>
                        </div>
                        {company.fantasyName && (
                          <p className="text-sm text-muted-foreground truncate">
                            {company.name}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {company.city}, {company.state}
                          </span>
                          {company.email && (
                            <span className="truncate">{company.email}</span>
                          )}
                        </div>
                        {company.phone1 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Tel: {company.phone1}
                            {company.phone2 && `, ${company.phone2}`}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={importedCnpjs.has(company.cnpj) ? 'secondary' : 'default'}
                        onClick={() => handleImport(company)}
                        disabled={importingCnpjs.has(company.cnpj) || importedCnpjs.has(company.cnpj)}
                      >
                        {importingCnpjs.has(company.cnpj) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : importedCnpjs.has(company.cnpj) ? (
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
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
