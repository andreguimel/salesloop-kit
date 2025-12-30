import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreditTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'consumption' | 'bonus' | 'refund';
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

interface CreditPackage {
  id: string;
  name: string;
  price_brl: number;
  credits: number;
  bonus_credits: number;
  position: number;
}

export function useCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);

  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // User might not have credits record yet
        if (error.code === 'PGRST116') {
          setBalance(0);
        } else {
          console.error('Error fetching credits:', error);
        }
      } else {
        setBalance(data?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user]);

  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        setPackages(data || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  }, []);

  const consumeCredits = useCallback(async (amount: number, description: string, referenceId?: string): Promise<boolean> => {
    if (!user) return false;
    if (balance < amount) return false;

    try {
      // Update balance
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ balance: balance - amount })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return false;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'consumption' as const,
          description,
          reference_id: referenceId || null,
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
      }

      // Update local state
      setBalance(prev => prev - amount);
      
      return true;
    } catch (error) {
      console.error('Error consuming credits:', error);
      return false;
    }
  }, [user, balance]);

  interface CheckoutResult {
    success: boolean;
    error?: string;
    pixId?: string;
    brCode?: string;
    brCodeBase64?: string;
    amount?: number;
    expiresAt?: string;
    packageName?: string;
    totalCredits?: number;
  }

  const createCheckout = useCallback(async (packageId: string): Promise<CheckoutResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { packageId },
      });

      if (error) {
        console.error('Checkout error:', error);
        return { success: false, error: error.message };
      }

      if (data?.error) {
        return { success: false, error: data.error };
      }

      return { 
        success: true, 
        pixId: data.pixId,
        brCode: data.brCode,
        brCodeBase64: data.brCodeBase64,
        amount: data.amount,
        expiresAt: data.expiresAt,
        packageName: data.packageName,
        totalCredits: data.totalCredits,
      };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, error: 'Erro ao criar checkout' };
    }
  }, []);

  // Fetch balance on mount and when user changes
  useEffect(() => {
    fetchBalance();
    fetchPackages();
  }, [fetchBalance, fetchPackages]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_credits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Credits changed:', payload);
          if (payload.new && 'balance' in payload.new) {
            setBalance(payload.new.balance as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    balance,
    loading,
    transactions,
    packages,
    fetchBalance,
    fetchTransactions,
    fetchPackages,
    consumeCredits,
    createCheckout,
    isLow: balance <= 20 && balance > 5,
    isCritical: balance <= 5,
    hasCredits: balance > 0,
  };
}
