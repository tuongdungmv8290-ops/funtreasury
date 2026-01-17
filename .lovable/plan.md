# Ke Hoach Cap Nhat Hien Thi BTCB va CAMLY - Xin Xo

## VAN DE

1. **BTCB trong FUN TREASURY**: Hien thi IN/OUT/BALANCE ro rang (hien tai IN=0, OUT=0, BALANCE=0.228757)
2. **CAMLY trong FUN TREASURY - BNB 2**: Hien thi INFLOW=0 ro rang (khong co transaction IN)

## DU LIEU DATABASE (DA XAC MINH)

| Wallet | Token | Balance | Inflow TX | Outflow TX |
|--------|-------|---------|-----------|------------|
| FUN TREASURY | BTCB | 0.228757 | Khong co | Khong co |
| FUN TREASURY - BNB 2 | CAMLY | 7,999,999,999 | 0 | 1,000,100,000 |

## GIAI PHAP - 2 BUOC

### Buoc 1: Cap nhat formatCompactAmount cho BTCB hien thi ro hon
**File:** `src/components/transactions/WalletSummaryCards.tsx`

Hien tai:
- BTCB voi balance = 0.228757 hien thi dung nhung IN/OUT = 0 co the hien thi khong ro

Thay doi ham `formatCompactAmount` de xu ly truong hop IN/OUT = 0 cho BTCB:

```typescript
const formatCompactAmount = (amount: number, symbol: string): string => {
  // BTCB/BTC - xu ly truong hop = 0 va so nho
  if (symbol === 'BTCB' || symbol === 'BTC') {
    if (amount === 0) {
      return '0.0000';  // Hien thi ro rang la 0
    }
    if (amount < 1) {
      return formatNumber(amount, { minDecimals: 4, maxDecimals: 6 });
    }
    return formatNumber(amount, { minDecimals: 2, maxDecimals: 4 });
  }
  
  // CAMLY - xu ly truong hop = 0
  if (symbol === 'CAMLY') {
    if (amount === 0) {
      return '0';  // Hien thi ro rang la 0
    }
    if (amount >= 1_000_000_000) {
      return (amount / 1_000_000_000).toFixed(2) + 'B';
    }
    if (amount >= 1_000_000) {
      return (amount / 1_000_000).toFixed(2) + 'M';
    }
    return formatNumber(amount, { minDecimals: 0, maxDecimals: 0 });
  }
  
  // USDT - 2 decimals
  if (symbol === 'USDT') {
    return formatNumber(amount, { minDecimals: 2, maxDecimals: 2 });
  }
  
  // Default - CAMLY style
  if (amount >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(2) + 'B';
  }
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(2) + 'M';
  }
  return formatNumber(amount, { minDecimals: 0, maxDecimals: 0 });
};
```

### Buoc 2: Dam bao USD value hien thi $0.00 khi amount = 0
**File:** `src/components/transactions/WalletSummaryCards.tsx`

Hien tai code da xu ly dung bang `formatUSD(token.inflow_usd ?? 0)`.
Nhung can dam bao gia tri 0 hien thi ro rang hon trong UI.

Them CSS highlight cho cac gia tri = 0 de user de nhan biet:

```typescript
// Trong phan render Inflow
<div className={cn(
  "font-mono font-bold text-base",
  token.inflow_amount === 0 
    ? "text-muted-foreground/60" // Lam nhat khi = 0
    : "text-emerald-700 dark:text-emerald-300"
)}>
  {formatCompactAmount(token.inflow_amount ?? 0, token.token_symbol)}
</div>
```

Tuong tu cho Outflow:
```typescript
<div className={cn(
  "font-mono font-bold text-base",
  token.outflow_amount === 0 
    ? "text-muted-foreground/60"
    : "text-red-700 dark:text-red-300"
)}>
  {formatCompactAmount(token.outflow_amount ?? 0, token.token_symbol)}
</div>
```

## KET QUA MONG DOI

### FUN TREASURY:
| Token | INFLOW | OUTFLOW | BALANCE |
|-------|--------|---------|---------|
| CAMLY | 2.83B ($62,336) | 2.59B ($57,075) | 239.14M ($5,261) |
| BTCB | 0.0000 ($0.00) | 0.0000 ($0.00) | 0.2288 ($22,189) |
| USDT | 106,882.89 | 78,818.00 | 2,117.78 |

### FUN TREASURY - BNB 2:
| Token | INFLOW | OUTFLOW | BALANCE |
|-------|--------|---------|---------|
| CAMLY | 0 ($0.00) | 1.00B ($22,000) | 8.00B ($176,000) |

## FILES CAN CAP NHAT

| File | Thay doi |
|------|----------|
| `src/components/transactions/WalletSummaryCards.tsx` | Cap nhat formatCompactAmount + conditional styling cho gia tri 0 |
