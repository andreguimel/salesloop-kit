import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OverdueTask {
  id: string;
  companyId: string;
  activityType: string;
  title: string;
  description?: string;
  dueDate: string;
  companyName?: string;
}

export function useOverdueTasks() {
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOverdueTasks();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchOverdueTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverdueTasks = async () => {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('crm_activities')
        .select(`
          *,
          companies (
            id,
            name,
            city,
            state
          )
        `)
        .eq('is_completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', now)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching overdue tasks:', error);
        return;
      }

      const tasks: OverdueTask[] = (data || []).map(activity => ({
        id: activity.id,
        companyId: activity.company_id,
        activityType: activity.activity_type,
        title: activity.title,
        description: activity.description || undefined,
        dueDate: activity.due_date!,
        companyName: activity.companies?.name,
      }));

      setOverdueTasks(tasks);

      setOverdueTasks(tasks);
      setCount(tasks.length);
    } catch (error) {
      console.error('Error in fetchOverdueTasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    fetchOverdueTasks();
  };

  return { overdueTasks, count, isLoading, refresh };
}
