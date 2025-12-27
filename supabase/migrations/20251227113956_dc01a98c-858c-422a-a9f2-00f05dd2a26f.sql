-- Drop existing public read policies and create admin-only policies

-- Wallets table
DROP POLICY IF EXISTS "Allow public read access to wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" 
ON public.wallets 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage wallets" 
ON public.wallets 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Transactions table
DROP POLICY IF EXISTS "Allow public read access to transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage transactions" 
ON public.transactions 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Tokens table
DROP POLICY IF EXISTS "Allow public read access to tokens" ON public.tokens;
CREATE POLICY "Admins can view all tokens" 
ON public.tokens 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tokens" 
ON public.tokens 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- tx_metadata table
DROP POLICY IF EXISTS "Allow public read access to tx_metadata" ON public.tx_metadata;
CREATE POLICY "Admins can view all tx_metadata" 
ON public.tx_metadata 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tx_metadata" 
ON public.tx_metadata 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- sync_state table
DROP POLICY IF EXISTS "Allow public read access to sync_state" ON public.sync_state;
CREATE POLICY "Admins can view all sync_state" 
ON public.sync_state 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sync_state" 
ON public.sync_state 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));