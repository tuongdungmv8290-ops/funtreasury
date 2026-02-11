
## Xoa phan "Lich su giao dich CAMLY" khoi CamlyWalletPanel

### Thay doi

**File: `src/components/camly/CamlyWalletPanel.tsx`**

1. Xoa block "Transaction History" (dong 288-298): bao gom tieu de "Lich su giao dich CAMLY" va component `CamlyTransactionHistory`
2. Xoa dong `Separator` ngay truoc block do (dong 289)
3. Xoa import `CamlyTransactionHistory` (dong 17) vi khong con su dung

Ket qua: Phan lich su giao dich CAMLY se khong con hien thi trong wallet panel nua. Cac phan khac (bieu do gia, chi tiet, swap) giu nguyen.
