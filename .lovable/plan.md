# Ke Hoach Cap Nhat Du Lieu BTCB va CAMLY - SUA LOI CHINH XAC

## VAN DE DA XAC DINH

### 1. BTCB trong FUN TREASURY
- **Hien tai:** Balance = 0.228757, INFLOW = 0, OUTFLOW = 0
- **Van de:** Khong co giao dich BTCB nao trong database (0 records)
- **Nguyen nhan:** Edge function vua moi duoc cap nhat de ho tro BTCB nhung chua chay Full Resync

### 2. CAMLY trong FUN TREASURY - BNB 2
- **Hien tai:** Balance = 8B, INFLOW = 0, OUTFLOW = 1B
- **Van de:** Thieu 9B INFLOW tu FUN TREASURY. TRUST
- **Nguyen nhan:** Co giao dich 9B CAMLY tu TRUST -> BNB 2 (tx_hash: 0x12f7903b...) nhung chi co record OUT trong TRUST, khong co record IN trong BNB 2

---

## GIAI PHAP - 2 BUOC

### Buoc 1: Insert Missing IN Record cho BNB 2 (Manual Fix)
**Action:** Them record IN cho giao dich 9B CAMLY vao BNB 2

```sql
-- Insert missing IN record for 9B CAMLY transfer to BNB 2
INSERT INTO transactions (
  wallet_id,
  tx_hash,
  token_symbol,
  amount,
  usd_value,
  direction,
  from_address,
  to_address,
  block_timestamp
)
SELECT 
  '406516e5-2f79-4c25-abcd-16d6074b0db3' as wallet_id,  -- BNB 2 wallet ID
  t.tx_hash,
  t.token_symbol,
  t.amount,
  t.usd_value,
  'IN' as direction,
  t.from_address,
  t.to_address,
  t.block_timestamp
FROM transactions t
WHERE t.tx_hash = '0x12f7903b8a431da3a241e53d810c6957829c3dd1419975a373aa6628bfd1e7ea'
  AND t.direction = 'OUT'
ON CONFLICT (tx_hash, wallet_id) DO NOTHING;
```

### Buoc 2: Chay Full Resync cho FUN TREASURY de lay BTCB transactions
**Action:** Chay sync-transactions voi force_full_sync = true cho wallet FUN TREASURY

Sau khi deploy edge function (da hoan thanh), user can:
1. Vao trang Transactions
2. Click Sync dropdown cua wallet FUN TREASURY
3. Chon "Full Resync"

---

## KET QUA MONG DOI SAU KHI HOAN THANH

### FUN TREASURY:
| Token | INFLOW | OUTFLOW | BALANCE |
|-------|--------|---------|---------|
| CAMLY | 2.83B | 2.59B | 239.14M |
| BTCB | X.XXXX (tu blockchain) | X.XXXX (tu blockchain) | 0.2288 |
| USDT | 106,882.89 | 78,818.00 | 2,117.78 |

### FUN TREASURY - BNB 2:
| Token | INFLOW | OUTFLOW | BALANCE |
|-------|--------|---------|---------|
| CAMLY | 9.00B ($182,000) | 1.00B ($20,232) | 8.00B ($161,840) |

---

## FILES VA ACTIONS CAN THUC HIEN

| Action | Chi tiet |
|--------|----------|
| Database Insert | Them record IN 9B CAMLY cho BNB 2 |
| Full Resync | Chay sync-transactions cho FUN TREASURY de lay BTCB history |

---

## LUU Y

1. Sau khi insert record IN cho BNB 2, so lieu INFLOW se cap nhat tu 0 -> 9B
2. Sau khi Full Resync FUN TREASURY, se co du lieu BTCB transactions (neu co tren blockchain)
3. USD value se duoc tinh tu dong dua tren gia hien tai cua token
