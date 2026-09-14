ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS extra_addresses text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS manual_balance numeric;