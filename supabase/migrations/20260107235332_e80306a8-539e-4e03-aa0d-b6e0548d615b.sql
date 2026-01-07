-- Drop the existing unique constraint on tx_hash alone
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_tx_hash_key;

-- Add a new composite unique constraint on (tx_hash, wallet_id)
-- This allows the same transaction to exist for multiple wallets
-- (e.g., when a transfer happens between two treasury wallets)
ALTER TABLE public.transactions ADD CONSTRAINT transactions_tx_hash_wallet_id_key UNIQUE (tx_hash, wallet_id);