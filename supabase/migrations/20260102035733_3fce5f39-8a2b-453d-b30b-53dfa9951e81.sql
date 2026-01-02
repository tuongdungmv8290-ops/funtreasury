-- Create function to find duplicate transactions by tx_hash
CREATE OR REPLACE FUNCTION public.find_duplicate_transactions()
RETURNS TABLE(tx_hash text, count bigint) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tx_hash, COUNT(*) as count
  FROM public.transactions
  GROUP BY tx_hash
  HAVING COUNT(*) > 1
$$;