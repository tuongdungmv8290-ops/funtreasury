
# Nang Cap GiftDialog: Multi-Token Selector + Hieu Ung Gold

## Tong Quan

Nang cap GiftDialog de ho tro chon nhieu loai token (CAMLY, FUN Money, USDT, BNB, BTC) thay vi chi CAMLY, dong thoi them hieu ung vang gold lap lanh cho tieu de "Rewards" tren trang va sidebar.

---

## 1. Multi-Token Selector trong GiftDialog

Thay the layout co dinh "Camly Coin" bang mot dropdown chon token giong mockup, voi cac token:

| Token | Symbol | Loai | Badge |
|-------|--------|------|-------|
| FUN Money | FUNM | Noi bo | "Noi bo" (xanh) |
| Camly Coin | CAMLY | On-chain | - |
| Binance Coin | BNB | On-chain | - |
| Tether USD | USDT | On-chain | - |
| Bitcoin | BTC | On-chain | - |

**UI theo mockup:**
- Dropdown "Chon Token" voi emoji/logo + ten token + symbol
- Hien thi "So du: X [SYMBOL]" ben canh
- Token "FUN Money (FUNM)" co badge "Noi bo" mau xanh
- Nut submit tu dong cap nhat: "Tang 0 FUNM ->" hoac "Tang 500 CAMLY ->"

**Logic:**
- Khi chon FUNM: chuyen noi bo (khong can MetaMask), tuong tu tab "Camly Coin" hien tai
- Khi chon CAMLY/BNB/USDT/BTC: can vi Web3, tuong tu tab "Chuyen Crypto" hien tai
- USD value tu dong tinh theo `useRealtimePrices`

---

## 2. Xoa Tabs, Giao Dien Don Giong Mockup

Thay vi 2 tabs "Camly Coin" / "Chuyen Crypto", chuyen sang giao dien thong nhat:
- Header: "Thuong & Tang" voi icon
- Card nguoi gui (avatar + ten)
- Input "Nguoi nhan" (search profiles)
- Dropdown "Chon Token" voi so du
- Input so luong (hoac nhanh chon 100/500/1000)
- Textarea "Loi nhan yeu thuong" voi dem ky tu 0/200
- Button gradient rainbow: "Tang X [TOKEN] ->"

---

## 3. Hieu Ung Gold Lap Lanh cho "Rewards"

- Them CSS class `gold-shimmer` voi animation keyframe lap lanh
- Ap dung cho chu "Rewards" tren trang Rewards.tsx (h1)
- Ap dung cho nav item "Rewards" trong TreasurySidebar

---

## Chi Tiet Ky Thuat

### Files thay doi

| File | Thay doi |
|------|----------|
| `src/components/gifts/GiftDialog.tsx` | Viet lai: xoa Tabs, them token selector dropdown, giao dien theo mockup |
| `src/pages/Rewards.tsx` | Them CSS class gold-shimmer cho tieu de "Rewards" |
| `src/index.css` | Them keyframe animation `gold-shimmer` lap lanh |
| `src/components/layout/TreasurySidebar.tsx` | Them hieu ung gold cho nav "Rewards" |

### GiftDialog.tsx - Cau truc moi

```text
Dialog "Thuong & Tang"
  - Card nguoi gui: avatar + ten + "Nguoi gui"
  - Input "Nguoi nhan" (search profiles, avatar dropdown)
  - "Chon Token" dropdown:
    - FUN Money (FUNM) - badge "Noi bo"
    - Camly Coin (CAMLY)
    - Binance Coin (BNB)
    - Tether USD (USDT)
    - Bitcoin (BTC)
  - Hien thi "So du: X [TOKEN]"
  - Input so luong (placeholder "Hoac nhap so tuy chon...")
  - Textarea "Loi nhan yeu thuong" + dem 0/200
  - Button gradient: "Tang X [TOKEN] ->"
```

### Token Config Array

```text
GIFT_TOKENS = [
  { symbol: 'FUNM', name: 'FUN Money', emoji: globe, internal: true, badge: 'Noi bo' },
  { symbol: 'CAMLY', name: 'Camly Coin', logo: camlyLogo, internal: false },
  { symbol: 'BNB', name: 'Binance Coin', emoji: coin, internal: false },
  { symbol: 'USDT', name: 'Tether USD', emoji: dollar, internal: false },
  { symbol: 'BTC', name: 'Bitcoin', emoji: bitcoin, internal: false },
]
```

Khi token.internal === true: gui qua database (khong can MetaMask)
Khi token.internal === false: gui qua on-chain (can MetaMask + gas fee)

### CSS gold-shimmer animation

```text
@keyframes gold-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.gold-shimmer {
  background: linear-gradient(
    90deg,
    #C9A227 0%, #FFD700 25%, #FFF8DC 50%, #FFD700 75%, #C9A227 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gold-shimmer 3s linear infinite;
}
```

---

## Thu Tu Thuc Hien

| Buoc | Noi dung |
|------|----------|
| 1 | Them CSS `gold-shimmer` animation vao `index.css` |
| 2 | Viet lai `GiftDialog.tsx` voi token selector + giao dien mockup |
| 3 | Cap nhat `Rewards.tsx` tieu de voi hieu ung gold shimmer |
| 4 | Cap nhat `TreasurySidebar.tsx` nav Rewards voi hieu ung gold |
