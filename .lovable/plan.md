
Mục tiêu: thêm hiển thị đúng và đầy đủ cho Bitcoin mạng Bitcoin (BTC) bên cạnh Bitcoin mạng BNB (BTCB), đồng thời tự đồng bộ giao dịch gửi/nhận của ví `bc1q8t7eumwz552nljr2p2x5ckpl55ju26avlu4fxq` để bảng Transactions và Wallet Summary luôn khớp dữ liệu thật.

1. Xác định và sửa nguyên nhân gốc
- Hiện tại backend `sync-transactions` chỉ xử lý ví địa chỉ `0x...`, nên toàn bộ ví BTC mainnet (`bc1...`) đang bị bỏ qua.
- Cuối hàm còn có bước dọn dữ liệu chỉ giữ `CAMLY/USDT/BTCB`, nên mọi giao dịch `BTC` nếu có cũng có thể bị xóa.
- Vì vậy cần sửa logic sync để:
  - nhận diện ví chain `BTC`
  - lấy lịch sử BTC mainnet riêng
  - giữ lại token `BTC` trong cleanup

2. Bổ sung đồng bộ BTC mainnet trong backend
- Mở rộng `supabase/functions/sync-transactions/index.ts` để hỗ trợ nhánh xử lý `wallet.chain === 'BTC'`.
- Dùng API blockchain BTC đáng tin cậy để đọc lịch sử giao dịch theo địa chỉ, bao gồm:
  - tx hash
  - thời gian
  - block height
  - địa chỉ gửi
  - địa chỉ nhận
  - số lượng BTC thực nhận/thực gửi của chính ví đó
- Chuẩn hóa dữ liệu thành record `transactions` giống các chain khác:
  - `token_symbol = 'BTC'`
  - `direction = 'IN' | 'OUT'`
  - `amount`
  - `usd_value`
  - `from_address`, `to_address`
- Giữ cơ chế chống trùng lặp theo `(tx_hash, wallet_id)`.

3. Làm đúng logic đặc thù của Bitcoin
- Vì giao dịch BTC có thể nhiều input/nhiều output, cần tính direction và amount theo góc nhìn của ví:
  - IN = tổng giá trị ví nhận được
  - OUT = tổng giá trị ví chi ra cho bên ngoài ví, không tính nhầm change output quay về chính ví
- Nếu có phí mạng, cân nhắc lưu `gas_fee`/network fee cho BTC theo định dạng phù hợp để không sai số.
- Nếu trong cùng hệ thống có ví BTC khác là counterparty, có thể backfill dual-entry tương tự EVM khi xác định được địa chỉ đối ứng rõ ràng.

4. Giữ BTC không bị xóa trong cleanup
- Sửa bước cleanup cuối `sync-transactions` để whitelist gồm ít nhất:
  - `CAMLY`
  - `USDT`
  - `BTCB`
  - `BTC`
- Giữ nguyên lọc spam/dust hợp lý, nhưng không xóa nhầm BTC mainnet.

5. Cập nhật hiển thị Transactions cho rõ ràng hơn
- `useTransactions` đã cho phép `BTC`, nhưng cần rà lại toàn bộ luồng để token BTC thực sự xuất hiện trong dropdown khi có dữ liệu.
- Cải thiện trang `src/pages/Transactions.tsx`:
  - hiển thị link explorer theo mạng:
    - BTC -> mempool.space hoặc explorer BTC phù hợp
    - BNB/BTCB/CAMLY/USDT -> BscScan
  - nếu cần, thêm badge/network label để phân biệt rõ:
    - BTC = Bitcoin Mainnet
    - BTCB = BNB Chain
- Mục tiêu là người dùng nhìn vào bảng biết ngay đây là BTC mạng Bitcoin hay BTCB mạng BNB.

6. Cập nhật Wallet Summary cho ví BTC đẹp và đầy đủ hơn
- Hiện `WalletSummaryCards` với ví BTC chỉ hiện “Current Balance”.
- Sẽ đổi sang hiển thị đầy đủ cho ví BTC:
  - Inflow
  - Outflow
  - Balance
- Đồng thời giữ phần explorer/copy address như hiện tại.
- Như vậy ví `bc1q8t7e...` sẽ hiện rõ số nhận, số gửi và số dư thay vì chỉ một ô balance.

7. Tự động cập nhật khi có giao dịch mới
- Sau khi backend hỗ trợ BTC, giữ nguyên các nút Sync hiện có nhưng cho phép sync cả ví BTC.
- Bỏ chặn UI hiện đang ẩn nút sync với `wallet.wallet_chain === 'BTC'`, hoặc thay bằng hành vi phù hợp để admin có thể sync ví BTC như các ví khác.
- Nếu cần, dùng chung cơ chế full resync để quét lại toàn bộ lịch sử ví BTC khi cần đối soát.

8. Đồng bộ số dư token BTC với lịch sử
- Rà lại `get-token-balances` để đảm bảo balance BTC và history BTC dùng cùng chuẩn địa chỉ/mạng.
- Nếu cần, cập nhật nguồn balance BTC cho ổn định hơn để tránh trường hợp balance đúng nhưng history trống.

9. Kiểm tra dữ liệu thật cho ví `bc1q8t7e...`
- Sau khi được duyệt và chuyển sang chế độ triển khai, tôi sẽ:
  - đọc dữ liệu hiện có của ví này trong `wallets`, `tokens`, `transactions`
  - sync/full-resync ví BTC đó
  - đối chiếu số lượng lệnh IN/OUT thực tế
  - sửa các bản ghi sai hoặc thiếu nếu cần để web hiển thị chính xác

10. Kiểm tra hoàn thiện
- Xác nhận các điểm sau:
  - dropdown token có cả `BTC` và `BTCB` đúng ngữ cảnh
  - lọc BTC hiển thị đúng giao dịch của ví `bc1q8t7e...`
  - bảng Transactions hiện đủ lệnh nhận và gửi
  - Wallet Summary hiện đúng inflow/outflow/balance cho ví BTC
  - sync mới không làm mất dữ liệu BTC đã có
  - giao diện vẫn gọn, rõ, đẹp

Chi tiết kỹ thuật
- File cần sửa chính:
  - `supabase/functions/sync-transactions/index.ts`
  - `src/pages/Transactions.tsx`
  - `src/components/transactions/WalletSummaryCards.tsx`
  - có thể thêm rà soát `supabase/functions/get-token-balances/index.ts`
- Không cần đổi `src/integrations/supabase/client.ts`.
- Có thể không cần migration DB nếu chỉ sửa logic sync; chỉ thêm migration nếu cần metadata/network field mới để phân biệt mạng đẹp hơn trong UI.
- Phát hiện quan trọng từ code hiện tại:
  - `useTransactions` đã whitelist `BTC`
  - nhưng `sync-transactions` đang bỏ qua ví BTC vì check `!wallet.address.startsWith('0x')`
  - và cleanup đang xóa mọi token ngoài `CAMLY/USDT/BTCB`
  => đây rất có thể là lý do chính khiến BTC mainnet chưa hiện trên bảng giao dịch.
