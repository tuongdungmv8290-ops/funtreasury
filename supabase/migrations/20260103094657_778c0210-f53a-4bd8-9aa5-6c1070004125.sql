-- Create transaction_alerts table for alert configurations
CREATE TABLE public.transaction_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  threshold_usd NUMERIC NOT NULL DEFAULT 100, -- Alert if tx > $100
  direction TEXT NOT NULL DEFAULT 'all', -- 'in', 'out', 'all'
  token_symbol TEXT, -- NULL = all tokens, or specific like 'CAMLY'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage transaction_alerts"
ON public.transaction_alerts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_transaction_alerts_updated_at
BEFORE UPDATE ON public.transaction_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default alert config
INSERT INTO public.transaction_alerts (enabled, threshold_usd, direction, token_symbol)
VALUES (true, 100, 'all', NULL);