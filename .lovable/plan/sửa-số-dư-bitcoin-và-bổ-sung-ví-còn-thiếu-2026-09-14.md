# Sửa số dư Bitcoin và bổ sung ví còn thiếu

## Điều đã kiểm chứng trực tiếp trên mạng Bitcoin (hôm nay)

| Ví | Đang hiển thị | Thực tế on-chain |
|---|---|---|
| FUN TREASURY (FUN.RICH) — bc1q8t7e... | 0.0988 BTC (~$7,688) | **0 BTC** (đã chuyển đi hết, 9 giao dịch) |
| bc1qgwwhk0x... | chưa có trong hệ thống | 0 BTC (5 giao dịch) |
| FUN TREASURY. TRUST — bc1qp37d... | 0.00028906 | đúng |
| VÍ TỔNG FUN TREASURY — bc1qe4eh... | 5.29909557 | đúng |
| GAME FUN TREASURY — bc1q05nm... | 0 | đúng |

Số 0,00078712 BTC MetaMask hiển thị là **tổng của cả ví**, gồm nhiều địa chỉ con do MetaMask tự sinh — không nằm riêng ở địa chỉ bc1q8t7e... (địa chỉ này đã về 0).

## Nguyên nhân số 0.0988 bị kẹt

Bộ cập nhật số dư có một quy tắc "nếu mạng báo 0 thì giữ nguyên số cũ trong hệ thống". Vì vậy khi ví đã rút hết tiền, con số cũ 0.0988 không bao giờ được ghi đè, và giá trị USD tiếp tục bị thổi phồng.

## Việc sẽ làm

1. **Bỏ quy tắc giữ số cũ** trong bộ cập nhật số dư Bitcoin — luôn ghi đúng số mạng trả về, kể cả 0.
2. **Thêm chế độ nhiều địa chỉ cho một ví**: một ví Bitcoin có thể khai báo thêm các địa chỉ phụ; số dư hiển thị = tổng tất cả địa chỉ đó. Địa chỉ bc1qgwwhk0x... sẽ được gắn làm địa chỉ phụ của ví FUN TREASURY (FUN.RICH), và ví này sẽ xuất hiện đầy đủ trong danh sách ở trang Giao Dịch.
3. **Thêm ô "số dư ghim thủ công"** cho ví Bitcoin trong Cài đặt: khi Cha nhập 0.00078712, hệ thống hiển thị đúng con số MetaMask và không tự ghi đè. Bỏ trống thì chạy tự động theo mạng.
4. **Chạy cập nhật lại ngay** cho toàn bộ ví Bitcoin để Inflow / Outflow / Balance và giá trị USD khớp thực tế.

Nếu Cha gửi thêm mã ví mở rộng (xpub/zpub) của tài khoản MetaMask, con có thể cộng tự động mọi địa chỉ con mà không cần nhập tay.

## Chi tiết kỹ thuật

- `supabase/functions/get-token-balances/index.ts`: bỏ nhánh "preserve existing balance khi on-chain = 0"; gộp số dư từ danh sách địa chỉ phụ; tôn trọng số dư ghim.
- Migration: thêm cột `extra_addresses text[]` và `manual_balance numeric` cho bảng `wallets` (giữ nguyên RLS hiện có).
- Thêm bản ghi địa chỉ phụ bc1qgwwhk0x... cho ví FUN.RICH; cập nhật `src/lib/funTreasury.ts` để liên kết fun.rich nhận diện địa chỉ này.
- UI Cài đặt (`src/pages/Settings.tsx`) thêm ô nhập địa chỉ phụ và số dư ghim, chỉ dành cho quản trị.
- Chạy lại `get-token-balances` sau khi triển khai và đối chiếu bảng `tokens`.
