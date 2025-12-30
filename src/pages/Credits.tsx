import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Coins, Gift, Star, Zap, Building2, Check, ArrowRight, Clock, TrendingUp, Copy, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const packageIcons: Record<string, typeof Zap> = {
  Starter: Zap,
  Pro: Star,
  Business: Building2,
  Agency: TrendingUp,
};

const packageColors: Record<string, string> = {
  Starter: "from-blue-500 to-blue-600",
  Pro: "from-purple-500 to-purple-600",
  Business: "from-emerald-500 to-emerald-600",
  Agency: "from-orange-500 to-orange-600",
};

interface PixData {
  pixId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt: string;
  packageName: string;
  totalCredits: number;
}

export default function Credits() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    balance, 
    loading, 
    packages, 
    transactions, 
    fetchTransactions, 
    createCheckout,
    isLow,
    isCritical,
  } = useCredits();
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null);
  const [pixDialogOpen, setPixDialogOpen] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("Pagamento confirmado! Seus créditos serão adicionados em instantes.");
      navigate("/creditos", { replace: true });
    } else if (status === "pending") {
      toast.info("Aguardando confirmação do pagamento...");
      navigate("/creditos", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleBuyPackage = async (packageId: string) => {
    setLoadingPackage(packageId);
    try {
      const result = await createCheckout(packageId);
      if (result.success && result.brCode && result.brCodeBase64) {
        setPixData({
          pixId: result.pixId!,
          brCode: result.brCode,
          brCodeBase64: result.brCodeBase64,
          amount: result.amount!,
          expiresAt: result.expiresAt!,
          packageName: result.packageName!,
          totalCredits: result.totalCredits!,
        });
        setPixDialogOpen(true);
      } else {
        toast.error(result.error || "Erro ao criar checkout");
      }
    } catch (error) {
      toast.error("Erro ao processar compra");
    } finally {
      setLoadingPackage(null);
    }
  };

  const handleCopyBrCode = async () => {
    if (!pixData?.brCode) return;
    
    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const getCostPerLead = (pkg: typeof packages[0]) => {
    const totalCredits = pkg.credits + pkg.bonus_credits;
    return (pkg.price_brl / totalCredits).toFixed(2);
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; className: string }> = {
      purchase: { text: "Compra", className: "bg-emerald-500/20 text-emerald-500" },
      consumption: { text: "Consumo", className: "bg-red-500/20 text-red-500" },
      bonus: { text: "Bônus", className: "bg-purple-500/20 text-purple-500" },
      refund: { text: "Reembolso", className: "bg-blue-500/20 text-blue-500" },
    };
    return labels[type] || { text: type, className: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Créditos</h1>
          <p className="text-muted-foreground">
            Gerencie seus créditos e compre mais para continuar prospectando
          </p>
        </div>
        
        {/* Current Balance Card */}
        <Card className={cn(
          "min-w-[200px]",
          isCritical && "border-destructive/50 bg-destructive/5",
          isLow && !isCritical && "border-yellow-500/50 bg-yellow-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isCritical ? "bg-destructive/20" : isLow ? "bg-yellow-500/20" : "bg-emerald-500/20"
              )}>
                <Coins className={cn(
                  "h-6 w-6",
                  isCritical ? "text-destructive" : isLow ? "text-yellow-500" : "text-emerald-500"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo atual</p>
                <p className="text-2xl font-bold">{loading ? "..." : balance}</p>
              </div>
            </div>
            {isCritical && (
              <p className="text-xs text-destructive mt-2">
                ⚠️ Saldo crítico! Compre mais créditos.
              </p>
            )}
            {isLow && !isCritical && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                ⚠️ Saldo baixo. Considere recarregar.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Comprar Créditos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          {/* Free Trial Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">🎁 Ganhe 10 créditos grátis ao se cadastrar</h3>
                  <p className="text-sm text-muted-foreground">
                    Consulte empresas reais antes de comprar qualquer pacote
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => {
              const Icon = packageIcons[pkg.name] || Zap;
              const gradientClass = packageColors[pkg.name] || "from-blue-500 to-blue-600";
              const isPopular = pkg.name === "Pro";
              const totalCredits = pkg.credits + pkg.bonus_credits;

              return (
                <Card 
                  key={pkg.id} 
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg",
                    isPopular && "ring-2 ring-primary"
                  )}
                >
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MAIS VENDIDO
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                      gradientClass
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="mt-4">{pkg.name}</CardTitle>
                    <CardDescription>
                      {pkg.name === "Starter" && "Ideal para teste real"}
                      {pkg.name === "Pro" && "Melhor custo-benefício"}
                      {pkg.name === "Business" && "Para agências e SDRs"}
                      {pkg.name === "Agency" && "Alto volume"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">R$ {pkg.price_brl}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        R$ {getCostPerLead(pkg)} por lead
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">{pkg.credits} créditos</span>
                      </div>
                      {pkg.bonus_credits > 0 && (
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            +{pkg.bonus_credits} bônus
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">{totalCredits} total</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleBuyPackage(pkg.id)}
                      disabled={loadingPackage === pkg.id}
                    >
                      {loadingPackage === pkg.id ? (
                        "Processando..."
                      ) : (
                        <>
                          Comprar <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Como funcionam os créditos?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Coins className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">1 crédito = 1 empresa</p>
                    <p className="text-sm text-muted-foreground">
                      Cada empresa importada consome 1 crédito
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Check className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">Sem resultado = Sem cobrança</p>
                    <p className="text-sm text-muted-foreground">
                      Buscas sem resultados não descontam créditos
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Clock className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Créditos não expiram</p>
                    <p className="text-sm text-muted-foreground">
                      Use quando quiser, sem prazo de validade
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as suas transações de créditos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Créditos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const typeInfo = getTransactionTypeLabel(transaction.type);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={typeInfo.className}>
                              {typeInfo.text}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.description || "-"}</TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            transaction.amount > 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PIX QR Code Dialog */}
      <Dialog open={pixDialogOpen} onOpenChange={setPixDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Pagamento PIX
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code ou copie o código PIX para pagar
            </DialogDescription>
          </DialogHeader>
          
          {pixData && (
            <div className="space-y-4">
              {/* Package Info */}
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Pacote {pixData.packageName}</p>
                <p className="text-2xl font-bold">R$ {pixData.amount.toFixed(2)}</p>
                <p className="text-sm text-primary">{pixData.totalCredits} créditos</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-4">
                  <img 
                    src={pixData.brCodeBase64} 
                    alt="QR Code PIX" 
                    className="h-48 w-48"
                  />
                </div>
              </div>

              {/* Copy Code Button */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleCopyBrCode}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                      Código copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código PIX
                    </>
                  )}
                </Button>
                
                {/* Expiration Info */}
                <p className="text-xs text-center text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  O código expira em 1 hora
                </p>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Como pagar:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escaneie o QR Code ou cole o código PIX</li>
                  <li>Confirme o pagamento</li>
                  <li>Seus créditos serão adicionados automaticamente!</li>
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
