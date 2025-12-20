import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="border-border/50 shadow-sm animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-primary" />
          Buscar Empresas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="cnae" className="text-sm font-medium">
              CNAE
            </Label>
            <Input
              id="cnae"
              placeholder="Ex: 6201-5/01"
              value={filters.cnae}
              onChange={(e) => setFilters({ ...filters, cnae: e.target.value })}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              Cidade
            </Label>
            <Select
              value={filters.city}
              onValueChange={(value) => setFilters({ ...filters, city: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment" className="text-sm font-medium">
              Segmento
            </Label>
            <Select
              value={filters.segment}
              onValueChange={(value) => setFilters({ ...filters, segment: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
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
              className="flex-1 h-10 gap-2"
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
                className="h-10 w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
