import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Building2, Phone, MapPin, Plus, Check, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchResult {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnae?: string;
  cnae_descricao?: string;
  municipio?: string;
  uf?: string;
  telefone1?: string;
  telefone2?: string;
  email?: string;
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
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [onlyWithEmail, setOnlyWithEmail] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  const applyFilters = (companies: SearchResult[]) => {
    let filtered = companies;
    
    if (onlyWithPhone) {
      filtered = filtered.filter((c: SearchResult) => 
        c.telefone1 || c.telefone2 || c.telefone || c.phone
      );
    }
    
    if (onlyWithEmail) {
      filtered = filtered.filter((c: SearchResult) => c.email);
    }
    
    return filtered;
  };

  const handleSearch = async () => {
    if (!cnae.trim() || cnae.length < 2) {
      toast({
        title: 'Digite ao menos 2 caracteres do CNAE',
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

    setIsImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let importedCount = 0;

      for (const company of toImport) {
        const companyName = company.nome_fantasia || company.razao_social || company.name || 'Empresa';
        const cnae = company.cnae || company.cnae_fiscal || '';
        const city = company.municipio || company.cidade || company.city || '';
        const state = company.uf || company.estado || company.state || '';

        // Insert company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyName,
            cnae: cnae,
            cnae_description: company.cnae_descricao || company.cnae_description || '',
            city: city,
            state: state,
            segment: company.segmento || company.segment || null,
            user_id: user.id,
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error inserting company:', companyError);
          continue;
        }

        // Insert phones
        const phones: string[] = [];
        if (company.telefone1) phones.push(company.telefone1);
        if (company.telefone2) phones.push(company.telefone2);
        if (company.telefone) phones.push(company.telefone);
        if (company.phone) phones.push(company.phone);
        if (Array.isArray(company.phones)) phones.push(...company.phones);

        for (const phone of phones.filter(Boolean)) {
          const cleanPhone = phone.replace(/\D/g, '');
          if (cleanPhone.length >= 10) {
            await supabase.from('company_phones').insert({
              company_id: newCompany.id,
              phone_number: cleanPhone,
              phone_type: cleanPhone.length === 11 ? 'mobile' : 'landline',
              status: 'pending',
            });
          }
        }

        importedCount++;
      }

      toast({
        title: 'Importação concluída!',
        description: `${importedCount} empresa(s) importada(s) com sucesso.`,
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
    setUf('');
    setCidade('');
    setOnlyWithPhone(false);
    setOnlyWithEmail(false);
    setResults([]);
    setSelectedResults(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
          <Search className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>CNAE</Label>
              <Input
                placeholder="Ex: 4711302, 5611201..."
                value={cnae}
                onChange={(e) => setCnae(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
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
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="email-filter" 
                checked={onlyWithEmail}
                onCheckedChange={(checked) => setOnlyWithEmail(checked === true)}
              />
              <label htmlFor="email-filter" className="text-sm flex items-center gap-1 cursor-pointer">
                <Mail className="h-4 w-4" />
                Somente com email
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
                      disabled={isImporting}
                      className="gap-2"
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
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="space-y-1 p-2">
                  {results.map((result, index) => {
                    const id = result.cnpj || result.id || index.toString();
                    const name = result.nome_fantasia || result.razao_social || result.name || 'Empresa';
                    const cnae = result.cnae || result.cnae_fiscal || '';
                    const city = result.municipio || result.cidade || result.city || '';
                    const state = result.uf || result.estado || result.state || '';
                    const phone = result.telefone1 || result.telefone || result.phone || '';

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
                              <span className="font-medium truncate">{name}</span>
                              {result.cnpj && (
                                <Badge variant="outline" className="text-xs">
                                  {result.cnpj}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                              {cnae && <span>CNAE: {cnae}</span>}
                              {(city || state) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {city}{city && state && '/'}{state}
                                </span>
                              )}
                              {phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {phone}
                                </span>
                              )}
                            </div>
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
              </ScrollArea>
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
