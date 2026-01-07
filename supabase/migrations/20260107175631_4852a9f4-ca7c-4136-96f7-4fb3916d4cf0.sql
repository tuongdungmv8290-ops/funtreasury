-- Add Public Read Access for Treasury Transparency
-- Allow anonymous/public users to SELECT data from treasury tables

-- 1. wallets - Public can view all wallets
CREATE POLICY "Public can view wallets" 
ON public.wallets 
FOR SELECT 
USING (true);

-- 2. tokens - Public can view all token balances
CREATE POLICY "Public can view tokens" 
ON public.tokens 
FOR SELECT 
USING (true);

-- 3. transactions - Public can view all transactions
CREATE POLICY "Public can view transactions" 
ON public.transactions 
FOR SELECT 
USING (true);

-- 4. portfolio_snapshots - Public can view portfolio history
CREATE POLICY "Public can view portfolio_snapshots" 
ON public.portfolio_snapshots 
FOR SELECT 
USING (true);

-- 5. token_contracts - Public can view token contracts
CREATE POLICY "Public can view token_contracts" 
ON public.token_contracts 
FOR SELECT 
USING (true);

-- 6. tx_metadata - Public can view transaction metadata (notes, categories, tags)
CREATE POLICY "Public can view tx_metadata" 
ON public.tx_metadata 
FOR SELECT 
USING (true);