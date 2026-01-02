-- Create portfolio_snapshots table for tracking historical values
CREATE TABLE public.portfolio_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_usd_value NUMERIC NOT NULL DEFAULT 0,
  token_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Admins can manage snapshots
CREATE POLICY "Admins can manage portfolio_snapshots" 
ON public.portfolio_snapshots 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view snapshots
CREATE POLICY "Admins can view portfolio_snapshots" 
ON public.portfolio_snapshots 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster time-based queries
CREATE INDEX idx_portfolio_snapshots_created_at ON public.portfolio_snapshots(created_at DESC);