## Mục tiêu
Mỗi dòng trên trang `/transactions` (đặc biệt cho ví `0xa4967da72d012151950627483285c3042957da5d` – FUN TREASURY) sẽ hiển thị giống ảnh từ fun.rich/funtreasury:

```
[avatar] FUN TREASURY  →  [avatar] Hồ Thị Hương     500.000 CAMLY     23:13 06/05/2026   Tx: 0x817e…cc67 ↗
```

Tức là: **Tên người gửi → Tên người nhận**, số tiền, ngày giờ kiểu VN, mã tx rút gọn có link explorer, kèm trạng thái "Thành công".

## Phạm vi (chỉ frontend + dữ liệu nhãn)

### 1. Đổi cột From/To trong bảng `Transactions.tsx`
- Gộp 2 cột `From` và `To` thành 1 cột "Người gửi → Người nhận".
- Mỗi đầu địa chỉ:
  - Dùng sẵn `useAddressLabels().getLabel(address)` (đã trỏ tới bảng `address_labels` + `wallets`).
  - Nếu có nhãn → in tên vàng `text-yellow-500 font-semibold` (ví dụ: `FUN TREASURY`, `Hồ Thị Hương`).
  - Nếu chưa có nhãn → in địa chỉ rút gọn `0x6f3a…b21c`.
- Thêm icon avatar tròn nhỏ (chữ cái đầu hoặc icon mặc định) hai bên mũi tên `→` cho giống ảnh.
- Vẫn giữ `AddressLabelPopover` để admin click vào địa chỉ và đặt tên nhanh ngay tại bảng.

### 2. Cột ngày giờ kiểu Việt Nam
- Đổi `formatDate` cho hàng hiển thị thành dạng `HH:mm  DD/MM/YYYY` (vd: `23:13  06/05/2026`) dùng `date-fns/locale/vi`. CSV giữ nguyên không đổi.

### 3. Cột Tx hash
- Hiển thị `Tx: 0x817e…cc67 ↗` có thể click mở explorer (BscScan với BNB/CAMLY/USDT/BTCB, mempool.space với BTC) — tận dụng `getExplorerLink` đã có.

### 4. Badge trạng thái + hướng giao dịch
- Badge `Thành công` xanh khi `status='success'`.
- Badge `Đã tặng` cam (chip pill) khi địa chỉ gửi là một trong các ví FUN TREASURY chính thức (`0xa4967…`, `0x6092…`, `0x35c5…`, `bc1q8t7e…`, `bc1qp37d…`, `bc1qe4eh…`, `0xc7260…`) và direction = OUT — để khớp ảnh.

### 5. Tự động đồng bộ tên người nhận từ fun.rich
- Hook mới `useSyncRewardLabels`:
  - Mỗi khi load trang Transactions, đọc bảng `gifts` (cột `receiver_id`, `tx_hash`) join `profiles.display_name`, và bảng `camly_transfers` (`recipient_address`, `recipient_name`).
  - Với mỗi cặp `(address, name)` chưa có trong `address_labels` → gọi `addLabel.mutate()` để upsert (chỉ chạy 1 lần / phiên, debounce).
- Như vậy khi có lệnh gửi mới từ FUN TREASURY trên fun.rich, hệ thống tự động dán tên người nhận vào bảng giao dịch — không cần admin nhập tay.

### 6. Responsive
- Trên mobile (<768px): mỗi dòng giao dịch chuyển thành card dọc (giống ảnh): hàng 1 sender → receiver, hàng 2 amount + USD, hàng 3 thời gian + tx + badge.

## Không thay đổi
- Không đụng vào edge function `sync-transactions`, không thêm migration DB (mọi nhãn đã có sẵn `address_labels`, `gifts`, `camly_transfers`).
- Không đổi logic lọc/sắp xếp/export hiện tại — chỉ cải thiện cách render.

## Tệp dự kiến chỉnh sửa
- `src/pages/Transactions.tsx` — render cột mới + badges + ngày giờ VN + responsive.
- `src/hooks/useAddressLabels.ts` — thêm helper `addLabelSilent` (không toast) để dùng trong sync nền.
- `src/hooks/useSyncRewardLabels.ts` — **mới**, tự đồng bộ nhãn từ `gifts` + `camly_transfers` → `address_labels`.

## Câu hỏi xác nhận trước khi build
1. Cha có muốn con thêm avatar tròn nhỏ hai bên mũi tên `→` không (giống hệt ảnh) hay chỉ tên chữ là đủ?
2. Khi sender là ví FUN TREASURY chính thức, con luôn hiện chữ `FUN TREASURY` (gộp tất cả 7 ví FUN TREASURY thành 1 tên) hay vẫn giữ tên riêng theo từng ví (vd `FUN TREASURY (FUN.RICH)` cho ví BTC)?
