# Cập nhật đầy đủ giao dịch tất cả token (sửa lỗi thiếu lệnh CAMLY)

## Nguyên nhân đã xác minh trên chuỗi

- Lệnh CAMLY cùng thời điểm với 150 USDT **có thật**: tx `0x0803e789…`, block 119.266.164, hợp đồng CAMLY `0x0910…e413`, khối lượng **1.500.000 CAMLY**.
- Hợp đồng CAMLY có **decimals = 3** (đã đọc trực tiếp từ chuỗi), nhưng bộ quét `sync-bsc-logs` đang khai báo CAMLY là 18 decimals → tính ra 0,0000000015 CAMLY → bị bộ lọc chống bụi (CAMLY < 100) loại bỏ. Vì vậy **mọi lệnh CAMLY đều bị bỏ qua** trong bộ quét mới.
- Con trỏ quét tiến (`bsc_logs_cursor_*`) **chưa từng được ghi** trong `api_settings` (chỉ có `bsc_logs_floor_*`). Mỗi lần chạy, con trỏ tiến lại đặt bằng block hiện tại nên **khoảng block mới phát sinh giữa hai lần chạy không bao giờ được quét** — hiện đang lệch ~15.900 block so với thời điểm quét gần nhất.
- Dữ liệu CAMLY cũ trong bảng giao dịch (828 dòng, tới 20/08/2026) có khối lượng đúng thang đo, nên chỉ cần bổ sung phần thiếu, không phải sửa lại lịch sử.
- Ngoài ra có token giả mạo `0xefc3…6a6e` gửi 150 "token" vào ví — sẽ tiếp tục không hiển thị (không nằm trong danh sách token chính thức).

## Việc sẽ làm

### 1. Sửa thang đo token trong bộ quét
- Đặt đúng decimals CAMLY = 3; đọc decimals trực tiếp từ hợp đồng khi khởi động để không bao giờ lệch lại.
- Rà lại ngưỡng lọc bụi theo giá trị thực (CAMLY ≥ 100, USDT ≥ 0,5, BTCB ≥ 0,000001) sau khi thang đo đã đúng.

### 2. Sửa con trỏ quét tiến để không bỏ sót block mới
- Ghi con trỏ tiến ngay lần chạy đầu và sau mỗi lát quét, kể cả khi không có block mới.
- Khi khởi tạo, đặt con trỏ tiến lùi lại một khoảng an toàn (theo block giao dịch mới nhất đã lưu của ví) thay vì đặt bằng block hiện tại.

### 3. Quét lại phần đang thiếu ngay lập tức
- Chạy lại bộ quét cho toàn bộ ví BNB trên vùng block gần đây để lấy về lệnh CAMLY 1.500.000 và mọi lệnh token phát sinh từ 20/08 tới nay.
- Đối chiếu sau khi chạy: liệt kê giao dịch của từng ví theo token, xác nhận lệnh CAMLY và 150 USDT cùng xuất hiện đúng thời điểm.

### 4. Kiểm tra chéo tất cả token
- So khớp số lượng giao dịch CAMLY / USDT / BTCB của từng ví BNB giữa chuỗi và cơ sở dữ liệu, báo cáo cụ thể ví nào còn lệch để quét bù tiếp theo chu kỳ.

## Chi tiết kỹ thuật

- `supabase/functions/sync-bsc-logs/index.ts`: bảng `TOKENS` lấy decimals qua `eth_call(0x313ce567)` khi khởi động (fallback CAMLY=3, USDT=18, BTCB=18); ghi `bsc_logs_cursor_<wallet>` ngay cả khi vòng lặp quét tiến không chạy; khởi tạo con trỏ tiến từ `max(block_number)` trong `transactions` của ví.
- Sau khi triển khai: gọi hàm thủ công vài lượt để dồn tiến độ, rồi kiểm tra bằng truy vấn đối chiếu theo `wallet_id, token_symbol`.
