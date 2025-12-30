import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isHuman, setIsHuman] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    try {
      if (isResetPassword) {
        resetPasswordSchema.parse({ email });
      } else if (isSignUp) {
        signUpSchema.parse({ email, password, fullName });
      } else {
        signInSchema.parse({ email, password });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setIsResetPassword(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Não foi possível enviar o email de recuperação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isResetPassword) {
      await handleResetPassword();
      return;
    }

    if (!isHuman) {
      toast({
        title: 'Verificação necessária',
        description: 'Por favor, confirme que você não é um robô.',
        variant: 'destructive',
      });
      return;
    }

    if (isSignUp && !acceptedTerms) {
      toast({
        title: 'Termos não aceitos',
        description: 'Você precisa aceitar os Termos de Uso e Política de Privacidade para criar uma conta.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Usuário já existe',
              description: 'Este email já está cadastrado. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao criar conta',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Conta criada!',
            description: 'Bem-vindo ao Achei Leads!',
          });
          navigate('/dashboard');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Credenciais inválidas',
              description: 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao entrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Bem-vindo de volta!',
            description: 'Login realizado com sucesso.',
          });
          navigate('/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 animate-fade-up hover:opacity-80 transition-opacity cursor-pointer">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary glow-primary">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Achei Leads</h1>
          </div>
        </Link>

        {/* Auth Card */}
        <div className="glass rounded-2xl p-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <div className="text-center mb-8">
            {isResetPassword && (
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(false);
                  setErrors({});
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            <h2 className="text-2xl font-bold mb-2">
              {isResetPassword 
                ? 'Recuperar Senha' 
                : isSignUp 
                  ? 'Criar Conta' 
                  : 'Entrar'}
            </h2>
            <p className="text-muted-foreground">
              {isResetPassword
                ? 'Digite seu email para receber o link de recuperação'
                : isSignUp 
                  ? 'Comece a prospectar clientes hoje' 
                  : 'Acesse sua conta para continuar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && !isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 bg-secondary/50 border-border/50"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-secondary/50 border-border/50"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-secondary/50 border-border/50"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {!isSignUp && !isResetPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(true);
                    setErrors({});
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {!isResetPassword && (
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border/50 bg-secondary/30">
                <Checkbox
                  id="not-robot"
                  checked={isHuman}
                  onCheckedChange={(checked) => setIsHuman(checked === true)}
                  className="h-5 w-5"
                />
                <label
                  htmlFor="not-robot"
                  className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none"
                >
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Não sou um robô
                </label>
              </div>
            )}

            {isSignUp && !isResetPassword && (
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border/50 bg-secondary/30">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="h-5 w-5 mt-0.5"
                />
                <label
                  htmlFor="accept-terms"
                  className="text-sm cursor-pointer select-none leading-relaxed"
                >
                  Li e aceito os{' '}
                  <Link 
                    to="/termos-de-uso" 
                    target="_blank" 
                    className="text-primary hover:underline font-medium"
                  >
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link 
                    to="/politica-privacidade" 
                    target="_blank" 
                    className="text-primary hover:underline font-medium"
                  >
                    Política de Privacidade
                  </Link>
                </label>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gap-2 font-semibold gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isResetPassword 
                    ? 'Enviar Email' 
                    : isSignUp 
                      ? 'Criar Conta' 
                      : 'Entrar'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {!isResetPassword && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp 
                  ? 'Já tem uma conta? Entrar' 
                  : 'Não tem uma conta? Criar conta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
