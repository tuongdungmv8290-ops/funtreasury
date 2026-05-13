## Mục tiêu

Trên trang `/transactions`, mọi giao dịch của ví FUN TREASURY (cả 500.000 CAMLY lẫn 0.03 BNB đi kèm) phải hiển thị **tên người nhận thật** (ví dụ "Hoàng Điệp FunRich", "Phương Anh") **giống hệt** trang fun.rich/funtreasury — tự động, không cần admin gõ ghi chú cho từng dòng.

Hiện tại đã có:
- Cột From / To đã render label nếu địa chỉ có trong `address_labels` hoặc `wallets`.
- Hook `useSyncRewardLabels` đang cố upsert nhãn nhưng bị **RLS chặn** (yêu cầu `auth.uid() = created_by` cho non-admin, và chỉ admin mới ghi được toàn cục) → đa số người dùng (kể cả guest) không thể seed nhãn → bảng vẫn hiện địa chỉ ngắn `0xd90c...fef3`.
- Cặp BNB 0.03 đã được sync nhưng không có liên kết nào tới `gifts/camly_transfers` (chỉ CAMLY có) → kể cả khi nhãn cho recipient có sẵn, BNB tx vẫn hiện đúng nếu `to_address` khớp; vấn đề là **chưa có nhãn nào được seed**.

## Giải pháp

Tạo **edge function** `sync-reward-labels` chạy bằng service role để bypass RLS, tổng hợp toàn bộ nguồn tên rồi upsert vào `address_labels`. Trang `/transactions` tự gọi function này (debounce) mỗi khi mở.

### 1. Edge function mới: `supabase/functions/sync-reward-labels/index.ts`

Public (`verify_jwt = false`), dùng `SUPABASE_SERVICE_ROLE_KEY`.

Logic:
1. Đọc `camly_transfers` (recipient_address, recipient_name) → map address → name.
2. Đọc `gifts` (status='confirmed') → join `profiles` (user_id, display_name, wallet_address) → map wallet_address → display_name.
3. Đọc `profiles` có wallet_address + display_name (kể cả không liên quan gifts) → fallback.
4. Đọc `address_labels` hiện có → bỏ qua địa chỉ đã có nhãn (không ghi đè nhãn admin đặt tay).
5. Bulk upsert `address_labels` (address lowercase, label, created_by=null).
6. Trả về `{ inserted, skipped }`.

Cũng đăng ký block trong `supabase/config.toml`:
```
[functions.sync-reward-labels]
verify_jwt = false
```

### 2. Cập nhật `src/hooks/useSyncRewardLabels.ts`

Thay vì client-side upsert (bị RLS chặn), gọi edge function:
```ts
await supabase.functions.invoke('sync-reward-labels');
queryClient.invalidateQueries({ queryKey: ['address-labels'] });
```
Giữ debounce 1 lần/phiên qua `useRef` + `localStorage` key `last-reward-label-sync` (TTL 5 phút) để tránh gọi liên tục.

### 3. Không thay đổi UI

Cột From/To, badge `FUN.RICH ↗`, cột Tx Hash đã hiển thị đúng. Sau khi nhãn được seed bởi function trên, các dòng 500.000 CAMLY và 0.03 BNB cùng `to_address` sẽ tự hiện tên (ví dụ "Hoàng Điệp FunRich") mà không cần đụng vào component.

### 4. (Tùy chọn nhỏ) Cải thiện độ ưu tiên trong `useAddressLabels.ts`

Thứ tự áp dụng nhãn (đã đúng): wallets → address_labels (override). Không cần đổi.

## Files thay đổi

- **Mới**: `supabase/functions/sync-reward-labels/index.ts`
- **Sửa**: `supabase/config.toml` (thêm block function mới)
- **Sửa**: `src/hooks/useSyncRewardLabels.ts` (chuyển sang gọi edge function)

Không sửa `Transactions.tsx`, `funTreasury.ts`, hay schema DB.

## Kết quả mong đợi

Mở `/transactions` → sau ~1–2 giây (function chạy nền) → toàn bộ giao dịch của các ví FUN TREASURY hiển thị tên người nhận giống fun.rich, badge `FUN.RICH ↗` link tới `https://fun.rich/funtreasury`. Không cần admin ghi chú thủ công.