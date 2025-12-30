import { useState, useEffect } from 'react';
import { History as HistoryIcon, Building2, Phone, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface HistoryItem {
  id: string;
  company_name: string;
  phone_number: string;
  action: string;
  created_at: string;
}

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent phone validations and company additions
      const { data: phones, error } = await supabase
        .from('company_phones')
        .select(`
          id,
          phone_number,
          status,
          created_at,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const historyItems: HistoryItem[] = (phones || []).map((p: any) => ({
        id: p.id,
        company_name: p.companies?.name || 'Empresa',
        phone_number: p.phone_number,
        action: p.status === 'pending' ? 'Telefone adicionado' : `Telefone validado (${p.status})`,
        created_at: p.created_at,
      }));

      setHistory(historyItems);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Erro ao carregar histórico',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="space-y-3 animate-fade-up">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Histórico
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Acompanhe as atividades recentes da sua prospecção.
        </p>
      </div>

      {/* History List */}
      <div className="rounded-2xl glass overflow-hidden animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="p-5 border-b border-border/50 flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-primary">
            <HistoryIcon className="h-4 w-4 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Atividades Recentes</h3>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center">
            <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {history.map((item, index) => (
              <div 
                key={item.id}
                className="p-4 hover:bg-secondary/20 transition-colors animate-fade-up"
                style={{ animationDelay: `${150 + index * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-secondary mt-0.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{item.company_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span className="font-mono">{formatPhone(item.phone_number)}</span>
                      </div>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {item.action}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
