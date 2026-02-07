

# Nang cap "Gui CAMLY" - Luu ten nguoi nhan + Xac nhan + Lich su

## Tong Quan

Nang cap modal "Gui CAMLY" (`CamlySendModal`) de:
1. Them o nhap **ten nguoi nhan** (Recipient Name) - tu dong luu vao `address_labels`
2. Hien thi **man hinh xac nhan** truoc khi gui: "Tu [Ten nguoi gui] -> Den [Ten nguoi nhan]", so luong, gia tri USD
3. Sau khi gui thanh cong, **luu lich su gui** vao database va hien thi day du thong tin trong `CamlyTransactionHistory`

---

## 1. Them truong "Ten nguoi nhan" trong CamlySendModal

Them input "Ten nguoi nhan" ngay duoi truong "Dia chi nguoi nhan". Khi gui thanh cong, tu dong luu ten nay vao bang `address_labels` (da co san tu Dot 5) de lan sau tu dong hien ten.

**Cong viec:**
- Them state `recipientName` trong `CamlySendModal.tsx`
- Them input "Ten nguoi nhan (tuy chon)" phia duoi input dia chi
- Dung `useAddressLabels` hook da co: khi user nhap dia chi, auto-fill ten neu da co trong map
- Khi gui thanh cong va co ten: goi `addLabel.mutate({ address, label: recipientName })`

---

## 2. Man hinh xac nhan truoc khi gui

Sau khi user nhan "Gui CAMLY", hien thi man hinh xac nhan thay vi gui ngay. Man hinh nay gom:
- **Tu**: Ten nguoi gui (dia chi vi rut gon) 
- **Den**: Ten nguoi nhan (hoac dia chi rut gon neu khong nhap ten)
- **So luong**: X CAMLY (~ $Y)
- **Phi gas**: uoc tinh BNB
- Nut "Xac nhan gui" va "Quay lai"

**Cong viec:**
- Them state `step` ('form' | 'confirm' | 'success') trong `CamlySendModal.tsx`
- Step 'form': giao dien hien tai (nhap dia chi, ten, so luong)
- Step 'confirm': hien thi bang tom tat giao dich de user xac nhan
- Step 'success': hien thi ket qua thanh cong voi tx hash va link BscScan

---

## 3. Luu lich su gui vao database

Tao bang `camly_transfers` de luu lich su gui CAMLY truc tiep tu vi (khong phu thuoc sync-transactions).

**Cong viec:**
- Tao bang `camly_transfers` (id, sender_address, recipient_address, recipient_name, amount, usd_value, tx_hash, status, created_at)
- RLS: authenticated users co the INSERT, ai cung co the SELECT
- Sau khi gui thanh cong: INSERT vao bang nay
- Cap nhat `CamlyTransactionHistory.tsx`: query them tu `camly_transfers` de hien thi ten nguoi nhan

---

## 4. Hien thi ten nguoi nhan trong lich su giao dich

Cap nhat `CamlyTransactionHistory.tsx` de hien thi ten nguoi nhan/gui thay vi chi hien "Gui CAMLY" / "Nhan CAMLY".

**Cong viec:**
- Dung `useAddressLabels` hook de map dia chi -> ten
- Hien thi: "Gui den **[Ten nguoi nhan]**" hoac "Nhan tu **[Ten nguoi gui]**" voi ten mau vang gold
- Neu khong co ten: hien dia chi rut gon nhu cu

---

## Thu Tu Thuc Hien

| Buoc | Noi Dung | Files |
|------|----------|-------|
| 1 | Tao bang `camly_transfers` | Migration SQL |
| 2 | Them input ten + auto-fill + confirmation step | `CamlySendModal.tsx` |
| 3 | Luu lich su + luu label khi gui thanh cong | `CamlySendModal.tsx` |
| 4 | Hien thi ten trong lich su | `CamlyTransactionHistory.tsx` |

---

## Chi Tiet Ky Thuat

### Bang camly_transfers

```text
CREATE TABLE camly_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_name TEXT,
  amount NUMERIC NOT NULL,
  usd_value NUMERIC DEFAULT 0,
  tx_hash TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE camly_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view transfers" ON camly_transfers FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert" ON camly_transfers FOR INSERT TO authenticated WITH CHECK (true);
```

### CamlySendModal - 3 steps

```text
Step 'form':
  - Input: Dia chi nguoi nhan (0x...)
  - Input: Ten nguoi nhan (auto-fill tu address_labels)
  - Input: So luong CAMLY + MAX button
  - Button: "Tiep tuc" -> chuyen sang step 'confirm'

Step 'confirm':
  - Card: Tu [sender_address] -> Den [recipientName || shortenAddress]
  - So luong: X CAMLY (~ $Y)
  - Gas: ~Z BNB
  - Button: "Xac nhan gui" -> goi sendCamly + luu DB
  - Button: "Quay lai" -> ve step 'form'

Step 'success':
  - Icon check xanh
  - "Da gui thanh cong X CAMLY den [recipientName]"
  - Link BscScan
  - Button: "Dong"
```

### CamlyTransactionHistory cap nhat

```text
- Import useAddressLabels
- Voi moi tx:
  const counterparty = tx.direction === 'IN' ? tx.from_address : tx.to_address
  const { label, isLabeled } = getLabel(counterparty)
  Hien thi: "Gui den [label]" hoac "Nhan tu [label]"
  Neu isLabeled: class "text-yellow-500 font-semibold"
```

