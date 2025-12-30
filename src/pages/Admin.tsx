import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Coins, TrendingUp, Gift, RefreshCw, Shield, Search } from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading, users, loadingUsers, fetchUsers, addBonusCredits } = useAdmin();
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string | null; full_name: string | null } | null>(null);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusDescription, setBonusDescription] = useState('');
  const [addingBonus, setAddingBonus] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleAddBonus = async () => {
    if (!selectedUser || !bonusAmount || parseInt(bonusAmount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setAddingBonus(true);
    try {
      await addBonusCredits(
        selectedUser.id,
        parseInt(bonusAmount),
        bonusDescription || `Bônus administrativo`
      );
      toast.success(`${bonusAmount} créditos adicionados para ${selectedUser.email || selectedUser.full_name}`);
      setDialogOpen(false);
      setBonusAmount('');
      setBonusDescription('');
      setSelectedUser(null);
    } catch (error) {
      toast.error('Erro ao adicionar créditos');
    } finally {
      setAddingBonus(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const totalCreditsInCirculation = users.reduce((sum, u) => sum + u.balance, 0);
  const totalSpent = users.reduce((sum, u) => sum + u.total_spent, 0);
  const totalPurchased = users.reduce((sum, u) => sum + u.total_purchased, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-muted-foreground">Gerencie usuários e créditos</p>
            </div>
          </div>
          <Button onClick={fetchUsers} variant="outline" disabled={loadingUsers}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Total de Usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Créditos em Circulação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-warning" />
                <span className="text-2xl font-bold">{totalCreditsInCirculation.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Total Consumido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-destructive" />
                <span className="text-2xl font-bold">{totalSpent.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardDescription>Total Comprado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-success" />
                <span className="text-2xl font-bold">{totalPurchased.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="glass border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>Lista de todos os usuários e seus créditos</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/30">
                      <TableHead>Usuário</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Saldo Atual</TableHead>
                      <TableHead className="text-right">Consumido</TableHead>
                      <TableHead className="text-right">Comprado</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-secondary/20">
                          <TableCell>
                            <div>
                              <p className="font-medium">{u.full_name || 'Sem nome'}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(u.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={u.balance > 0 ? 'default' : 'secondary'}>
                              {u.balance.toLocaleString()} créditos
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {u.total_spent.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-success">
                            {u.total_purchased.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Dialog open={dialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                              setDialogOpen(open);
                              if (!open) setSelectedUser(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedUser(u)}
                                >
                                  <Gift className="h-4 w-4 mr-1" />
                                  Dar Bônus
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Adicionar Créditos Bônus</DialogTitle>
                                  <DialogDescription>
                                    Adicionar créditos para {u.email || u.full_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="amount">Quantidade de Créditos</Label>
                                    <Input
                                      id="amount"
                                      type="number"
                                      min="1"
                                      placeholder="Ex: 100"
                                      value={bonusAmount}
                                      onChange={(e) => setBonusAmount(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="description">Descrição (opcional)</Label>
                                    <Input
                                      id="description"
                                      placeholder="Ex: Bônus de parceria"
                                      value={bonusDescription}
                                      onChange={(e) => setBonusDescription(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={handleAddBonus} disabled={addingBonus}>
                                    {addingBonus ? 'Adicionando...' : 'Adicionar Créditos'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Admin;
