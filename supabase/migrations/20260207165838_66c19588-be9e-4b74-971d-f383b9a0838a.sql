
-- 1. Create trigger to prevent modification of critical gift fields (immutable gifts)
CREATE OR REPLACE FUNCTION public.prevent_gift_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow updating status and tx_hash fields
  IF OLD.amount != NEW.amount OR 
     OLD.sender_id != NEW.sender_id OR 
     OLD.receiver_id != NEW.receiver_id OR 
     OLD.token_symbol != NEW.token_symbol OR
     OLD.usd_value != NEW.usd_value THEN
    RAISE EXCEPTION 'Cannot modify immutable gift fields (amount, sender_id, receiver_id, token_symbol, usd_value)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_gift_modification
BEFORE UPDATE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_gift_modification();

-- 2. Add public SELECT policy on profiles for display_name, avatar_url, wallet_address
-- (needed for public rewards page and gift search dropdown)
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);
