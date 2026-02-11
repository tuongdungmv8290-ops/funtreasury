

## Them vi moi va hien thi trong Lich su Tang Thuong

### 1. Them vi vao database

Them dia chi `0xa4967da72d012151950627483285c3042957DA5d` vao bang `wallets` voi ten phu hop (vi du: "FUN REWARDS WALLET") tren chain BNB.

### 2. Sync du lieu token va giao dich

- Goi edge function `get-token-balances` de lay so du tat ca token cua vi moi tu blockchain (CAMLY, BNB, USDT, USDC, BTCB...)
- Goi edge function `sync-transactions` de lay lich su giao dich cua vi moi tu Moralis/Etherscan
- Tat ca token va giao dich se duoc luu vao database giong cac vi FUN TREASURY hien co

### 3. Hien thi trong trang Tang Thuong

**Them muc rieng trong phan "Lich su Tang Thuong":**
- Tao mot section/card rieng biet hien thi tat ca token cua vi `0xa496...DA5d`
- Hien thi so du tung token (CAMLY, BNB, USDT, USDC, BTCB) voi gia tri USD chinh xac
- Hien thi lich su giao dich IN/OUT cua vi nay, tuong tu nhu `CamlyTransactionHistory` nhung cho tat ca token
- Section nay nam phia tren hoac trong tab "Lich su" cua trang Rewards

### Chi tiet ky thuat

**Database migration:**
- INSERT vao bang `wallets`: `(name: 'FUN REWARDS', address: '0xa4967da72d012151950627483285c3042957DA5d', chain: 'BNB')`

**File thay doi:**

1. **`src/pages/Rewards.tsx`** - Them component `RewardsWalletSection` hien thi token balances va giao dich cua vi rewards rieng biet trong tab "Lich su"

2. **`src/hooks/useWallets.ts`** - Dam bao vi moi duoc hien thi dung voi tat ca core tokens (CAMLY, BNB, USDT, USDC, BTCB)

3. **Tao `src/components/rewards/RewardsWalletCard.tsx`** - Component moi hien thi:
   - Ten vi va dia chi (rut gon + copy + link BscScan)
   - Bang token balances voi logo, so luong, gia tri USD
   - Lich su giao dich gan day cua vi (IN/OUT) voi link BscScan

4. **`src/hooks/useTransactions.ts`** - Mo rong `VALID_TOKEN_SYMBOLS` them BNB, USDC, BTCB de hien thi day du giao dich cho vi rewards

**Luong hoat dong:**
- Khi trang Rewards load, query `wallets` table theo dia chi `0xa496...` de lay wallet_id
- Dung wallet_id do de query `tokens` (so du) va `transactions` (lich su)
- Hien thi trong card rieng biet voi giao dien tuong tu WalletCard tren trang chinh

