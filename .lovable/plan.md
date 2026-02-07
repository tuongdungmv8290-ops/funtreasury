

# Di chuyen Wallet Panel tu CAMLY Community sang Tặng Thưởng

## Thay doi

Di chuyen component `CamlyWalletPanel` (bao gom ket noi vi MetaMask, hien thi so du, gui/nhan CAMLY, bieu do gia, swap) tu trang CAMLY Community (`/camly`) sang trang Tặng Thưởng (`/rewards`).

## Chi tiet

### 1. Trang Rewards (`src/pages/Rewards.tsx`)
- Import `CamlyWalletPanel`
- Them component `CamlyWalletPanel` vao phia tren phan Post Section (sau header, truoc CreatePost)
- Vi tri: ngay sau block header, truoc phan bai viet

### 2. Trang CamlyCoin (`src/pages/CamlyCoin.tsx`)
- Xoa import va su dung `CamlyWalletPanel`
- Giu lai cac phan con: GoldQuoteCard, PhilosophyComparison, TokenomicsSection, CamlyStorySection (day la noi dung gioi thieu CAMLY, khong lien quan den vi)

## Ket qua

| Trang | Truoc | Sau |
|-------|-------|-----|
| CAMLY Community (`/camly`) | Co WalletPanel + Quote + Philosophy + Tokenomics + Story | Chi con Quote + Philosophy + Tokenomics + Story |
| Tặng Thưởng (`/rewards`) | Post + History + Analytics | **WalletPanel** + Post + History + Analytics |

Chi 2 file thay doi, khong can migration database.
