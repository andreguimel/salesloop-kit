import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Phone, Globe, Star, Download, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { searchGoogleMaps, importCompanyFromGoogleMaps, GoogleMapsCompany } from '@/lib/api';

interface SearchGoogleMapsDialogProps {
  onCompaniesImported: () => void;
}

export function SearchGoogleMapsDialog({ onCompaniesImported }: SearchGoogleMapsDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GoogleMapsCompany[]>([]);
  const [importedCompanies, setImportedCompanies] = useState<Set<string>>(new Set());
  const [importingAll, setImportingAll] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Digite uma busca');
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const response = await searchGoogleMaps(query);
      setResults(response.companies);
      
      if (response.companies.length === 0) {
        toast.info('Nenhuma empresa encontrada');
      } else {
        toast.success(`${response.companies.length} empresas encontradas`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (company: GoogleMapsCompany) => {
    try {
      await importCompanyFromGoogleMaps(company);
      setImportedCompanies(prev => new Set(prev).add(company.name));
      toast.success(`${company.name} importada com sucesso`);
      onCompaniesImported();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar');
    }
  };

  const handleImportAll = async () => {
    const toImport = results.filter(c => !importedCompanies.has(c.name));
    if (toImport.length === 0) {
      toast.info('Todas as empresas já foram importadas');
      return;
    }

    setImportingAll(true);
    let imported = 0;

    for (const company of toImport) {
      try {
        await importCompanyFromGoogleMaps(company);
        setImportedCompanies(prev => new Set(prev).add(company.name));
        imported++;
      } catch (error) {
        console.error(`Error importing ${company.name}:`, error);
      }
    }

    toast.success(`${imported} empresas importadas`);
    onCompaniesImported();
    setImportingAll(false);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setImportedCompanies(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MapPin className="h-4 w-4" />
          Buscar no Google Maps
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Buscar Empresas no Google Maps
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label>Buscar empresas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: agências de publicidade em Recife PE"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: Inclua a atividade e localização. Ex: "restaurantes em São Paulo SP"
            </p>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {results.length} empresas encontradas
                </span>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleImportAll}
                  disabled={importingAll}
                  className="gap-2"
                >
                  {importingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Importar Todas
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {results.map((company, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{company.name}</span>
                            {company.rating && (
                              <Badge variant="secondary" className="gap-1 shrink-0">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {company.rating}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {company.phone1 && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{company.phone1}</span>
                              </div>
                            )}
                            {company.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{company.address}</span>
                              </div>
                            )}
                            {company.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3" />
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate"
                                >
                                  {company.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant={importedCompanies.has(company.name) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => handleImport(company)}
                          disabled={importedCompanies.has(company.name)}
                        >
                          {importedCompanies.has(company.name) ? 'Importada' : 'Importar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Empty state */}
          {!isSearching && results.length === 0 && query && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Faça uma busca para encontrar empresas</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
