

# Kế Hoạch: Cập Nhật Giá Realtime Cho Tất Cả Ví Treasury

## Vấn Đề Hiện Tại

Hiện tại, các ví Treasury đang sử dụng **giá cố định (hardcoded)** để quy đổi ra USD:

| Token | Giá Hardcoded | Giá Thực Tế (biến động) |
|-------|--------------|------------------------|
| BTC   | $97,000      | Thay doi theo thi truong |
| BTCB  | $97,000      | Thay doi theo thi truong |
| BNB   | $710         | Thay doi theo thi truong |
| USDT  | $1           | OK (stablecoin) |
| USDC  | $1           | OK (stablecoin) |
| CAMLY | Realtime     | Da dung gia realtime |

Gia hardcoded khien so du USD hien thi **khong chinh xac** khi thi truong thay doi.

## Giai Phap

Lay gia realtime tu `useCryptoPrices` (CoinGecko API) va truyen vao `useWallets`, `useTokenBalancesFromDB`, va `useWalletSummary` thay vi dung gia co dinh.

## Chi Tiet Ky Thuat

### 1. Tao hook moi: `src/hooks/useRealtimePrices.ts`

Hook trung tam lay gia realtime cua tat ca token tu `useCryptoPrices` + `useCamlyPrice`, tra ve mot `Record<string, number>`:

```typescript
// Ket qua tra ve:
{
  CAMLY: 0.00002198,  // tu useCamlyPrice (chinh xac nhat)
  BTC: 104500,        // tu CoinGecko realtime
  BTCB: 104500,       // = BTC price
  BNB: 685,           // tu CoinGecko realtime
  USDT: 1,            // fallback stablecoin
  USDC: 1,            // fallback stablecoin
}
```

Logic: Uu tien CoinGecko realtime, fallback ve gia co dinh neu API loi.

### 2. Cap nhat `src/hooks/useWallets.ts`

- Xoa `BASE_PRICES` hardcoded
- Import va su dung `useRealtimePrices()` thay the
- `useMemo` tinh USD value voi gia realtime

### 3. Cap nhat `src/hooks/useTokenBalancesFromDB.ts`

- Xoa `BASE_PRICES` hardcoded
- Import va su dung `useRealtimePrices()` thay the
- Cap nhat ca `useTokenBalancesFromDB` va `useAggregatedTokenBalances`

### 4. Cap nhat `src/hooks/useWalletSummary.ts`

- Xoa `FALLBACK_PRICES` hardcoded
- Import va su dung `useRealtimePrices()` thay the

### 5. Cap nhat `src/components/dashboard/WalletCard.tsx`

- Hien thi gia USDT equivalent ro rang hon cho moi token
- Format so luong token chinh xac (VD: BTC hien thi 6 decimals)

## Files Can Thay Doi

| File | Thay Doi |
|------|----------|
| `src/hooks/useRealtimePrices.ts` | **Tao moi** - Hook trung tam lay gia realtime |
| `src/hooks/useWallets.ts` | Thay `BASE_PRICES` bang `useRealtimePrices()` |
| `src/hooks/useTokenBalancesFromDB.ts` | Thay `BASE_PRICES` bang `useRealtimePrices()` |
| `src/hooks/useWalletSummary.ts` | Thay `FALLBACK_PRICES` bang `useRealtimePrices()` |
| `src/components/dashboard/WalletCard.tsx` | Hien thi gia USDT chinh xac hon |

## Ket Qua Mong Doi

- Tat ca vi hien thi so tien USD **chinh xac theo gia thi truong realtime**
- Gia cap nhat moi 60 giay tu CoinGecko
- CAMLY van dung gia rieng tu `useCamlyPrice` (chinh xac nhat)
- Neu API loi, fallback ve gia co dinh de khong bi loi hien thi
- Tong gia tri Treasury (`$1,219,288.08`) se phan anh dung gia thi truong

