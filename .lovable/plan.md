## Thay đổi

### 1. Banner fun.rich hiển thị thêm mã ví chính FUN TREASURY
Trong `src/pages/Transactions.tsx` (banner fun.rich đã có), bổ sung dòng địa chỉ ví chính:
`0xa4967da72d012151950627483285c3042957da5d`
- Hiển thị dạng font-mono, có nút copy nhỏ bên cạnh (không mở link, chỉ copy vào clipboard).
- Bố cục banner: tiêu đề "FUN TREASURY trên fun.rich" → URL fun.rich → mã ví chính.

### 2. Xoá 2 card GAME FUN TREASURY trùng lặp trên Bảng Điều Khiển
Trong `src/pages/Index.tsx`, phần lưới `WalletCard` (mục "Treasury Wallets" ở trên cùng) đang render tất cả ví — bao gồm cả 2 ví GAME FUN TREASURY (BNB + BTC).
- Lọc bỏ 2 địa chỉ game khỏi danh sách trước khi map:
  - `0x032269c811a2e58683df9514d3bf6ce70d1d09bb`
  - `bc1q05nm7esjp4d96jyaypgc4499lfnclf2g4f787n`
- Mục `<GameFunTreasurySection />` bên dưới giữ nguyên (đây là nơi hiển thị chính thức của Game Fun Treasury).

Không đụng tới database, edge functions, hay các trang khác.
