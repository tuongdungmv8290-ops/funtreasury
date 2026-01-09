-- Enable realtime for tokens table to auto-update UI when balances change
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;