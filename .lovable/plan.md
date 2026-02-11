

## Cập nhật chính xác số tiền USDT và xoá mục Thành viên

### 1. Xoá tab "Thành viên" khỏi trang Tặng Thưởng

**File: `src/pages/Rewards.tsx`**
- Xoá `TabsTrigger` cho "Thành viên" (dòng 97-99)
- Xoá `TabsContent` cho "members" (dòng 116-118)
- Xoá import `MemberDirectory` (dòng 16)
- Xoá import `Users` icon (dòng 7)

Tab "Thành viên" se bi xoa hoan toan. Trang Tặng Thưởng chi con 2 tab: "Lịch sử" va "Analytics".

### 2. Dam bao so tien USDT chinh xac cho tat ca vi

Hien tai he thong da co `useRealtimePrices` lay gia tu CoinGecko va CAMLY API. Gia hien tai:
- CAMLY: $0.00001683 (tu API)
- BTC/BTCB: ~$97,000+
- BNB: ~$600+
- USDT/USDC: $1

He thong dang hoat dong dung. Tuy nhien, co mot van de tiem an:
- Hook `useWallets` co FALLBACK_PRICES co dinh (BTC: $100,000, BNB: $700) duoc dung khi API chua load xong
- USDC ($22,000 balance) chua duoc them vao `CORE_TOKENS` filter trong `useWallets` - can kiem tra

**File: `src/hooks/useWallets.ts`**
- Dam bao `CORE_TOKENS` bao gom 'USDC' (da co)
- Dam bao `useRealtimePrices` tra ve gia cho tat ca token

**File: `src/hooks/useRealtimePrices.ts`**
- Kiem tra FALLBACK_PRICES da day du (da co BTC, BNB, USDT, USDC, CAMLY)

Ket luan: He thong dinh gia da chinh xac. Neu so tien hien thi sai, nguyen nhan co the la:
- API CoinGecko bi rate-limit va dung gia fallback
- Token balance trong database chua duoc sync moi nhat

Se trigger sync lai du lieu balance va dam bao hien thi chinh xac.

### Chi tiet ky thuat

**Files thay doi:**
1. `src/pages/Rewards.tsx` - Xoa tab Thanh vien, import MemberDirectory va Users icon
2. Kiem tra va dam bao tinh chinh xac cua gia token trong `useRealtimePrices.ts` va `useWallets.ts`

