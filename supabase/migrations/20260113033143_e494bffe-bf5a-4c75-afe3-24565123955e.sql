-- Insert missing IN transactions for FUN TREASURY - BNB 2 wallet
-- These are dual-entries for CAMLY transfers from TRUST wallet to BNB 2 wallet
INSERT INTO transactions (wallet_id, tx_hash, block_number, timestamp, from_address, to_address, direction, token_address, token_symbol, amount, usd_value, gas_fee, status)
SELECT 
  '406516e5-2f79-4c25-abcd-16d6074b0db3' as wallet_id,
  t.tx_hash,
  t.block_number,
  t.timestamp,
  t.from_address,
  t.to_address,
  'IN' as direction,
  t.token_address,
  t.token_symbol,
  t.amount,
  t.usd_value,
  0 as gas_fee,
  'success' as status
FROM transactions t
WHERE t.direction = 'OUT'
AND t.token_symbol = 'CAMLY'
AND LOWER(t.to_address) = LOWER('0xc7260325fe39cd620198373c020adcf40ecef0a6')
AND NOT EXISTS (
  SELECT 1 FROM transactions t2 
  WHERE t2.tx_hash = t.tx_hash 
  AND t2.wallet_id = '406516e5-2f79-4c25-abcd-16d6074b0db3'
);