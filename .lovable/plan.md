# Ke Hoach Cap Nhat Du Lieu BTCB va CAMLY

## TRANG THAI HIEN TAI

### BNB 2 - CAMLY:
- **Inflow:** 0 (THIEU record IN 9B CAMLY)
- **Outflow:** 1,000,100,000 (2 giao dich)
- **Balance:** 7,999,999,999

### FUN TREASURY - BTCB:
- **Inflow:** 0 (chua sync)
- **Outflow:** 0 (chua sync)
- **Balance:** 0.228757

---

## GIAI PHAP - 2 BUOC

### Buoc 1: Insert Record IN cho BNB 2

Can insert 1 record IN vao table transactions voi thong tin:

| Field | Value |
|-------|-------|
| wallet_id | 406516e5-2f79-4c25-abcd-16d6074b0db3 |
| tx_hash | 0x12f7903b8a431da3a241e53d810c6957829c3dd1419975a373aa6628bfd1e7ea |
| direction | IN |
| token_symbol | CAMLY |
| amount | 9000000000 |
| usd_value | 198000 |
| from_address | 0x35c5e95657e758984ebbf2cb8a4216d02e25ad96 |
| to_address | 0xc7260325fe39cd620198373c020adcf40ecef0a6 |
| gas_fee | 0 |
| status | success |
| block_number | 69527990 |
| timestamp | 2025-11-26 08:57:39+00 |

**SQL Migration:**
```sql
INSERT INTO transactions (
  wallet_id,
  tx_hash,
  direction,
  token_symbol,
  token_address,
  amount,
  usd_value,
  from_address,
  to_address,
  gas_fee,
  status,
  block_number,
  timestamp
) VALUES (
  '406516e5-2f79-4c25-abcd-16d6074b0db3',
  '0x12f7903b8a431da3a241e53d810c6957829c3dd1419975a373aa6628bfd1e7ea',
  'IN',
  'CAMLY',
  '0x0910320181889fefde0bb1ca63962b0a8882e413',
  9000000000,
  198000,
  '0x35c5e95657e758984ebbf2cb8a4216d02e25ad96',
  '0xc7260325fe39cd620198373c020adcf40ecef0a6',
  0,
  'success',
  69527990,
  '2025-11-26 08:57:39+00'
)
ON CONFLICT (tx_hash, wallet_id) DO NOTHING;
```

### Buoc 2: Full Resync cho FUN TREASURY

Sau khi insert record IN, can chay Full Resync cho wallet FUN TREASURY de lay lich su giao dich BTCB:

1. Vao trang Transactions
2. Tim wallet "FUN TREASURY"
3. Click Sync dropdown
4. Chon "Full Resync"

---

## KET QUA MONG DOI

### BNB 2 - CAMLY:
| Metric | Truoc | Sau |
|--------|-------|-----|
| Inflow | 0 | 9,000,000,000 |
| Outflow | 1,000,100,000 | 1,000,100,000 |
| Balance | 7,999,999,999 | 7,999,999,999 |

### FUN TREASURY - BTCB:
| Metric | Truoc | Sau |
|--------|-------|-----|
| Inflow | 0 | (tu blockchain) |
| Outflow | 0 | (tu blockchain) |
| Balance | 0.228757 | 0.228757 |

---

## THU TU THUC HIEN

1. Chay migration SQL de insert record IN
2. Refresh trang Transactions de xem ket qua BNB 2
3. Chay Full Resync cho FUN TREASURY
4. Kiem tra lai so lieu BTCB
