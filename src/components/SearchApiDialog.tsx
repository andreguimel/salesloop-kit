import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Building2, Phone, MapPin, Plus, Check, ChevronsUpDown, Coins, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { fetchCnaes, Cnae } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';
import { maskName, maskCnpj, maskPhone, maskAddress, maskCep } from '@/lib/mask-utils';
interface SearchResult {
  cnpj?: string;
  nome?: string;
  endereco?: string;
  cep?: string;
  contatos?: string;
  [key: string]: any;
}

interface SearchApiDialogProps {
  onCompaniesImported: () => void;
}

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function SearchApiDialog({ onCompaniesImported }: SearchApiDialogProps) {
  const [open, setOpen] = useState(false);
  const [cnae, setCnae] = useState('');
  const [cnaeSearchTerm, setCnaeSearchTerm] = useState('');
  const [cnaePopoverOpen, setCnaePopoverOpen] = useState(false);
  const [cnaes, setCnaes] = useState<Cnae[]>([]);
  const [isLoadingCnaes, setIsLoadingCnaes] = useState(false);
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();
  const { balance, consumeCredits, hasCredits } = useCredits();

  const ITEMS_PER_PAGE = 50;

  // Load CNAEs when dialog opens
  useEffect(() => {
    if (open && cnaes.length === 0) {
      loadCnaes();
    }
  }, [open]);

  const loadCnaes = async () => {
    setIsLoadingCnaes(true);
    try {
      const data = await fetchCnaes();
      setCnaes(data);
    } catch (error) {
      console.error('Error loading CNAEs:', error);
      toast({
        title: 'Erro ao carregar CNAEs',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCnaes(false);
    }
  };

  // Filter CNAEs based on search term
  const filteredCnaes = useMemo(() => {
    if (!cnaeSearchTerm) return cnaes.slice(0, 100); // Show first 100 if no search
    const term = cnaeSearchTerm.toLowerCase();
    return cnaes.filter(c => 
      c.id.includes(term) || c.descricao.toLowerCase().includes(term)
    ).slice(0, 100);
  }, [cnaes, cnaeSearchTerm]);

  // Get selected CNAE description
  const selectedCnae = useMemo(() => {
    return cnaes.find(c => c.id === cnae);
  }, [cnaes, cnae]);


  const applyFilters = (companies: SearchResult[]) => {
    let filtered = companies;
    
    if (onlyWithPhone) {
      filtered = filtered.filter((c: SearchResult) => c.contatos && c.contatos.trim() !== '');
    }
    
    // Email filter - API doesn't return email, so we skip this
    // if (onlyWithEmail) { ... }
    
    return filtered;
  };

  const handleSearch = async () => {
    if (!cnae.trim()) {
      toast({
        title: 'Selecione uma atividade (CNAE)',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSelectedResults(new Set());
    setCurrentPage(1);
    setHasMore(false);

    try {
      const { data, error } = await supabase.functions.invoke('search-api', {
        body: { cnae, uf, cidade, page: 1, limit: ITEMS_PER_PAGE },
      });

      if (error) throw error;

      const companies = Array.isArray(data) 
        ? data 
        : data?.companies || data?.data || data?.results || [];

      const filtered = applyFilters(companies);
      setResults(filtered);
      setHasMore(companies.length === ITEMS_PER_PAGE);

      if (filtered.length === 0) {
        toast({
          title: 'Nenhum resultado encontrado',
          description: 'Tente outra busca',
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: error.message || 'Não foi possível realizar a busca',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);

    try {
      const { data, error } = await supabase.functions.invoke('search-api', {
        body: { cnae, uf, cidade, page: nextPage, limit: ITEMS_PER_PAGE },
      });

      if (error) throw error;

      const companies = Array.isArray(data) 
        ? data 
        : data?.companies || data?.data || data?.results || [];

      const filtered = applyFilters(companies);
      setResults(prev => [...prev, ...filtered]);
      setCurrentPage(nextPage);
      setHasMore(companies.length === ITEMS_PER_PAGE);

    } catch (error: any) {
      console.error('Load more error:', error);
      toast({
        title: 'Erro ao carregar mais',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleSelect = (cnpj: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(cnpj)) {
      newSelected.delete(cnpj);
    } else {
      newSelected.add(cnpj);
    }
    setSelectedResults(newSelected);
  };

  const selectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map(r => r.cnpj || r.id || '')));
    }
  };

  const handleImport = async () => {
    const toImport = results.filter(r => selectedResults.has(r.cnpj || r.id || ''));
    if (toImport.length === 0) {
      toast({ title: 'Selecione ao menos uma empresa', variant: 'destructive' });
      return;
    }

    // Check credits
    const requiredCredits = toImport.length;
    if (balance < requiredCredits) {
      toast({ 
        title: 'Créditos insuficientes', 
        description: `Você precisa de ${requiredCredits} crédito(s) para importar. Saldo: ${balance}`,
        variant: 'destructive' 
      });
      return;
    }

    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let importedCount = 0;

      for (const company of toImport) {
        // Consume 1 credit per company
        const success = await consumeCredits(1, `Importação: ${company.nome || 'Empresa'}`);
        if (!success) {
          toast({ 
            title: 'Créditos esgotados', 
            description: `Importadas ${importedCount} empresa(s). Compre mais créditos para continuar.`,
            variant: 'destructive' 
          });
          break;
        }

        const companyName = company.nome || 'Empresa';
        
        // Extract city/state from endereco if possible, or use search params
        const searchCity = cidade || '';
        const searchState = uf || '';

        // Insert company with all available data
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            cnpj: company.cnpj || null,
            cnae: cnae,
            cnae_description: '',
            city: searchCity,
            state: searchState,
            address: company.endereco || null,
            cep: company.cep || null,
            segment: null,
            user_id: user.id,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error inserting company:', companyError);
          continue;
        }

        // Insert phones from contatos field
        // Format: "(DD) XXXXXXXX, (DD) XXXXXXXX"
        if (company.contatos) {
          const phoneMatches = company.contatos.match(/\(\d{2}\)\s*\d{4,5}-?\d{4}/g) || [];
          
          for (const phoneMatch of phoneMatches) {
            const cleanPhone = phoneMatch.replace(/\D/g, '');
            if (cleanPhone.length >= 10) {
              await supabase.from('company_phones').insert({
                company_id: newCompany.id,
                phone_number: cleanPhone,
                phone_type: cleanPhone.length === 11 ? 'mobile' : 'landline',
                status: 'pending',
              });
            }
          }
        }

        importedCount++;
      }

      toast({
        title: 'Importação concluída!',
        description: `${importedCount} empresa(s) importada(s). ${importedCount} crédito(s) consumido(s).`,
      });

      setOpen(false);
      setCnae('');
      setResults([]);
      setSelectedResults(new Set());
      onCompaniesImported();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCnae('');
    setCnaeSearchTerm('');
    setCnaePopoverOpen(false);
    setUf('');
    setCidade('');
    setOnlyWithPhone(false);
    setResults([]);
    setSelectedResults(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 gradient-primary hover:opacity-90 text-base font-semibold shadow-lg glow-primary px-6">
          <Search className="h-5 w-5" />
          Buscar Empresas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Buscar Empresas por CNAE
          </DialogTitle>
          <DialogDescription>
            Busque empresas por CNAE, UF e cidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Filters */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CNAE - Atividade</Label>
              <Popover open={cnaePopoverOpen} onOpenChange={setCnaePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={cnaePopoverOpen}
                    className="w-full justify-between font-normal h-auto min-h-10"
                  >
                    {selectedCnae ? (
                      <span className="truncate text-left">
                        <span className="font-medium">{selectedCnae.id}</span> - {selectedCnae.descricao}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Selecione uma atividade...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar por código ou descrição..." 
                      value={cnaeSearchTerm}
                      onValueChange={setCnaeSearchTerm}
                    />
                    <CommandList>
                      {isLoadingCnaes ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>Nenhuma atividade encontrada.</CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {filteredCnaes.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.id}
                                onSelect={() => {
                                  setCnae(c.id);
                                  setCnaePopoverOpen(false);
                                  setCnaeSearchTerm('');
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    cnae === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{c.id}</span>
                                  <span className="text-xs text-muted-foreground line-clamp-2">{c.descricao}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={uf || "all"} onValueChange={(val) => setUf(val === "all" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {UF_LIST.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="Nome da cidade..."
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="phone-filter" 
                checked={onlyWithPhone}
                onCheckedChange={(checked) => setOnlyWithPhone(checked === true)}
              />
              <label htmlFor="phone-filter" className="text-sm flex items-center gap-1 cursor-pointer">
                <Phone className="h-4 w-4" />
                Somente com telefone
              </label>
            </div>
          </div>

          {/* Search Button */}
          <Button onClick={handleSearch} disabled={isSearching} className="w-full gap-2">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Buscar Empresas
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {results.length} resultado(s) encontrado(s)
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {selectedResults.size === results.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </Button>
                  {selectedResults.size > 0 && (
                  <Button 
                    size="sm" 
                    onClick={handleImport} 
                    disabled={isImporting || balance < selectedResults.size}
                    className="gap-2"
                    title={balance < selectedResults.size ? `Saldo insuficiente. Necessário: ${selectedResults.size}, Disponível: ${balance}` : ''}
                  >
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Importar ({selectedResults.size})
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                <span>Custo: {selectedResults.size} crédito(s) | Saldo: {balance}</span>
              </div>
            </div>

              <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                <div className="space-y-1 p-2">
                  {results.map((result, index) => {
                    const id = result.cnpj || index.toString();
                    const name = result.nome || 'Empresa';
                    const endereco = result.endereco || '';
                    const cep = result.cep || '';
                    const contatos = result.contatos || '';

                    return (
                      <div
                        key={id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedResults.has(id)
                            ? 'bg-primary/10 border-primary/30'
                            : 'bg-card hover:bg-muted/50 border-border/50'
                        }`}
                        onClick={() => toggleSelect(id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedResults.has(id)}
                            onCheckedChange={() => toggleSelect(id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Building2 className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-medium truncate">{maskName(name)}</span>
                              {result.cnpj && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {maskCnpj(result.cnpj)}
                                </Badge>
                              )}
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </div>
                            {endereco && (
                              <div className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{maskAddress(endereco)}{cep && ` - CEP: ${maskCep(cep)}`}</span>
                              </div>
                            )}
                            {contatos && (
                              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{maskPhone(contatos)}</span>
                              </div>
                            )}
                          </div>
                          {selectedResults.has(id) && (
                            <Check className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        onClick={handleLoadMore} 
                        disabled={isLoadingMore}
                        className="w-full gap-2"
                      >
                        {isLoadingMore ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Carregar mais resultados
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!isSearching && results.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center py-12">
              <div className="space-y-2">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Digite um código CNAE para buscar empresas
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
