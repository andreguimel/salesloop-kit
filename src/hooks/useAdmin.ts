import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserWithCredits {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  balance: number;
  total_spent: number;
  total_purchased: number;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithCredits[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setLoadingUsers(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all credits
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('user_id, balance');

      if (creditsError) throw creditsError;

      // Fetch all transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('user_id, amount, type');

      if (transactionsError) throw transactionsError;

      // Map credits and transactions to users
      const usersWithCredits: UserWithCredits[] = (profiles || []).map(profile => {
        const userCredits = credits?.find(c => c.user_id === profile.id);
        const userTransactions = transactions?.filter(t => t.user_id === profile.id) || [];
        
        const total_spent = userTransactions
          .filter(t => t.type === 'consumption')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const total_purchased = userTransactions
          .filter(t => t.type === 'purchase')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          balance: userCredits?.balance || 0,
          total_spent,
          total_purchased,
        };
      });

      setUsers(usersWithCredits);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const addBonusCredits = async (userId: string, amount: number, description: string) => {
    const { data, error } = await supabase.rpc('add_bonus_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description
    });

    if (error) {
      console.error('Error adding bonus credits:', error);
      throw error;
    }

    // Refresh users list
    await fetchUsers();
    return data;
  };

  return {
    isAdmin,
    loading,
    users,
    loadingUsers,
    fetchUsers,
    addBonusCredits,
  };
};
