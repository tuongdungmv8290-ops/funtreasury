
# Nang Cap Giao Dien "Thuong Camly Coin" - Theo Mockup

## Tong Quan

Nang cap toan bo GiftDialog thanh giao dien giong mockup voi:
1. **Tabs "Camly Coin" / "Chuyen Crypto"** - 2 che do tang thuong
2. **Hien thi so du** voi gradient vang noi bat  
3. **2 cach nhap nguoi nhan**: "Dia chi vi" va "Tu ho so" (toggle buttons)
4. **Canh bao vi Web3** khi nguoi nhan chua dang ky vi
5. **Man hinh chuc mung** voi avatar nguoi gui/nhan, gradient cam, hieu ung phao hoa
6. **Bien nhan tang thuong** hien thi bai viet lien ket, avatar, logo CAMLY

---

## 1. Tab "Camly Coin" (Tang thuong noi bo qua database)

Giong screenshot 1: Hien balance "6.500 Camly Coin" bang gradient vang, tim nguoi nhan theo ten, nhap so luong (toi thieu 100), tin nhan tuy chon, nut "Xac nhan thuong".

- Che do nay **khong can vi Web3** - chi luu vao bang `gifts` nhu hien tai
- So du hien thi tu `useCamlyWallet` hoac tu database tuy ket noi

## 2. Tab "Chuyen Crypto" (Chuyen on-chain qua MetaMask)

Giong screenshot 2-4: Hien wallet balance voi dia chi rut gon, toggle "Dia chi vi" / "Tu ho so":
- **Dia chi vi**: Nhap truc tiep 0x...
- **Tu ho so**: Tim kiem profile, hien avatar, ten, canh bao "Nguoi nay chua dang ky vi Web3" neu profile khong co wallet_address

## 3. Man hinh chuc mung (Celebration)

Giong screenshot 5: Gradient cam-vang, logo CAMLY, avatar nguoi gui va nguoi nhan voi ten, so luong lon, loi nhan, timestamp, nut "Sao chep link" va "Dong".

## 4. Bien nhan (Receipt)

Giong screenshot 6: Header gradient vang "Bien Nhan Tang Thuong", avatar sender/receiver, so luong lon voi logo, loi nhan, hien thi bai viet lien ket, nut "Sao chep link" va "Ve trang chu".

---

## Database: Them cot wallet_address vao profiles

Hien tai bang `profiles` chua co `wallet_address`. Can them de biet nguoi nhan da dang ky vi Web3 hay chua.

```text
ALTER TABLE profiles ADD COLUMN wallet_address TEXT;
```

---

## Chi Tiet Ky Thuat

### File thay doi

| File | Thay doi |
|------|----------|
| Migration SQL | Them `wallet_address` vao `profiles` |
| `GiftDialog.tsx` | Viet lai hoan toan: Tabs, balance card, toggle dia chi vi/tu ho so, canh bao Web3, min amount 100 |
| `GiftCelebrationModal.tsx` | Nang cap: gradient cam, avatar nguoi gui/nhan, logo CAMLY, layout giong mockup |
| `useGifts.ts` > `useUserProfiles` | Query them `wallet_address` |

### GiftDialog.tsx - Cau truc moi

```text
Dialog "Thuong Camly Coin"
  Tabs:
    Tab "Camly Coin":
      - Balance card gradient vang: "So du cua ban: X Camly Coin"
      - Input tim nguoi nhan (search profiles)
      - Dropdown ket qua: avatar + ten
      - Selected: card profile voi avatar + ten + "Thay doi"
      - Input so luong (min 100, hint "Toi thieu 100 Camly Coin")
      - Textarea tin nhan (tuy chon)
      - Button "Xac nhan thuong" gradient vang

    Tab "Chuyen Crypto":
      - Balance card gradient vang: "So du CAMLY trong vi: X CAMLY" + dia chi rut gon
      - Toggle buttons: "Dia chi vi" | "Tu ho so"
      - Mode "Dia chi vi": Input 0x...
      - Mode "Tu ho so": 
        - Search input
        - Profile list voi avatar
        - Selected profile card + canh bao Web3 neu chua co wallet_address
      - Input so luong CAMLY
      - Hint "Can co BNB trong vi de thanh toan phi gas"
      - Button "Xac nhan chuyen" gradient cam
```

### GiftCelebrationModal.tsx - Layout moi

```text
Background: gradient tu #F97316 (orange) den #F59E0B (amber)
Header: Logo CAMLY (icon) + "Chuc mung ban da chuyen thanh cong!"
Body (card trang bo tron):
  - Row: Avatar nguoi gui + ten + arrow -> Avatar nguoi nhan + ten
  - Amount card (bo vang): "1.000 Camly Coin" voi icon
  - Message card (xam nhat): Loi nhan
  - Bai viet lien ket (xanh nhat): Tieu de bai viet (neu co post_id)
  - Timestamp
Footer: "Sao chep link" + "Dong" (gradient vang)
```

### useUserProfiles - Cap nhat query

```text
.select('user_id, display_name, email, avatar_url, wallet_address')
```

---

## Thu Tu Thuc Hien

| Buoc | Noi dung |
|------|----------|
| 1 | Migration: them `wallet_address` vao `profiles` |
| 2 | Cap nhat `useUserProfiles` query them wallet_address |
| 3 | Viet lai `GiftDialog.tsx` theo mockup voi Tabs + toggle + balance |
| 4 | Nang cap `GiftCelebrationModal.tsx` voi gradient cam + avatar layout |
