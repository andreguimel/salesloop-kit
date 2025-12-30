-- Adicionar coluna de CPF na tabela profiles
ALTER TABLE public.profiles ADD COLUMN cpf text;

-- Criar registro de créditos para usuários existentes que não têm
INSERT INTO public.user_credits (user_id, balance)
SELECT p.id, 10
FROM public.profiles p
LEFT JOIN public.user_credits uc ON uc.user_id = p.id
WHERE uc.id IS NULL;