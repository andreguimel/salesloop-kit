import { useState } from 'react';
import { Search, Building2, MapPin, Phone as PhoneIcon, Loader2, Plus, Check, Info, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { searchCompanyByCnpj, importCompanyFromSearch, SearchCompanyResult } from '@/lib/api';
import { useCredits } from '@/hooks/useCredits';

interface SearchByCnpjDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyImported: () => void;
}

// Format CNPJ as user types
function formatCnpj(value: string): string {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

// Format phone number for display
function formatPhone(phone: string): string {
  if (!phone) return '';
  const numbers = phone.replace(/\D/g, '');
  if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  return phone;
}

export function SearchByCnpjDialog({ open, onOpenChange, onCompanyImported }: SearchByCnpjDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [result, setResult] = useState<SearchCompanyResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  
  const { toast } = useToast();
  const { balance, consumeCredits } = useCredits();

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    if (formatted.length <= 18) {
      setCnpj(formatted);
    }
  };

  const handleSearch = async () => {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'O CNPJ deve ter 14 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setImported(false);

    try {
      const response = await searchCompanyByCnpj(cleanCnpj);
      setResult(response.company);
      
      toast({
        title: 'Empresa encontrada!',
        description: response.company.fantasyName || response.company.name,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: error instanceof Error ? error.message : 'Não foi possível buscar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;
    
    // Check credits
    if (balance < 1) {
      toast({
        title: 'Créditos insuficientes',
        description: 'Você precisa de pelo menos 1 crédito para importar. Compre mais créditos.',
        variant: 'destructive',
      });
      return;
    }
    
    setImporting(true);

    try {
      // Consume 1 credit
      const success = await consumeCredits(1, `Importação: ${result.fantasyName || result.name}`);
      if (!success) {
        toast({
          title: 'Erro ao consumir crédito',
          description: 'Não foi possível descontar o crédito.',
          variant: 'destructive',
        });
        return;
      }

      await importCompanyFromSearch(result);
      setImported(true);
      toast({
        title: 'Empresa importada!',
        description: `${result.fantasyName || result.name} foi adicionada. 1 crédito consumido.`,
      });
      onCompanyImported();
    } catch (error) {
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Não foi possível importar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setCnpj('');
    setResult(null);
    setImported(false);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-strong border-border/50 max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            Buscar Empresa por CNPJ
          </DialogTitle>
          <DialogDescription>
            Digite o CNPJ da empresa para buscar seus dados completos
          </DialogDescription>
        </DialogHeader>

        {/* Search Form */}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              CNPJ
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={handleCnpjChange}
                onKeyDown={handleKeyDown}
                className="font-mono text-lg"
                autoFocus
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || cnpj.replace(/\D/g, '').length !== 14}
                className="gradient-primary"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Consulta os dados oficiais da Receita Federal em tempo real via CNPJá
            </p>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Coins className="h-3 w-3" />
            <span>Custo: 1 crédito para importar | Saldo: {balance}</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="border border-border/50 rounded-lg p-4 space-y-4 bg-card/50">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{result.fantasyName || result.name}</h3>
                </div>
                {result.fantasyName && (
                  <p className="text-sm text-muted-foreground">{result.name}</p>
                )}
                <p className="text-xs font-mono text-muted-foreground">
                  CNPJ: {formatCnpj(result.cnpj)}
                </p>
              </div>
              
              <Button
                size="sm"
                onClick={handleImport}
                disabled={importing || imported || balance < 1}
                className={imported ? 'bg-green-600 hover:bg-green-600' : 'gradient-primary'}
                title={balance < 1 ? 'Saldo insuficiente' : ''}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : imported ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Importada
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Importar
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{result.city}, {result.state}</span>
              </div>

              {/* CNAE */}
              {result.cnae && (
                <div>
                  <Badge variant="secondary" className="text-xs">
                    CNAE: {result.cnae}
                  </Badge>
                </div>
              )}

              {/* Phones */}
              {(result.phone1 || result.phone2) && (
                <div className="col-span-2 flex flex-wrap gap-2">
                  {result.phone1 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <PhoneIcon className="h-3 w-3" />
                      <span>{formatPhone(result.phone1)}</span>
                    </div>
                  )}
                  {result.phone2 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <PhoneIcon className="h-3 w-3" />
                      <span>{formatPhone(result.phone2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Email */}
              {result.email && (
                <div className="col-span-2 text-muted-foreground">
                  <span className="text-xs">Email: {result.email}</span>
                </div>
              )}

              {/* Address */}
              {result.address && (
                <div className="col-span-2 text-muted-foreground">
                  <span className="text-xs">
                    {result.address}, {result.number} - {result.neighborhood}, {result.cep}
                  </span>
                </div>
              )}

              {/* Additional info */}
              <div className="col-span-2 flex flex-wrap gap-2 pt-2 border-t border-border/50">
                {result.situacao && (
                  <Badge 
                    variant={result.situacao.toLowerCase().includes('ativ') ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {result.situacao}
                  </Badge>
                )}
                {result.porte && (
                  <Badge variant="outline" className="text-xs">
                    {result.porte}
                  </Badge>
                )}
                {result.naturezaJuridica && (
                  <Badge variant="outline" className="text-xs">
                    {result.naturezaJuridica}
                  </Badge>
                )}
                {result.simples === 'Sim' && (
                  <Badge variant="secondary" className="text-xs">
                    Simples Nacional
                  </Badge>
                )}
                {result.mei === 'Sim' && (
                  <Badge variant="secondary" className="text-xs">
                    MEI
                  </Badge>
                )}
              </div>

              {/* CNAE Description */}
              {result.cnaeDescription && (
                <div className="col-span-2 text-xs text-muted-foreground pt-2">
                  <strong>Atividade:</strong> {result.cnaeDescription}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
