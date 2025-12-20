import { Send, Clock, AlertTriangle, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Company } from '@/types';

interface MessageStatusBadgeProps {
  status: Company['messageStatus'];
}

const statusConfig = {
  sent: {
    label: 'Enviado',
    icon: Send,
    variant: 'sent' as const,
  },
  pending: {
    label: 'Pendente',
    icon: Clock,
    variant: 'pending' as const,
  },
  not_delivered: {
    label: 'Não Entregue',
    icon: AlertTriangle,
    variant: 'not_delivered' as const,
  },
  none: {
    label: 'Não Enviado',
    icon: Minus,
    variant: 'secondary' as const,
  },
};

export function MessageStatusBadge({ status = 'none' }: MessageStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 font-medium">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
