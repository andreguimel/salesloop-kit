import { useState, useEffect, useMemo } from 'react';
import { Search, Building2, MapPin, Loader2, Plus, Check, Phone, Mail, Briefcase, Coins, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { searchCompaniesByCnae, importCompanyFromSearch, fetchMunicipios, fetchCnaes, SearchCompanyResult, Municipio, Cnae } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';
import { maskName, maskCnpj, maskPhone, maskEmail } from '@/lib/mask-utils';

interface SearchByCnaeDialogProps {
  onCompaniesImported: () => void;
}

export function SearchByCnaeDialog({ onCompaniesImported }: SearchByCnaeDialogProps) {
  const [open, setOpen] = useState(false);
  const [cnaeId, setCnaeId] = useState<string | null>(null);
  const [cnaeSearch, setCnaeSearch] = useState('');
  const [cnaePopoverOpen, setCnaePopoverOpen] = useState(false);
  const [municipioId, setMunicipioId] = useState<number | null>(null);
  const [municipioSearch, setMunicipioSearch] = useState('');
  const [municipioPopoverOpen, setMunicipioPopoverOpen] = useState(false);
  const [telefoneObrigatorio, setTelefoneObrigatorio] = useState(false);
  const [emailObrigatorio, setEmailObrigatorio] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchCompanyResult[]>([]);
  const [importingCnpjs, setImportingCnpjs] = useState<Set<string>>(new Set());
  const [importedCnpjs, setImportedCnpjs] = useState<Set<string>>(new Set());
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [cnaes, setCnaes] = useState<Cnae[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [loadingCnaes, setLoadingCnaes] = useState(false);
  const { toast } = useToast();
  const { balance, consumeCredits } = useCredits();

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      if (municipios.length === 0) loadMunicipios();
      if (cnaes.length === 0) loadCnaes();
    }
  }, [open]);

  const loadMunicipios = async () => {
    setLoadingMunicipios(true);
    try {
      const data = await fetchMunicipios();
      setMunicipios(data);
    } catch (error) {
      console.error('Error loading municipalities:', error);
      toast({
        title: 'Erro ao carregar municípios',
        description: 'Não foi possível carregar a lista de municípios',
        variant: 'destructive',
      });
    } finally {
      setLoadingMunicipios(false);
    }
  };

  const loadCnaes = async () => {
    setLoadingCnaes(true);
    try {
      const data = await fetchCnaes();
      setCnaes(data);
    } catch (error) {
      console.error('Error loading CNAEs:', error);
      toast({
        title: 'Erro ao carregar CNAEs',
        description: 'Não foi possível carregar a lista de CNAEs',
        variant: 'destructive',
      });
    } finally {
      setLoadingCnaes(false);
    }
  };

  // Filter municipalities based on search
  const filteredMunicipios = useMemo(() => {
    if (!municipioSearch.trim()) return municipios.slice(0, 100);
    const search = municipioSearch.toLowerCase();
    return municipios
      .filter(m => 
        m.nome.toLowerCase().includes(search) || 
        m.uf.toLowerCase().includes(search)
      )
      .slice(0, 100);
  }, [municipios, municipioSearch]);

  // Filter CNAEs based on search
  const filteredCnaes = useMemo(() => {
    if (!cnaeSearch.trim()) return cnaes.slice(0, 100);
    const search = cnaeSearch.toLowerCase();
    return cnaes
      .filter(c => 
        c.id.includes(cnaeSearch) ||
        c.descricao.toLowerCase().includes(search)
      )
      .slice(0, 100);
  }, [cnaes, cnaeSearch]);

  const selectedMunicipio = useMemo(() => {
    return municipios.find(m => m.id === municipioId);
  }, [municipios, municipioId]);

  const selectedCnae = useMemo(() => {
    return cnaes.find(c => c.id === cnaeId);
  }, [cnaes, cnaeId]);

  const handleSearch = async () => {
    if (!cnaeId || !municipioId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Selecione o CNAE e o município',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      const response = await searchCompaniesByCnae({
        cnae: cnaeId,
        municipio: municipioId,
        quantidade: 50,
        telefoneObrigatorio,
        emailObrigatorio,
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

    // Check credits
    if (balance < 1) {
      toast({
        title: 'Créditos insuficientes',
        description: 'Você precisa de pelo menos 1 crédito para importar. Compre mais créditos.',
        variant: 'destructive',
      });
      return;
    }

    setImportingCnpjs(prev => new Set(prev).add(company.cnpj));

    try {
      // Consume 1 credit
      const success = await consumeCredits(1, `Importação: ${company.fantasyName || company.name}`);
      if (!success) {
        toast({
          title: 'Erro ao consumir crédito',
          description: 'Não foi possível descontar o crédito.',
          variant: 'destructive',
        });
        return;
      }

      await importCompanyFromSearch(company);
      setImportedCnpjs(prev => new Set(prev).add(company.cnpj));
      toast({
        title: 'Empresa importada',
        description: `${company.fantasyName || company.name} foi adicionada. 1 crédito consumido.`,
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
    
    if (balance < toImport.length) {
      toast({
        title: 'Créditos insuficientes',
        description: `Você precisa de ${toImport.length} créditos para importar todas. Saldo: ${balance}`,
        variant: 'destructive',
      });
      return;
    }
    
    for (const company of toImport) {
      if (balance < 1) break;
      await handleImport(company);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCnaeId(null);
    setCnaeSearch('');
    setMunicipioId(null);
    setMunicipioSearch('');
    setResults([]);
    setImportedCnpjs(new Set());
    setTelefoneObrigatorio(false);
    setEmailObrigatorio(false);
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
            Busque empresas por atividade econômica (CNAE) e município usando a API Lista CNAE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CNAE Autocomplete */}
            <div className="space-y-2">
              <Label>Atividade (CNAE)</Label>
              <Popover open={cnaePopoverOpen} onOpenChange={setCnaePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cnaePopoverOpen}
                    className="w-full justify-between font-normal h-auto min-h-10 text-left"
                    disabled={isSearching || loadingCnaes}
                  >
                    {loadingCnaes ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando CNAEs...
                      </span>
                    ) : selectedCnae ? (
                      <div className="flex flex-col items-start gap-0.5 py-1">
                        <span className="font-medium text-xs text-muted-foreground">{selectedCnae.id}</span>
                        <span className="text-sm line-clamp-2">{selectedCnae.descricao}</span>
                      </div>
                    ) : (
                      "Buscar atividade econômica..."
                    )}
                    <Briefcase className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[450px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Digite código ou descrição do CNAE..."
                      value={cnaeSearch}
                      onValueChange={setCnaeSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingCnaes ? 'Carregando...' : 'Nenhum CNAE encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[300px]">
                          {filteredCnaes.map((cnae) => (
                            <CommandItem
                              key={cnae.id}
                              value={cnae.id}
                              onSelect={() => {
                                setCnaeId(cnae.id);
                                setCnaePopoverOpen(false);
                              }}
                              className="flex flex-col items-start py-2"
                            >
                              <div className="flex items-center w-full">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    cnaeId === cnae.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium text-xs text-muted-foreground">{cnae.id}</span>
                                  <span className="text-sm truncate">{cnae.descricao}</span>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Digite o código ou descrição da atividade
              </p>
            </div>

            {/* Municipality Autocomplete */}
            <div className="space-y-2">
              <Label>Município</Label>
              <Popover open={municipioPopoverOpen} onOpenChange={setMunicipioPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={municipioPopoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={isSearching || loadingMunicipios}
                  >
                    {loadingMunicipios ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </span>
                    ) : selectedMunicipio ? (
                      `${selectedMunicipio.nome} - ${selectedMunicipio.uf}`
                    ) : (
                      "Selecione um município..."
                    )}
                    <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Digite para buscar município..."
                      value={municipioSearch}
                      onValueChange={setMunicipioSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingMunicipios ? 'Carregando...' : 'Nenhum município encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[300px]">
                          {filteredMunicipios.map((mun) => (
                            <CommandItem
                              key={mun.id}
                              value={mun.id.toString()}
                              onSelect={() => {
                                setMunicipioId(mun.id);
                                setMunicipioPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  municipioId === mun.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {mun.nome} - {mun.uf}
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Digite para buscar por nome ou UF
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="telefone"
                checked={telefoneObrigatorio}
                onCheckedChange={(checked) => setTelefoneObrigatorio(checked as boolean)}
                disabled={isSearching}
              />
              <Label htmlFor="telefone" className="text-sm flex items-center gap-1 cursor-pointer">
                <Phone className="h-3 w-3" />
                Somente com telefone
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="email"
                checked={emailObrigatorio}
                onCheckedChange={(checked) => setEmailObrigatorio(checked as boolean)}
                disabled={isSearching}
              />
              <Label htmlFor="email" className="text-sm flex items-center gap-1 cursor-pointer">
                <Mail className="h-3 w-3" />
                Somente com email
              </Label>
            </div>
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
                disabled={results.every(c => importedCnpjs.has(c.cnpj)) || balance < results.filter(c => !importedCnpjs.has(c.cnpj)).length}
              >
                <Plus className="h-4 w-4 mr-2" />
                Importar Todas
              </Button>
            )}
          </div>
          
          {results.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Coins className="h-3 w-3" />
              <span>Custo: 1 crédito/empresa | Saldo: {balance}</span>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="h-[350px] border rounded-lg">
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
                            {maskName(company.fantasyName || company.name)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {maskCnpj(company.cnpj)}
                          </Badge>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        {company.fantasyName && (
                          <p className="text-sm text-muted-foreground truncate">
                            {maskName(company.name)}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {company.city}, {company.state}
                          </span>
                          {company.email && (
                            <span className="truncate">{maskEmail(company.email)}</span>
                          )}
                        </div>
                        {company.phone1 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Tel: {maskPhone(company.phone1)}
                            {company.phone2 && `, ${maskPhone(company.phone2)}`}
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
