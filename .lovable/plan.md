# Ke Hoach Cap Nhat Du Lieu BTCB va CAMLY - CHINH XAC 100%

## VAN DE DA XAC DINH

### 1. BTCB trong FUN TREASURY
- **Balance:** 0.228757 (co trong tokens table)
- **Transactions:** KHONG CO (0 records)
- **Nguyen nhan:** Edge function `sync-transactions` chi sync CAMLY va USDT (dong 479-483)

### 2. CAMLY trong FUN TREASURY - BNB 2  
- **Balance:** 7,999,999,999 CAMLY
- **Outflow:** 1,000,100,000 (co 2 giao dich OUT)
- **Inflow:** 0 (KHONG co giao dich IN)
- **Nguyen nhan:** Giao dich nhan CAMLY co the la internal transfer chua duoc backfill

---

## GIAI PHAP - 2 BUOC

### Buoc 1: Cap nhat sync-transactions de ho tro BTCB
**File:** `supabase/functions/sync-transactions/index.ts`

**Thay doi 1:** Them BTCB contract address (dong 326-328)
```typescript
const CAMLY_CONTRACT = '0x0910320181889fefde0bb1ca63962b0a8882e413';
const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const BTCB_CONTRACT = '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c'; // THEM MOI
```

**Thay doi 2:** Cap nhat filter logic (dong 469-483)
```typescript
// Determine token symbol
let tokenSymbol = tx.token_symbol || 'UNKNOWN';
const contractLower = tx.token_address?.toLowerCase();

if (contractLower === CAMLY_CONTRACT.toLowerCase()) {
  tokenSymbol = 'CAMLY';
} else if (contractLower === USDT_CONTRACT.toLowerCase()) {
  tokenSymbol = 'USDT';
} else if (contractLower === BTCB_CONTRACT.toLowerCase()) {
  tokenSymbol = 'BTCB';  // THEM MOI
}

// Filter: process CAMLY, USDT, va BTCB
const symbolUpper = tokenSymbol.toUpperCase();
if (symbolUpper !== 'CAMLY' && symbolUpper !== 'USDT' && symbolUpper !== 'BTCB') {
  continue;  // SUA LAI DE HO TRO BTCB
}
```

**Thay doi 3:** Them BTCB vao token prices (dong 346-353)
```typescript
const tokenPrices: Record<string, number> = {
  'CAMLY': camlyPrice,
  'BNB': 710,
  'USDT': 1,
  'USDC': 1,
  'BTCB': 97000,  // THEM MOI - gia BTC hien tai
};
```

**Thay doi 4:** Cap nhat Etherscan filter (dong 436-446)
```typescript
// Filter only CAMLY, USDT, and BTCB tokens
erc20Transfers = etherscanTransfers
  .filter(tx => {
    const contractLower = tx.contractAddress?.toLowerCase();
    const symbolUpper = tx.tokenSymbol?.toUpperCase();
    
    const isCAMLY = contractLower === CAMLY_CONTRACT.toLowerCase() || symbolUpper === 'CAMLY';
    const isUSDT = contractLower === USDT_CONTRACT.toLowerCase() || symbolUpper === 'USDT';
    const isBTCB = contractLower === BTCB_CONTRACT.toLowerCase() || symbolUpper === 'BTCB';  // THEM MOI
    
    return isCAMLY || isUSDT || isBTCB;
  })
  .map(convertBSCScanToERC20);
```

### Buoc 2: Chay Full Resync de lay du lieu BTCB
Sau khi deploy edge function moi, can chay **Full Resync** cho wallet FUN TREASURY de lay lich su giao dich BTCB tu blockchain.

Trong Settings page hoac goi API:
```javascript
// Tu frontend hoac API call
await supabase.functions.invoke('sync-transactions', {
  body: { 
    wallet_id: '22222222-2222-2222-2222-222222222222',  // FUN TREASURY
    force_full_sync: true 
  }
});
```

---

## KET QUA MONG DOI

Sau khi hoan thanh:

### FUN TREASURY:
| Token | INFLOW | OUTFLOW | BALANCE |
|-------|--------|---------|---------|
| CAMLY | 2.83B | 2.59B | 239.14M |
| BTCB | X.XXXX | X.XXXX | 0.2288 |
| USDT | 106,882.89 | 78,818.00 | 2,117.78 |

*X.XXXX = gia tri thuc tu blockchain sau khi sync*

### FUN TREASURY - BNB 2:
| Token | INFLOW | OUTFLOW | BALANCE |
|-------|--------|---------|---------|
| CAMLY | X.XXB | 1.00B | 8.00B |

*X.XXB = gia tri INFLOW thuc te sau khi backfill internal transfers*

---

## FILES CAN CAP NHAT

| File | Thay doi |
|------|----------|
| `supabase/functions/sync-transactions/index.ts` | Them BTCB contract, cap nhat filter logic, them BTCB price |

---

## LUU Y QUAN TRONG

1. **BTCB transactions se duoc sync** sau khi deploy edge function moi
2. **CAMLY INFLOW cho BNB 2** can kiem tra xem co phai internal transfer tu wallet khac trong he thong khong - neu co thi can chay Backfill trong Full Resync
3. **Full Resync** co the mat vai phut de hoan thanh
