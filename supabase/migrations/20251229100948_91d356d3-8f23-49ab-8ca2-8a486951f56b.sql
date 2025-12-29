-- Create table to store token contract settings
CREATE TABLE public.token_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  contract_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.token_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all token_contracts" 
ON public.token_contracts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage token_contracts" 
ON public.token_contracts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_token_contracts_updated_at
BEFORE UPDATE ON public.token_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tokens
INSERT INTO public.token_contracts (symbol, name, contract_address) VALUES
  ('CAMLY', 'CAMLY COIN', NULL),
  ('USDT', 'Tether USD', NULL),
  ('BTCB', 'Bitcoin BEP20', NULL);