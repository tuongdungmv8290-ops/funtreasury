

## Xoa vi cu va chi hien thi vi Rewards trong Trang Thuong

### Van de hien tai
`CamlyWalletPanel` tren trang Tang Thuong hien dang ket noi voi MetaMask va hien thi bat ky vi nao duoc ket noi (vi du `0xca31...a301`). Can thay doi de mac dinh hien thi vi Rewards `0xa4967da72d012151950627483285c3042957DA5d` va co nut chinh sua de ket noi vi khac.

### Giai phap

**File: `src/components/camly/CamlyWalletPanel.tsx`**

1. Them hang so `REWARDS_ADDRESS = '0xa4967da72d012151950627483285c3042957DA5d'`
2. Them state `useDefaultWallet` mac dinh `true`
3. Khi chua ket noi MetaMask: hien thi dia chi Rewards mac dinh (voi copy, BscScan link, nut "Chinh sua vi")
4. Nut "Chinh sua vi" (icon Pencil) -> goi `wallet.connectWallet()` de ket noi MetaMask
5. Khi da ket noi MetaMask: hien thi vi MetaMask + nut ngat ket noi (quay ve vi mac dinh)
6. `CamlyTransactionHistory` nhan `connectedAddress` la dia chi Rewards khi chua ket noi MetaMask (de luon hien thi lich su giao dich)
7. Phan "So du cua ban", Swap, SwapHistory chi hien khi ket noi MetaMask (giu nguyen logic hien tai)

### Ket qua
- Mac dinh: hien thi vi `0xa496...DA5d` voi lich su giao dich CAMLY
- Bam "Chinh sua vi": ket noi MetaMask de chuyen sang vi khac
- Bam "Ngat ket noi": quay ve vi Rewards mac dinh
- Khong con hien thi vi `0xca31...a301` nua (tru khi user chu dong ket noi lai vi do qua MetaMask)

### Chi tiet ky thuat

**Thay doi trong `CamlyWalletPanel.tsx`:**
- Import them `Pencil` tu lucide-react
- Them `REWARDS_ADDRESS` constant
- Them `useDefaultWallet` state
- Sua phan hien thi dia chi vi: khi `!wallet.isConnected` thi hien thi `REWARDS_ADDRESS` thay vi nut "Ket noi vi MetaMask"
- Them nut Pencil ben canh dia chi de trigger `connectWallet()`
- Truyen `displayAddress` (Rewards hoac MetaMask) vao `CamlyTransactionHistory`

