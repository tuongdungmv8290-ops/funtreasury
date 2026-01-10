-- ============================================================
-- FIX MISSING DUAL-ENTRY TRANSACTIONS
-- When TRUST sends to BNB2, we need both:
--   1. TRUST wallet: OUT transaction (already exists)
--   2. BNB2 wallet: IN transaction (MISSING - this migration adds it)
-- ============================================================

-- Wallet IDs reference:
-- BNB 2 (0xc726...): 406516e5-2f79-4c25-abcd-16d6074b0db3
-- TRUST (0x35c5...): 11111111-1111-1111-1111-111111111111
-- FUN TREASURY (0x609a...): 22222222-2222-2222-2222-222222222222

-- Step 1: Insert missing IN transactions for BNB 2 wallet
-- (transactions where BNB2 is the recipient but only has entry from sender's wallet)
INSERT INTO transactions (
  wallet_id, tx_hash, block_number, timestamp, from_address, to_address,
  direction, token_address, token_symbol, amount, usd_value, gas_fee, status
)
SELECT 
  '406516e5-2f79-4c25-abcd-16d6074b0db3' as wallet_id,
  t.tx_hash, t.block_number, t.timestamp, t.from_address, t.to_address,
  'IN' as direction, t.token_address, t.token_symbol, t.amount, t.usd_value, t.gas_fee, t.status
FROM transactions t
WHERE LOWER(t.to_address) = LOWER('0xc7260325fE39cD620198373c020Adcf40ECeF0A6')
  AND t.wallet_id != '406516e5-2f79-4c25-abcd-16d6074b0db3'
  AND t.direction = 'OUT'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.tx_hash = t.tx_hash 
      AND t2.wallet_id = '406516e5-2f79-4c25-abcd-16d6074b0db3'
  );

-- Step 2: Insert missing IN transactions for TRUST wallet  
-- (transactions where TRUST is the recipient but only has entry from sender's wallet)
INSERT INTO transactions (
  wallet_id, tx_hash, block_number, timestamp, from_address, to_address,
  direction, token_address, token_symbol, amount, usd_value, gas_fee, status
)
SELECT 
  '11111111-1111-1111-1111-111111111111' as wallet_id,
  t.tx_hash, t.block_number, t.timestamp, t.from_address, t.to_address,
  'IN' as direction, t.token_address, t.token_symbol, t.amount, t.usd_value, t.gas_fee, t.status
FROM transactions t
WHERE LOWER(t.to_address) = LOWER('0x35c5e95657E758984ebBf2CB8A4216D02e25aD96')
  AND t.wallet_id != '11111111-1111-1111-1111-111111111111'
  AND t.direction = 'OUT'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.tx_hash = t.tx_hash 
      AND t2.wallet_id = '11111111-1111-1111-1111-111111111111'
  );

-- Step 3: Insert missing IN transactions for FUN TREASURY wallet
-- (transactions where FUN TREASURY is the recipient but only has entry from sender's wallet)
INSERT INTO transactions (
  wallet_id, tx_hash, block_number, timestamp, from_address, to_address,
  direction, token_address, token_symbol, amount, usd_value, gas_fee, status
)
SELECT 
  '22222222-2222-2222-2222-222222222222' as wallet_id,
  t.tx_hash, t.block_number, t.timestamp, t.from_address, t.to_address,
  'IN' as direction, t.token_address, t.token_symbol, t.amount, t.usd_value, t.gas_fee, t.status
FROM transactions t
WHERE LOWER(t.to_address) = LOWER('0x609ad9c80058b38ea06741d1b884ec765fcf519d')
  AND t.wallet_id != '22222222-2222-2222-2222-222222222222'
  AND t.direction = 'OUT'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.tx_hash = t.tx_hash 
      AND t2.wallet_id = '22222222-2222-2222-2222-222222222222'
  );

-- Step 4: Insert missing OUT transactions for BNB 2 wallet
-- (transactions where BNB2 is the sender but only has entry from recipient's wallet)
INSERT INTO transactions (
  wallet_id, tx_hash, block_number, timestamp, from_address, to_address,
  direction, token_address, token_symbol, amount, usd_value, gas_fee, status
)
SELECT 
  '406516e5-2f79-4c25-abcd-16d6074b0db3' as wallet_id,
  t.tx_hash, t.block_number, t.timestamp, t.from_address, t.to_address,
  'OUT' as direction, t.token_address, t.token_symbol, t.amount, t.usd_value, t.gas_fee, t.status
FROM transactions t
WHERE LOWER(t.from_address) = LOWER('0xc7260325fE39cD620198373c020Adcf40ECeF0A6')
  AND t.wallet_id != '406516e5-2f79-4c25-abcd-16d6074b0db3'
  AND t.direction = 'IN'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.tx_hash = t.tx_hash 
      AND t2.wallet_id = '406516e5-2f79-4c25-abcd-16d6074b0db3'
  );

-- Step 5: Insert missing OUT transactions for TRUST wallet
INSERT INTO transactions (
  wallet_id, tx_hash, block_number, timestamp, from_address, to_address,
  direction, token_address, token_symbol, amount, usd_value, gas_fee, status
)
SELECT 
  '11111111-1111-1111-1111-111111111111' as wallet_id,
  t.tx_hash, t.block_number, t.timestamp, t.from_address, t.to_address,
  'OUT' as direction, t.token_address, t.token_symbol, t.amount, t.usd_value, t.gas_fee, t.status
FROM transactions t
WHERE LOWER(t.from_address) = LOWER('0x35c5e95657E758984ebBf2CB8A4216D02e25aD96')
  AND t.wallet_id != '11111111-1111-1111-1111-111111111111'
  AND t.direction = 'IN'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.tx_hash = t.tx_hash 
      AND t2.wallet_id = '11111111-1111-1111-1111-111111111111'
  );

-- Step 6: Insert missing OUT transactions for FUN TREASURY wallet
INSERT INTO transactions (
  wallet_id, tx_hash, block_number, timestamp, from_address, to_address,
  direction, token_address, token_symbol, amount, usd_value, gas_fee, status
)
SELECT 
  '22222222-2222-2222-2222-222222222222' as wallet_id,
  t.tx_hash, t.block_number, t.timestamp, t.from_address, t.to_address,
  'OUT' as direction, t.token_address, t.token_symbol, t.amount, t.usd_value, t.gas_fee, t.status
FROM transactions t
WHERE LOWER(t.from_address) = LOWER('0x609ad9c80058b38ea06741d1b884ec765fcf519d')
  AND t.wallet_id != '22222222-2222-2222-2222-222222222222'
  AND t.direction = 'IN'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.tx_hash = t.tx_hash 
      AND t2.wallet_id = '22222222-2222-2222-2222-222222222222'
  );