import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X, ArrowUpDown, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchFilters, PipelineStage, Company } from '@/types';
import { fetchPipelineStages } from '@/lib/crm-api';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  companies?: Company[];
}

const defaultFilters: SearchFilters = {
  cnae: '',
  city: '',
  segment: '',
  name: '',
  enrichmentStatus: 'all',
  crmStageId: '',
  sortBy: 'newest',
};

export function SearchForm({ onSearch, isLoading, companies = [] }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const data = await fetchPipelineStages();
      setStages(data);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  // Extract unique cities and segments from actual data
  const uniqueCities = useMemo(() => {
    const cities = companies.map(c => c.city).filter(Boolean);
    return [...new Set(cities)].sort();
  }, [companies]);

  const uniqueSegments = useMemo(() => {
    const segments = companies.map(c => c.segment).filter(Boolean);
    return [...new Set(segments)].sort();
  }, [companies]);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    onSearch(defaultFilters);
  };

  const hasFilters = filters.cnae || filters.city || filters.segment || filters.name || 
    filters.enrichmentStatus !== 'all' || filters.crmStageId || filters.sortBy !== 'newest';

  return (
    <div className="p-4 md:p-5 rounded-xl border border-border/30 bg-secondary/30 animate-fade-up space-y-4" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">Filtrar resultados</h3>
      </div>
      
      {/* Primary filters */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Search className="h-3 w-3 inline mr-1" />
            Nome da Empresa
          </Label>
          <Input
            id="name"
            placeholder="Buscar por nome..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="h-10 md:h-11 bg-secondary/50 border-border/50 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnae" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            CNAE
          </Label>
          <Input
            id="cnae"
            placeholder="Ex: 6201-5/01"
            value={filters.cnae}
            onChange={(e) => setFilters({ ...filters, cnae: e.target.value })}
            className="h-10 md:h-11 bg-secondary/50 border-border/50 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Cidade
          </Label>
          <Select
            value={filters.city || '_all'}
            onValueChange={(value) => setFilters({ ...filters, city: value === '_all' ? '' : value })}
          >
            <SelectTrigger className="h-10 md:h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              <SelectItem value="_all">Todas ({uniqueCities.length})</SelectItem>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Segmento
          </Label>
          <Select
            value={filters.segment || '_all'}
            onValueChange={(value) => setFilters({ ...filters, segment: value === '_all' ? '' : value })}
          >
            <SelectTrigger className="h-10 md:h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border max-h-60">
              <SelectItem value="_all">Todos ({uniqueSegments.length})</SelectItem>
              {uniqueSegments.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Secondary filters */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Status Enriquecimento
          </Label>
          <Select
            value={filters.enrichmentStatus}
            onValueChange={(value: 'all' | 'enriched' | 'not_enriched') => 
              setFilters({ ...filters, enrichmentStatus: value })
            }
          >
            <SelectTrigger className="h-10 md:h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="enriched">Enriquecido</SelectItem>
              <SelectItem value="not_enriched">Não enriquecido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Target className="h-3 w-3 inline mr-1" />
            Estágio CRM
          </Label>
          <Select
            value={filters.crmStageId || '_all'}
            onValueChange={(value) => setFilters({ ...filters, crmStageId: value === '_all' ? '' : value })}
          >
            <SelectTrigger className="h-10 md:h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Todos os estágios" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="_all">Todos os estágios</SelectItem>
              <SelectItem value="none">Sem estágio</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <ArrowUpDown className="h-3 w-3 inline mr-1" />
            Ordenar por
          </Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value: SearchFilters['sortBy']) => 
              setFilters({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger className="h-10 md:h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Mais recentes" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="name_asc">Nome A-Z</SelectItem>
              <SelectItem value="name_desc">Nome Z-A</SelectItem>
              <SelectItem value="city_asc">Cidade A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button 
            onClick={handleSearch} 
            variant="secondary"
            className="flex-1 h-10 md:h-11 gap-2 text-sm"
            disabled={isLoading}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{isLoading ? 'Filtrando...' : 'Filtrar'}</span>
          </Button>
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClear}
              className="h-10 md:h-11 w-10 md:w-11 text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
