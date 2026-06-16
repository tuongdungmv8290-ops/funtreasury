# Mục tiêu

Cập nhật **toàn bộ lịch sử giao dịch gửi (OUT) và nhận (IN)** từ 7 ví FUN Treasury (5 BNB + 2 BTC) một cách chính xác, không bỏ sót, không trùng lặp.

# Hiện trạng

- Edge function `sync-transactions` đã hỗ trợ `force_full_sync: true` (reset `last_block_synced`, quét lại từ đầu) — nhưng UI hiện chỉ chạy được cho **từng ví riêng lẻ** qua nút trong `WalletSummaryCards.tsx`.
- Nút "Sync" tổng (Settings, Dashboard, Transactions) chỉ chạy **incremental sync**, nên các ví có `last_block_synced` cao (vd. `VÍ TỔNG FUN TREASURY - BNB 2 = 84268655`) sẽ luôn trả về "0 new" dù lịch sử cũ chưa đầy đủ.
- Log cho thấy 2 vấn đề kỹ thuật:
  1. Etherscan V2 fallback trả `status:0 NOTOK` cho ví BNB 2 → có thể do API key BSCSCAN/ETHERSCAN sai hoặc rate limit.
  2. Moralis ERC20 chỉ gọi `page 1` rồi dừng (không lặp `cursor`) cho nhánh fallback, nên các ví có >100 token transfer cũ chưa được lấy hết khi full-resync.

# Phạm vi thay đổi

## 1. UI — Nút "Resync toàn bộ lịch sử" (Settings → Wallets)

- Thêm 1 nút mới (admin-only) **"Đồng bộ lại toàn bộ lịch sử"** bên cạnh nút "Sync" hiện có trong `src/pages/Settings.tsx`.
- Hộp xác nhận (AlertDialog): cảnh báo sẽ quét lại từ block 0 cho **tất cả ví**, có thể mất 1–3 phút.
- Gọi `supabase.functions.invoke('sync-transactions', { body: { force_full_sync: true } })` (không truyền `wallet_id` → áp dụng cho mọi ví).
- Toast tiến trình + hiển thị kết quả `{ added, cleaned_up }` per-wallet từ response.

## 2. Edge Function `sync-transactions` — Sửa pagination & fallback

- **Moralis ERC20 pagination**: trong nhánh full-sync, lặp `cursor` đến khi hết (giới hạn an toàn 50 trang) thay vì dừng ở page 1. (Native BNB đã lặp đúng.)
- **Etherscan V2 fallback**: 
  - Log rõ URL + response body khi `NOTOK` để chẩn đoán.
  - Nếu key BSCSCAN/ETHERSCAN không hợp lệ, fallback hoàn toàn về Moralis (không cố Etherscan).
  - Thêm pagination `page=1..N` (offset 3000/page) cho Etherscan V2 đến khi trả về <3000 records.
- **BTC**: hiện đã lấy đủ (logs cho thấy đúng số tx so với mempool.space). Giữ nguyên, chỉ đảm bảo `force_full_sync` xoá `last_block_synced` để re-scan và upsert.
- **Idempotent**: tiếp tục dùng `upsert` theo `(wallet_id, tx_hash, direction, token_symbol)` để tránh trùng — đã có.

## 3. Báo cáo kết quả

- Response của edge function trả về mảng `wallet_results: [{ name, added_in, added_out, total_in, total_out, errors[] }]`.
- UI hiển thị bảng tóm tắt sau khi sync xong (modal hoặc toast mở rộng).

# Chi tiết kỹ thuật

**Files thay đổi:**
- `supabase/functions/sync-transactions/index.ts` — sửa loop cursor Moralis, fallback Etherscan, thêm `wallet_results` vào response.
- `src/pages/Settings.tsx` — thêm nút "Đồng bộ lại toàn bộ lịch sử" + AlertDialog + state hiển thị kết quả.
- `src/locales/vi.json` + `en.json` — 4 string mới (label nút, tiêu đề dialog, mô tả, success message).

**Không đụng tới:**
- Schema DB (transactions/sync_state đã đủ cột).
- Logic dedupe, RLS, address_labels.

# Kiểm thử sau khi build

1. Bấm nút mới → confirm → đợi ~2 phút.
2. So sánh số tx mỗi ví với BscScan/Mempool.space:
   - `0xa4967d...DA5d` (FUN.RICH BNB) — kỳ vọng đầy đủ cả OUT (gửi) và IN (nhận).
   - `bc1q8t7eumw...` (FUN.RICH BTC) — kỳ vọng khớp 100% với mempool.space.
3. Chạy lại nút "Sync" thường → phải trả "0 new" (xác nhận incremental không bị trùng).

Sẵn sàng chuyển sang build mode khi bạn duyệt.