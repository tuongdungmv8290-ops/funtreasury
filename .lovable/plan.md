

## Hien thi dia chi gui/nhan va ten vi trong danh sach giao dich

### Thay doi

**File: `src/components/rewards/RewardsWalletCard.tsx`**

1. **Tieu de vi**: Giu ten "FUN TREASURY (FUN PLAY)" (da dung)

2. **Import them `useAddressLabels`** tu `src/hooks/useAddressLabels.ts` de phan giai dia chi thanh ten

3. **Trong `WalletTransactionList`**:
   - Goi `useAddressLabels()` de lay ham `getLabel`
   - Voi moi giao dich, hien thi:
     - **Gui (OUT)**: "Gui den: [ten vi nhan hoac dia chi rut gon]"
     - **Nhan (IN)**: "Nhan tu: [ten vi gui hoac dia chi rut gon]"
   - Su dung `getLabel(tx.from_address)` va `getLabel(tx.to_address)` de hien thi ten neu co trong bang `wallets` hoac `address_labels`
   - Ten vi duoc highlight bang mau vang (gold) neu da duoc gan nhan

4. **Bo loc token**: Xoa `.in('token_symbol', CORE_TOKENS)` trong query de hien thi tat ca giao dich (khong chi 5 token chinh)

### Ket qua
- Moi giao dich se hien thi ro: gui tu vi nao, nhan vao vi nao
- Neu vi da duoc dat ten (trong he thong) thi hien thi ten thay cho dia chi
- Neu chua co ten thi hien thi dia chi rut gon (0x1234...5678)

### Chi tiet ky thuat
- `useAddressLabels()` tra ve ham `getLabel(address)` -> `{ label: string, isLabeled: boolean }`
- `isLabeled = true`: hien thi ten voi mau vang dam
- `isLabeled = false`: hien thi dia chi rut gon voi mau xam
- Them dong "Tu: ..." hoac "Den: ..." ngay duoi dong thoi gian trong moi item giao dich

