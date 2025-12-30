import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Search, Phone, Globe, Star, Download, Loader2, Building2, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { searchGoogleMaps, importCompanyFromGoogleMaps, GoogleMapsCompany } from '@/lib/api';
import { useCredits } from '@/hooks/useCredits';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchGoogleMapsDialogProps {
  onCompaniesImported: () => void;
}

// Format phone for display
function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove country code if present
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.substring(2);
  }
  
  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return cleaned;
}

// Clean company name
function cleanCompanyName(name: string): string {
  if (!name) return '';
  
  return name
    .replace(/\s*[-–|]\s*Página Oficial.*$/i, '')
    .replace(/\s*[-–|]\s*Site Oficial.*$/i, '')
    .replace(/\s*[-–|]\s*Home.*$/i, '')
    .replace(/\s*[-–|]\s*LinkedIn.*$/i, '')
    .replace(/\s*[-–|]\s*Facebook.*$/i, '')
    .replace(/\s*[-–|]\s*Instagram.*$/i, '')
    .replace(/\.\.\.$/, '')
    .trim();
}

// Check if address is valid
function isValidAddress(address: string): boolean {
  if (!address || address.length < 10) return false;
  
  // Check if it looks like a real address
  const addressPatterns = [
    /^(R\.|Rua|Av\.|Avenida|Al\.|Alameda|Pça\.|Praça|Tv\.|Travessa)/i,
    /\d{5}-?\d{3}/, // CEP
    /n[º°]?\s*\d+/i, // número
  ];
  
  return addressPatterns.some(pattern => pattern.test(address));
}

export function SearchGoogleMapsDialog({ onCompaniesImported }: SearchGoogleMapsDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<GoogleMapsCompany[]>([]);
  const [importedCompanies, setImportedCompanies] = useState<Set<string>>(new Set());
  const [importingAll, setImportingAll] = useState(false);
  const { balance, hasCredits, consumeCredits, isCritical, isLow } = useCredits();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Digite uma busca');
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const response = await searchGoogleMaps(query);
      
      // Filter and clean results
      const cleanedResults = response.companies
        .map(company => ({
          ...company,
          name: cleanCompanyName(company.name),
          phone1: company.phone1?.replace(/^55/, ''),
        }))
        .filter(company => {
          // Filter out invalid entries
          if (!company.name || company.name.length < 3) return false;
          if (company.name.toLowerCase().includes('page not found')) return false;
          if (company.name.toLowerCase().includes('error')) return false;
          return true;
        });
      
      setResults(cleanedResults);
      
      if (cleanedResults.length === 0) {
        toast.info('Nenhuma empresa encontrada');
      } else {
        toast.success(`${cleanedResults.length} empresas encontradas`);
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
      toast.success(`${cleanCompanyName(company.name)} importada`);
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

  const notImportedCount = results.filter(c => !importedCompanies.has(c.name)).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MapPin className="h-4 w-4" />
          Buscar na Web
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Empresas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label>Buscar empresas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: agências de marketing em Recife"
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
              Dica: Seja específico. Ex: "clínicas veterinárias em São Paulo SP"
            </p>
          </div>

          {/* Results Header */}
          {results.length > 0 && (
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">
                {results.length} empresas encontradas
              </span>
              {notImportedCount > 0 && (
                <Button
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
                  Importar Todas ({notImportedCount})
                </Button>
              )}
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2 pr-4">
                {results.map((company, index) => {
                  const displayName = cleanCompanyName(company.name);
                  const displayPhone = formatPhone(company.phone1);
                  const validAddress = isValidAddress(company.address);
                  
                  return (
                    <div
                      key={index}
                      className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium text-sm truncate" title={displayName}>
                              {displayName}
                            </span>
                            {company.rating && (
                              <Badge variant="secondary" className="gap-1 shrink-0 text-xs">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {company.rating}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {displayPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{displayPhone}</span>
                              </div>
                            )}
                            {validAddress && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{company.address}</span>
                              </div>
                            )}
                            {company.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-3 w-3 shrink-0" />
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline truncate"
                                >
                                  {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
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
                          className="shrink-0"
                        >
                          {importedCompanies.has(company.name) ? '✓' : 'Importar'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Empty state */}
          {!isSearching && results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Digite uma busca para encontrar empresas</p>
            </div>
          )}

          {/* Loading state */}
          {isSearching && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Buscando empresas...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
