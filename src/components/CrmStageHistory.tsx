import { useState, useEffect } from 'react';
import { ArrowRight, History, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StageHistoryEntry {
  id: string;
  from_stage_name: string | null;
  to_stage_name: string | null;
  changed_at: string;
  notes: string | null;
}

interface CrmStageHistoryProps {
  companyId: string;
}

export const CrmStageHistory = ({ companyId }: CrmStageHistoryProps) => {
  const [history, setHistory] = useState<StageHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [companyId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('crm_stage_history')
        .select('id, from_stage_name, to_stage_name, changed_at, notes')
        .eq('company_id', companyId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading stage history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass animate-fade-up" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico do Kanban
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass animate-fade-up" style={{ animationDelay: '200ms' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico do Kanban
        </CardTitle>
        <CardDescription>
          {history.length} movimentaç{history.length !== 1 ? 'ões' : 'ão'} registrada{history.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((entry) => (
              <div 
                key={entry.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border/30 space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.from_stage_name ? (
                      <Badge variant="outline" className="text-xs">
                        {entry.from_stage_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Sem estágio
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {entry.to_stage_name ? (
                      <Badge className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                        {entry.to_stage_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Removido do Kanban
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                
                {entry.notes && (
                  <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded border border-border/20">
                    {entry.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nenhuma movimentação registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
