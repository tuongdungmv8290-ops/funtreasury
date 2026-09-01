# Đồng bộ chính xác giao dịch on-chain & sửa số liệu Inflow / Outflow / Balance

## Điều đã kiểm tra được (dữ liệu thật trong hệ thống)

- Các ví BNB **ngừng đồng bộ từ 20/08/2026** (`sync_state.last_sync_at` = 20/08 cho FUN TREASURY, FUN.RICH, TRUST, BNB 2, GAME BNB). Hôm nay là 01/09 → thiếu khoảng 12 ngày giao dịch.
- Ví BTC có chạy đồng bộ hôm nay nhưng lịch sử vẫn thiếu: ví `bc1q8t7e…` tổng vào 4.003427 – tổng ra 4.003420 = **0.000007 BTC**, trong khi số dư on-chain là **0.0988 BTC** → thiếu các giao dịch nhận.
- Ví `bc1qe4eh…` (VÍ TỔNG): vào 11.00012 – ra 5.20101 = 5.79911, khớp số dư 5.7991 (mục này đúng).
- Ví GAME FUN TREASURY - BTC chưa từng đồng bộ lần nào (`last_sync_at` rỗng).
- Số dư token thì mới (cập nhật 01/09), nên bảng hiển thị bị lệch: Balance mới nhưng Inflow/Outflow là dữ liệu cũ.
- Giá trị USD của Inflow/Outflow đang tính bằng **giá hiện tại × tổng khối lượng lịch sử**, nên hiển thị số rất lớn ($315,498 cho 4 BTC) và không phản ánh giá trị thực lúc giao dịch.

## Việc sẽ làm

### 1. Khôi phục đồng bộ tự động (nguyên nhân gốc)
- Kiểm tra lịch chạy nền của `sync-transactions` và job tự động; hiện chỉ có job làm mới **số dư** chạy đều, còn job đồng bộ **giao dịch** không chạy từ 20/08.
- Thêm lịch chạy nền cho `sync-transactions` cho toàn bộ 9 ví (chu kỳ 15 phút), có khoá chống chạy chồng, giới hạn số ví mỗi lượt, ghi trạng thái vào `sync_state` và dừng khi lỗi lặp lại.
- Ghi rõ lỗi vào `sync_state.error_message` để thấy ngay ví nào hỏng thay vì im lặng.

### 2. Đồng bộ lại đầy đủ lịch sử ngay lập tức
- Chạy full re-sync (từ block 0) cho tất cả ví BNB và BTC, kể cả ví GAME BTC chưa từng đồng bộ.
- Với BTC: quét toàn bộ lịch sử UTXO có phân trang tới hết, không dừng ở trang đầu (đây là lý do ví `bc1q8t7e…` thiếu giao dịch nhận).
- Sau khi chạy, đối chiếu lại: với mỗi ví/token, kiểm tra `tổng vào − tổng ra ≈ số dư on-chain`; ví nào lệch sẽ được đồng bộ lại lần nữa và báo cáo cụ thể.

### 3. Sửa hiển thị Inflow / Outflow / Balance cho đúng
- USD của Inflow/Outflow: dùng giá trị USD đã ghi tại thời điểm giao dịch thay vì nhân giá hiện tại; chỉ Balance mới dùng giá realtime.
- Hiển thị thêm dòng "Chênh lệch" khi (vào − ra) không khớp số dư, kèm nhãn "đang đồng bộ" thay vì hiện số sai âm thầm.
- Hiện thời điểm đồng bộ gần nhất của từng ví ngay trên thẻ ví, đổi màu cảnh báo nếu quá 1 giờ.

### 4. Mượt mà hơn khi mở trang
- Khi mở trang Giao dịch: kích hoạt đồng bộ nền + hiện trạng thái tiến trình nhẹ nhàng (skeleton, không nhảy layout), dữ liệu tự cập nhật realtime khi sync xong.

## Chi tiết kỹ thuật

- `supabase/functions/sync-transactions/index.ts`: phân trang BTC đến hết lịch sử; ghi lỗi vào `sync_state`.
- Cron mới (pg_cron + pg_net) gọi `sync-transactions` mỗi 15 phút, dùng `AUTO_REFRESH_SECRET` đã có; bảng khoá single-flight để tránh chạy chồng.
- `src/hooks/useWalletSummary.ts`: cộng dồn `usd_value` của từng giao dịch cho inflow/outflow thay vì `amount × giá hiện tại`; Balance giữ giá realtime.
- `src/components/transactions/WalletSummaryCards.tsx`: thêm badge thời điểm sync, dòng chênh lệch, trạng thái tải.
