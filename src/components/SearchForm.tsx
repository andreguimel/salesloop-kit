import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
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
import { SearchFilters } from '@/types';
import { segments, cities } from '@/data/mockData';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    cnae: '',
    city: '',
    segment: '',
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({ cnae: '', city: '', segment: '' });
  };

  const hasFilters = filters.cnae || filters.city || filters.segment;

  return (
    <div className="p-6 rounded-2xl glass animate-fade-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-primary">
          <SlidersHorizontal className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Filtros de Busca</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="cnae" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            CNAE
          </Label>
          <Input
            id="cnae"
            placeholder="Ex: 6201-5/01"
            value={filters.cnae}
            onChange={(e) => setFilters({ ...filters, cnae: e.target.value })}
            className="h-11 bg-secondary/50 border-border/50 focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Cidade
          </Label>
          <Select
            value={filters.city}
            onValueChange={(value) => setFilters({ ...filters, city: value })}
          >
            <SelectTrigger className="h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {cities.map((city) => (
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
            value={filters.segment}
            onValueChange={(value) => setFilters({ ...filters, segment: value })}
          >
            <SelectTrigger className="h-11 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {segments.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button 
            onClick={handleSearch} 
            className="flex-1 h-11 gap-2 gradient-primary hover:opacity-90 transition-opacity font-semibold"
            disabled={isLoading}
          >
            <Search className="h-4 w-4" />
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
          {hasFilters && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleClear}
              className="h-11 w-11 border-border/50 hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
