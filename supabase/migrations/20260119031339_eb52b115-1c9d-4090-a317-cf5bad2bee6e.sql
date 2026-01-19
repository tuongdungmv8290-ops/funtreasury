-- Thêm INFLOW transaction cho FUN TREASURY - BNB 2 wallet
-- Để balance khớp: INFLOW = Balance + OUTFLOW = 7,999,999,999 + 1,000,100,000 = 9,000,099,999 CAMLY

INSERT INTO transactions (
  wallet_id,
  tx_hash,
  direction,
  token_symbol,
  token_address,
  amount,
  usd_value,
  block_number,
  from_address,
  to_address,
  timestamp,
  status
)
SELECT 
  w.id,
  'internal-transfer-camly-to-bnb2-initial-9b',
  'IN',
  'CAMLY',
  '0x0910320181889fefde0bb1ca63962b0a8882e413',
  9000099999,
  198000,
  0,
  '0x35c5e95657e758984ebbf2cb8a4216d02e25ad96',
  w.address,
  '2024-01-01T00:00:00Z',
  'success'
FROM wallets w
WHERE w.name = 'FUN TREASURY - BNB 2'
ON CONFLICT (tx_hash, wallet_id) DO NOTHING;