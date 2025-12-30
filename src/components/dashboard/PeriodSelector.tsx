import { Button } from '@/components/ui/button';

interface PeriodSelectorProps {
  period: number;
  onPeriodChange: (days: number) => void;
}

const periods = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export function PeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? 'default' : 'ghost'}
          size="sm"
          className={`text-xs h-7 ${period === p.value ? 'gradient-primary' : ''}`}
          onClick={() => onPeriodChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
