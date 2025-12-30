import { Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface EnrichmentRateCardProps {
  enriched: number;
  total: number;
}

export function EnrichmentRateCard({ enriched, total }: EnrichmentRateCardProps) {
  const rate = total > 0 ? Math.round((enriched / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Taxa de Enriquecimento</span>
        </div>
        <span className="text-2xl font-bold text-gradient">{rate}%</span>
      </div>
      <Progress value={rate} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{enriched} enriquecidas</span>
        <span>{total - enriched} pendentes</span>
      </div>
    </div>
  );
}
