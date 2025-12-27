-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'BNB',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tokens table
CREATE TABLE public.tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  usd_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
  token_symbol TEXT NOT NULL,
  token_address TEXT,
  amount NUMERIC NOT NULL,
  usd_value NUMERIC NOT NULL DEFAULT 0,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  gas_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tx_metadata table for editable fields (category, notes, tags)
CREATE TABLE public.tx_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE UNIQUE,
  category TEXT,
  note TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sync_state table to track sync progress
CREATE TABLE public.sync_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE UNIQUE,
  last_block_synced BIGINT NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tx_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for now, will add auth later in Checkpoint 2)
CREATE POLICY "Allow public read access to wallets"
  ON public.wallets FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tokens"
  ON public.tokens FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to transactions"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tx_metadata"
  ON public.tx_metadata FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to sync_state"
  ON public.sync_state FOR SELECT
  USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_tokens_wallet_id ON public.tokens(wallet_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX idx_transactions_tx_hash ON public.transactions(tx_hash);
CREATE INDEX idx_tx_metadata_transaction_id ON public.tx_metadata(transaction_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON public.tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tx_metadata_updated_at
  BEFORE UPDATE ON public.tx_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_state_updated_at
  BEFORE UPDATE ON public.sync_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();