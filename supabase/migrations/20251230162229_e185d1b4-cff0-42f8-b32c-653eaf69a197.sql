-- Criar tabela de saldo de créditos do usuário
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar enum para tipos de transação
CREATE TYPE public.credit_transaction_type AS ENUM ('purchase', 'consumption', 'bonus', 'refund');

-- Criar tabela de transações de créditos
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type credit_transaction_type NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pacotes de créditos
CREATE TABLE public.credit_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_brl NUMERIC NOT NULL,
  credits INTEGER NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

-- RLS para user_credits
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
ON public.user_credits
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS para credit_transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS para credit_packages (público para leitura)
CREATE POLICY "Anyone can view active packages"
ON public.credit_packages
FOR SELECT
USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir pacotes padrão
INSERT INTO public.credit_packages (name, price_brl, credits, bonus_credits, position) VALUES
('Starter', 25, 100, 0, 1),
('Pro', 50, 200, 30, 2),
('Business', 100, 400, 100, 3),
('Agency', 300, 1200, 500, 4);

-- Modificar função handle_new_user para criar créditos iniciais
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Criar saldo inicial de créditos (10 grátis)
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 10);
  
  -- Registrar transação de bônus
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 10, 'bonus', 'Bônus de boas-vindas - 10 créditos grátis');
  
  RETURN NEW;
END;
$$;