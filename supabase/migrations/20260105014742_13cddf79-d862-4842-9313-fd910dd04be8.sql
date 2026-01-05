-- Recriar a função add_bonus_credits com verificação de admin
CREATE OR REPLACE FUNCTION public.add_bonus_credits(p_user_id uuid, p_amount integer, p_description text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_balance integer;
  v_caller_id uuid;
BEGIN
  -- Obter o ID do usuário que está chamando a função
  v_caller_id := auth.uid();
  
  -- IMPORTANTE: Verificar se quem está chamando é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_caller_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem adicionar créditos bônus';
  END IF;

  -- Update balance
  UPDATE user_credits 
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- If no record exists, create one
  IF v_new_balance IS NULL THEN
    INSERT INTO user_credits (user_id, balance)
    VALUES (p_user_id, p_amount)
    RETURNING balance INTO v_new_balance;
  END IF;
  
  -- Record transaction with audit info
  INSERT INTO credit_transactions (user_id, amount, type, description, reference_id)
  VALUES (p_user_id, p_amount, 'bonus', p_description, v_caller_id::text);
  
  -- Log audit event
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
  VALUES (v_caller_id, 'add_bonus_credits', 'user_credits', p_user_id::text, 
    jsonb_build_object('amount', p_amount, 'description', p_description, 'target_user', p_user_id));
  
  RETURN v_new_balance;
END;
$function$;

-- Também proteger a função decrement_credits para só permitir service_role ou o próprio usuário
CREATE OR REPLACE FUNCTION public.decrement_credits(p_user_id uuid, p_amount integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_balance integer;
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  
  -- Permitir apenas se for o próprio usuário ou admin
  IF v_caller_id != p_user_id AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_caller_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: você só pode decrementar seus próprios créditos';
  END IF;

  -- Decrementa o saldo de forma atômica e retorna o novo valor
  UPDATE user_credits 
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id 
    AND balance >= p_amount
  RETURNING balance INTO v_new_balance;
  
  -- Se não encontrou registro ou saldo insuficiente, retorna -1
  IF v_new_balance IS NULL THEN
    RETURN -1;
  END IF;
  
  RETURN v_new_balance;
END;
$function$;

-- Remover política que permite usuários inserirem seus próprios créditos (perigoso!)
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;

-- Criar políticas mais restritivas para user_credits
CREATE POLICY "Only system can insert credits" 
ON user_credits FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Only system can update credits" 
ON user_credits FOR UPDATE 
USING (false);

-- Remover política que permite usuários inserirem transações (deve ser via functions)
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;

-- Criar política restritiva para credit_transactions
CREATE POLICY "Only system can insert transactions" 
ON credit_transactions FOR INSERT 
WITH CHECK (false);