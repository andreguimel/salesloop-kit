import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Phone } from '@/types';

interface PhoneStatusBadgeProps {
  phone: Phone;
  showNumber?: boolean;
}

const statusConfig = {
  valid: {
    label: 'Válido',
    icon: CheckCircle2,
    variant: 'valid' as const,
  },
  uncertain: {
    label: 'Incerto',
    icon: AlertCircle,
    variant: 'uncertain' as const,
  },
  invalid: {
    label: 'Inválido',
    icon: XCircle,
    variant: 'invalid' as const,
  },
  pending: {
    label: 'Pendente',
    icon: Clock,
    variant: 'pending' as const,
  },
};

export function PhoneStatusBadge({ phone, showNumber = true }: PhoneStatusBadgeProps) {
  const config = statusConfig[phone.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      {showNumber && (
        <span className="text-sm font-medium text-foreground">{phone.number}</span>
      )}
      <Badge variant={config.variant} className="gap-1 font-medium">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    </div>
  );
}
