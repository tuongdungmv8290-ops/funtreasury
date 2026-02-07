
CREATE TABLE public.camly_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_name TEXT,
  amount NUMERIC NOT NULL,
  usd_value NUMERIC DEFAULT 0,
  tx_hash TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.camly_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transfers" ON public.camly_transfers FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert" ON public.camly_transfers FOR INSERT TO authenticated WITH CHECK (true);
