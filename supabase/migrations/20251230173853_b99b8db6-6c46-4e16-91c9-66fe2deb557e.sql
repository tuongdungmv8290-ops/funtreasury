-- Add unique constraint on wallet_id and symbol for tokens table
ALTER TABLE public.tokens 
ADD CONSTRAINT tokens_wallet_id_symbol_unique UNIQUE (wallet_id, symbol);