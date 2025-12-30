-- Criar função para decrementar créditos de forma atômica
CREATE OR REPLACE FUNCTION public.decrement_credits(p_user_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
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
$$;