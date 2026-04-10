CREATE OR REPLACE FUNCTION public.find_duplicate_transactions()
 RETURNS TABLE(tx_hash text, count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT tx_hash, COUNT(*) as count
  FROM public.transactions
  GROUP BY tx_hash, wallet_id
  HAVING COUNT(*) > 1
$function$;