import { useState } from 'react';
import { Search, Building2, MapPin, Phone as PhoneIcon, Loader2, Plus, Check, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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

// Popular CNAEs organized by segment
const popularCnaes = {
  'Comércio': [
    { code: '4711-3/02', description: 'Comércio varejista de mercadorias em geral' },
    { code: '4712-1/00', description: 'Comércio varejista de mercadorias em lojas de departamentos' },
    { code: '4721-1/02', description: 'Padaria e confeitaria' },
    { code: '4722-9/01', description: 'Comércio varejista de carnes - açougues' },
    { code: '4744-0/05', description: 'Comércio varejista de materiais de construção' },
    { code: '4751-2/01', description: 'Comércio varejista especializado de equipamentos de informática' },
    { code: '4753-9/00', description: 'Comércio varejista de eletrodomésticos' },
    { code: '4755-5/02', description: 'Comércio varejista de artigos de armarinho' },
    { code: '4781-4/00', description: 'Comércio varejista de artigos do vestuário' },
    { code: '4789-0/99', description: 'Comércio varejista de outros produtos' },
  ],
  'Serviços': [
    { code: '6201-5/01', description: 'Desenvolvimento de programas de computador sob encomenda' },
    { code: '6202-3/00', description: 'Desenvolvimento e licenciamento de software' },
    { code: '6311-9/00', description: 'Tratamento de dados, provedores de hospedagem' },
    { code: '7020-4/00', description: 'Atividades de consultoria em gestão empresarial' },
    { code: '7111-1/00', description: 'Serviços de arquitetura' },
    { code: '7112-0/00', description: 'Serviços de engenharia' },
    { code: '7311-4/00', description: 'Agências de publicidade' },
    { code: '7319-0/99', description: 'Outras atividades de publicidade' },
    { code: '8599-6/04', description: 'Treinamento em desenvolvimento profissional' },
    { code: '9609-2/99', description: 'Outras atividades de serviços pessoais' },
  ],
  'Alimentação': [
    { code: '5611-2/01', description: 'Restaurantes e similares' },
    { code: '5611-2/03', description: 'Lanchonetes, casas de chá, de sucos' },
    { code: '5612-1/00', description: 'Serviços ambulantes de alimentação' },
    { code: '5620-1/02', description: 'Serviços de alimentação para eventos' },
    { code: '5620-1/04', description: 'Fornecimento de alimentos preparados (marmitex)' },
  ],
  'Saúde': [
    { code: '8630-5/01', description: 'Atividade médica ambulatorial' },
    { code: '8630-5/02', description: 'Atividade médica ambulatorial especializada' },
    { code: '8630-5/03', description: 'Atividade médica ambulatorial (cirurgia)' },
    { code: '8630-5/04', description: 'Atividade odontológica' },
    { code: '8650-0/99', description: 'Atividades de profissionais da saúde' },
  ],
  'Beleza': [
    { code: '9602-5/01', description: 'Cabeleireiros, manicure e pedicure' },
    { code: '9602-5/02', description: 'Atividades de estética e outros serviços de beleza' },
    { code: '9609-2/04', description: 'Saunas e banhos' },
  ],
  'Construção': [
    { code: '4120-4/00', description: 'Construção de edifícios' },
    { code: '4330-4/02', description: 'Instalação de portas, janelas e similares' },
    { code: '4330-4/03', description: 'Obras de acabamento em gesso' },
    { code: '4330-4/04', description: 'Serviços de pintura de edifícios' },
    { code: '4330-4/99', description: 'Outras obras de acabamento da construção' },
  ],
};

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
  const [showCnaeHelper, setShowCnaeHelper] = useState(false);
  const [cnaeSearch, setCnaeSearch] = useState('');
  
  const { toast } = useToast();

  const selectCnae = (code: string) => {
    setSearchParams({ ...searchParams, cnae: code });
    setShowCnaeHelper(false);
  };

  // Filter CNAEs based on search
  const filteredCnaes = cnaeSearch
    ? Object.entries(popularCnaes).reduce((acc, [segment, cnaes]) => {
        const filtered = cnaes.filter(
          c => c.code.includes(cnaeSearch) || 
               c.description.toLowerCase().includes(cnaeSearch.toLowerCase())
        );
        if (filtered.length > 0) acc[segment] = filtered;
        return acc;
      }, {} as Record<string, typeof popularCnaes['Comércio']>)
    : popularCnaes;

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
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                CNAE
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCnaeHelper(!showCnaeHelper)}
                className="h-6 px-2 text-xs text-primary hover:text-primary gap-1"
              >
                <HelpCircle className="h-3 w-3" />
                {showCnaeHelper ? 'Ocultar' : 'Não sei o CNAE'}
              </Button>
            </div>
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

        {/* CNAE Helper */}
        <Collapsible open={showCnaeHelper} onOpenChange={setShowCnaeHelper}>
          <CollapsibleContent className="space-y-3 pb-4">
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Encontre o CNAE da atividade</span>
              </div>
              
              <Input
                placeholder="Buscar por código ou descrição..."
                value={cnaeSearch}
                onChange={(e) => setCnaeSearch(e.target.value)}
                className="bg-background/50 border-border/50 mb-3"
              />

              <div className="max-h-[250px] overflow-y-auto space-y-3">
                {Object.entries(filteredCnaes).map(([segment, cnaes]) => (
                  <div key={segment}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {segment}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {cnaes.map((cnae) => (
                        <Badge
                          key={cnae.code}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors text-xs py-1"
                          onClick={() => selectCnae(cnae.code)}
                        >
                          <span className="font-mono mr-1">{cnae.code}</span>
                          <span className="text-muted-foreground hidden sm:inline">
                            - {cnae.description.length > 30 ? cnae.description.slice(0, 30) + '...' : cnae.description}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(filteredCnaes).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum CNAE encontrado para "{cnaeSearch}"
                  </p>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Clique em um CNAE para selecioná-lo. Esta é uma lista dos mais comuns.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

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
