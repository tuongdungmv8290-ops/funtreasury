

# Nang Cap Trang Tang Thuong: Doi Text + Them Tinh Nang Luu Nguoi Nhan

## 1. Doi "FUN Rewards" thanh "FUN Tang Thuong"

Tren trang Rewards, header hien tai ghi "FUN Rewards". Can doi thanh "FUN Tang Thuong" voi hieu ung gold-shimmer.

**File: `src/pages/Rewards.tsx`** (dong 57)
- `FUN <span class="gold-shimmer">Rewards</span>` -> `FUN <span class="gold-shimmer">Tặng Thưởng</span>`

## 2. Them Tinh Nang Luu Ten Nguoi Nhan Moi (Giong MetaMask Address Book)

Su dung bang `address_labels` da co san trong database (cot: `address`, `label`, `created_by`) de luu danh ba nguoi nhan.

### Thay doi trong GiftDialog.tsx

Them muc "Danh ba da luu" vao tab "Chuyen Crypto" khi chon mode "Dia chi vi":

- Hien thi danh sach dia chi da luu (lay tu `address_labels` theo `created_by = user.id`)
- Nut "Luu nguoi nhan moi" de them ten + dia chi vi vao danh ba
- Khi chon tu danh sach, tu dong dien vao o dia chi vi
- Giao dien vien vang gold, noi bat, mượt ma

### Chi tiet giao dien

```text
Tab "Chuyen Crypto" > Mode "Dia chi vi":
  [Danh ba da luu]  (danh sach dropdown vien vang)
    - Ten 1 | 0x1234...5678  [Chon]
    - Ten 2 | 0xabcd...ef01  [Chon]
  
  [+ Luu nguoi nhan moi]  (nut vien vang, mo form inline)
    - Input: Ten nguoi nhan
    - Input: Dia chi vi (0x...)
    - Button: Luu (gradient vang)
```

### Hook moi: `useAddressBook.ts`

- `useAddressBook()`: Lay danh sach dia chi da luu cua user hien tai tu bang `address_labels`
- `useSaveAddress()`: Mutation de luu dia chi moi vao `address_labels`

### Flow nguoi dung

1. Mo GiftDialog > Tab "Chuyen Crypto" > Chon "Dia chi vi"
2. Thay danh sach dia chi da luu (neu co) + nut "Luu nguoi nhan moi"
3. Bam "Luu nguoi nhan moi" -> hien form inline nhap ten + dia chi -> Luu
4. Dia chi moi xuat hien trong danh sach, bam chon de tu dong dien

## 3. Nut "Tang Thuong" tren trang chinh

Nut hien tai da co gradient vang. Se tang cuong them hieu ung:
- Vien vang dam hon (`border-2 border-amber-400`)  
- Hieu ung glow khi hover (`shadow-amber-400/40`)
- Text "Tang Thuong" ro rang, noi bat

---

## Tong ket files thay doi

| File | Thay doi |
|------|----------|
| `src/pages/Rewards.tsx` | Doi "Rewards" -> "Tang Thuong", tang cuong style nut |
| `src/components/gifts/GiftDialog.tsx` | Them phan danh ba da luu + form luu nguoi nhan moi trong tab Crypto |
| `src/hooks/useAddressBook.ts` | Hook moi: query + mutation cho bang `address_labels` |

Khong can tao bang moi - su dung bang `address_labels` da co san.

