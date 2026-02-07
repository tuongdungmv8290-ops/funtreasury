
# Nang Cap GiftDialog: Tabs + Multi-Token Selector

## Tong Quan

Ket hop giao dien tabs ("Camly Coin" / "Chuyen Crypto") tu mockup voi he thong multi-token selector hien tai. Moi tab se co dropdown chon token phu hop.

---

## Thay Doi Chinh - File: `src/components/gifts/GiftDialog.tsx`

### Cau truc moi

```text
Dialog "Thuong Camly Coin"
  Tabs:
    Tab "Camly Coin" (noi bo - khong can MetaMask):
      - Token selector: FUN Money (FUNM), Camly Coin (CAMLY noi bo)
      - Balance card gradient vang: "So du cua ban: X [TOKEN]"
      - Tim nguoi nhan (search profiles, avatar dropdown)
      - Selected profile card voi avatar + ten + "Thay doi"
      - Input so luong (toi thieu 100, quick buttons 100/500/1000)
      - Textarea tin nhan (tuy chon, 200 ky tu)
      - Button "Xac nhan thuong" gradient vang

    Tab "Chuyen Crypto" (on-chain qua MetaMask):
      - Token selector: CAMLY, BNB, USDT, BTC
      - Balance card gradient vang: "So du [TOKEN] trong vi: X" + dia chi rut gon
      - Toggle "Dia chi vi" / "Tu ho so"
        - Dia chi vi: Input 0x...
        - Tu ho so: Search profiles, canh bao Web3 neu chua dang ky vi
      - Input so luong
      - Hint "Can co BNB de thanh toan phi gas"
      - Button "Xac nhan chuyen" gradient cam
```

### Token phan loai theo tab

| Tab | Tokens | Loai |
|-----|--------|------|
| Camly Coin | FUNM, CAMLY (noi bo) | Database transfer |
| Chuyen Crypto | CAMLY, BNB, USDT, BTC | On-chain MetaMask |

### Logic xu ly

- Tab "Camly Coin": Su dung `internal: true` logic, luu vao bang `gifts` qua database
- Tab "Chuyen Crypto": Su dung `internal: false` logic, goi MetaMask qua `sendGift` hook
- Token dropdown trong moi tab chi hien thi cac token thuoc tab do
- Balance hien thi tuong ung: FUNM tu DB, crypto tu wallet

### UI chi tiet theo mockup

1. **Header**: Icon + "Thuong Camly Coin" (gradient cam)
2. **Tabs**: 2 tab pills bo tron, tab active co nen trang + bong do
3. **Balance card**: Gradient vang `from-yellow-100 to-amber-50`, border vang, text lon bold
4. **Profile search**: Dropdown voi avatar, ten, scroll
5. **Selected profile**: Card voi avatar + ten + nut "Thay doi"
6. **Web3 warning**: Text cam "Nguoi nay chua dang ky vi Web3"
7. **Submit button**: Gradient tu amber-400 den orange-400, full width

---

## Files thay doi

| File | Thay doi |
|------|----------|
| `src/components/gifts/GiftDialog.tsx` | Them Tabs component, tach token theo tab, them toggle "Dia chi vi/Tu ho so" cho tab Crypto, giu lai token dropdown trong moi tab |

Khong can thay doi file khac - CSS gold-shimmer da co san, Rewards.tsx va TreasurySidebar.tsx da duoc cap nhat truoc do.
