# Bộ lọc theo tên người nhận + Liên kết FUN.RICH

## 1. Mở rộng ô tìm kiếm để hỗ trợ TÊN người nhận/gửi
**File:** `src/hooks/useTransactions.ts`
- Thêm tham số `labelMap?: Record<string,string>` vào `TransactionFilters` (hoặc filter ngay tại UI).
- Khi `filters.search` có giá trị, ngoài hash/address/token sẽ match thêm `label` của `from_address` và `to_address` (FUN TREASURY, Hồ Thị Hương, v.v.).

**File:** `src/pages/Transactions.tsx`
- Cập nhật placeholder ô search: "🔍 Tìm theo tên người nhận, ví, token, hash..."
- Truyền `labelMap` từ `useAddressLabels()` vào filter (hoặc lọc client-side trong `sortedTransactions` bằng `getLabel(...).label.toLowerCase().includes(search)`).

## 2. Thêm Select "Người nhận" (Recipient filter)
**File:** `src/pages/Transactions.tsx`
- Thêm state `recipientFilter` (default `'all'`).
- Build danh sách recipients duy nhất từ `transactions` → mỗi entry `{ address, label }` (lấy từ `getLabel`), sort A-Z, ưu tiên các địa chỉ đã có label.
- Render `<Select>` mới cạnh các select hiện tại, hiển thị tên (label) thay vì address rút gọn.
- Khi chọn: lọc `sortedTransactions` theo `tx.to_address === recipientFilter` (và direction OUT mặc định nếu là FUN TREASURY).

## 3. Liên kết hàng giao dịch tới FUN.RICH/FUNTREASURY
**File:** `src/pages/Transactions.tsx`
- Thêm helper `getFunRichLink(tx)` trả về:
  - `https://fun.rich/funtreasury` cho mọi giao dịch có `from_address` hoặc `to_address` là 1 trong 7 ví FUN TREASURY chính thức (BNB: `0xa4967...`, `0x6092...`, `0x35c5...`, `0xc7260...`; BTC: `bc1q8t7e...`, `bc1qp37d...`, `bc1qe4eh...`).
  - null cho các tx khác.
- Trong cột **From/To**: khi label = "FUN TREASURY" hoặc liên quan ví chính thức, biến tên thành `<a href={getFunRichLink(tx)} target="_blank">` với icon `ExternalLink` nhỏ vàng bên cạnh.
- Trong cột **Tx Hash**: thêm icon thứ 2 (logo FUN nhỏ hoặc `↗`) link tới `https://fun.rich/funtreasury` khi tx liên quan ví FUN TREASURY, song song với link explorer.

## 4. Đảm bảo "tất cả các ví hiện có" được sync đầy đủ
**File:** `supabase/functions/sync-transactions/index.ts` (đã sync 7 ví)
- Trigger 1 lần `supabase.functions.invoke('sync-transactions')` khi vào trang để cập nhật mới nhất (debounce 60s qua `localStorage` key `last-tx-sync`).
- Toast nhỏ "Đang đồng bộ giao dịch mới..." khi sync chạy nền.

## Kỹ thuật chi tiết
- Constant `FUN_TREASURY_WALLETS: Set<string>` (lowercase) đặt ở `src/lib/funTreasury.ts` mới để tái dùng.
- Recipient filter dùng `useMemo` để tránh re-compute mỗi render.
- Search vẫn giữ nguyên server filters (wallet/direction/token); name match hoàn toàn client-side trên kết quả đã trả về.
- Không thay đổi schema DB.

## Files thay đổi
- `src/lib/funTreasury.ts` (mới) - danh sách ví + helper `getFunRichLink`
- `src/hooks/useTransactions.ts` - mở rộng search match label
- `src/pages/Transactions.tsx` - select Recipient + cột link FUN.RICH + auto-sync khi mount
